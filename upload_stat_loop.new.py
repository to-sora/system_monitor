#!/usr/bin/env python3
"""
System Monitor Data Upload Script - Production Ready
Collects system metrics and uploads to backend server
"""

import requests
import sys
import time
import subprocess
import os
import urllib3
from pathlib import Path

# Configuration from environment variables
BASE_URL = os.getenv('SYSTEM_MONITOR_API_URL', 'https://localhost:3000/api')
USERNAME = os.getenv('SYSTEM_MONITOR_USERNAME')
PASSWORD = os.getenv('SYSTEM_MONITOR_PASSWORD')
DEVICE_ID = os.getenv('SYSTEM_MONITOR_DEVICE_ID', '01')
UPDATE_INTERVAL = int(os.getenv('SYSTEM_MONITOR_INTERVAL', '5'))
NETWORK_INTERFACE = os.getenv('SYSTEM_MONITOR_NETWORK_INTERFACE', 'auto')
CPU_TEMP_PATH = os.getenv('SYSTEM_MONITOR_CPU_TEMP_PATH', '/sys/class/hwmon/hwmon0/temp1_input')

# SSL Configuration
SSL_VERIFY = os.getenv('SYSTEM_MONITOR_SSL_VERIFY', 'true').lower() == 'true'
SSL_CERT_PATH = os.getenv('SYSTEM_MONITOR_SSL_CERT')

# Retry configuration
MAX_RETRY_ATTEMPTS = 5
RETRY_BACKOFF = 2  # seconds

# Suppress SSL warnings only if verification is disabled
if not SSL_VERIFY:
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    print("Warning: SSL verification is disabled. This is insecure!")

def get_ssl_config():
    """Get SSL configuration for requests"""
    if not SSL_VERIFY:
        return False
    elif SSL_CERT_PATH and os.path.exists(SSL_CERT_PATH):
        return SSL_CERT_PATH
    else:
        return True  # Use system CA bundle

def login():
    """Login using credentials from environment variables"""
    if not USERNAME or not PASSWORD:
        print("Error: SYSTEM_MONITOR_USERNAME and SYSTEM_MONITOR_PASSWORD must be set")
        sys.exit(1)

    print("=== Logging in ===")
    for attempt in range(MAX_RETRY_ATTEMPTS):
        try:
            response = requests.post(
                f"{BASE_URL}/auth/login",
                json={"username": USERNAME, "password": PASSWORD},
                verify=get_ssl_config(),
                timeout=10
            )
            if response.status_code == 200:
                token = response.json().get('token')
                if token:
                    print("✓ Login successful")
                    return token
                else:
                    print("✗ Login failed: No token received")
                    sys.exit(1)
            else:
                print(f"✗ Login failed: {response.json().get('message')}")
                if attempt < MAX_RETRY_ATTEMPTS - 1:
                    wait_time = RETRY_BACKOFF ** attempt
                    print(f"  Retrying in {wait_time} seconds...")
                    time.sleep(wait_time)
                else:
                    sys.exit(1)
        except requests.exceptions.RequestException as e:
            print(f"✗ Login error: {e}")
            if attempt < MAX_RETRY_ATTEMPTS - 1:
                wait_time = RETRY_BACKOFF ** attempt
                print(f"  Retrying in {wait_time} seconds...")
                time.sleep(wait_time)
            else:
                sys.exit(1)

def detect_network_interface():
    """Auto-detect active network interface"""
    try:
        result = subprocess.run(['ip', 'route'], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        for line in result.stdout.split('\n'):
            if 'default' in line:
                parts = line.split()
                if 'dev' in parts:
                    idx = parts.index('dev')
                    if idx + 1 < len(parts):
                        return parts[idx + 1]
        # Fallback: use first non-loopback interface
        result = subprocess.run(['ip', 'link', 'show'], stdout=subprocess.PIPE, text=True)
        for line in result.stdout.split('\n'):
            if 'state UP' in line and 'lo:' not in line:
                parts = line.split(':')
                if len(parts) >= 2:
                    return parts[1].strip()
    except Exception as e:
        print(f"Warning: Could not auto-detect network interface: {e}")
    return 'eth0'  # Final fallback

def get_cpu_temperature():
    """Read CPU temperature from sysfs"""
    try:
        if not os.path.exists(CPU_TEMP_PATH):
            print(f"Warning: CPU temperature sensor not found at {CPU_TEMP_PATH}")
            return None

        with open(CPU_TEMP_PATH, 'r') as f:
            temp_str = f.read().strip()
            temp_millidegree = int(temp_str)
            temp_celsius = temp_millidegree / 1000.0
            return temp_celsius
    except FileNotFoundError:
        print("Warning: CPU temperature file not found")
        return None
    except Exception as e:
        print(f"Warning: Error reading CPU temperature: {e}")
        return None

def get_gpu_metrics():
    """Get GPU metrics using nvidia-smi"""
    try:
        cmd = [
            'nvidia-smi',
            '--query-gpu=temperature.gpu,utilization.gpu,clocks.current.sm,clocks.current.memory,clocks.current.video,clocks.current.graphics,power.draw,memory.used',
            '--format=csv,noheader,nounits'
        ]
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True, timeout=5)
        metrics = result.stdout.strip().split(', ')

        if len(metrics) < 8:
            print("Warning: Unexpected GPU metrics format")
            return None

        return {
            "GPU_Temperature": float(metrics[0]),
            "GPU_Utilization": float(metrics[1]),
            "SM_Clock": float(metrics[2]),
            "Memory_Clock": float(metrics[3]),
            "MAX_Video_Graphic_Clock": max(float(metrics[4]), float(metrics[5])),
            "Power_Draw": float(metrics[6]),
            "GPU_Memory_Usage": float(metrics[7])
        }
    except subprocess.CalledProcessError as e:
        print(f"Warning: Error fetching GPU metrics: {e.stderr}")
        return None
    except Exception as e:
        print(f"Warning: Unexpected error fetching GPU metrics: {e}")
        return None

def get_network_transmit_bytes(interface):
    """Get transmitted + received bytes for network interface"""
    try:
        with open('/proc/net/dev', 'r') as f:
            lines = f.readlines()
            for line in lines:
                if interface in line:
                    data = line.split()
                    # Column 1 = received bytes, Column 9 = transmitted bytes
                    return int(data[9]) + int(data[1])
        return None
    except Exception as e:
        print(f"Warning: Error reading network statistics: {e}")
        return None

def calculate_network_speed(initial_tx_bytes, current_tx_bytes, interval):
    """Calculate network transmission speed in MB/s"""
    speed_mbps = (current_tx_bytes - initial_tx_bytes) / (interval * 1024 * 1024)
    return max(0, speed_mbps)  # Prevent negative values

def get_sys_memory_usage():
    """Get system memory usage in GB"""
    try:
        result = subprocess.run(['free', '-m'], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True, timeout=5)
        lines = result.stdout.strip().split('\n')
        mem_line = next((line for line in lines if line.startswith('Mem:')), None)
        if mem_line:
            parts = mem_line.split()
            used_mem = float(parts[2]) / 1024.0  # Convert to GB
            return used_mem
        else:
            print("Warning: Memory information not found")
            return None
    except Exception as e:
        print(f"Warning: Error fetching memory usage: {e}")
        return None

def upload_metrics(token, device_id, network_interface):
    """Collect metrics and upload them to the server"""
    prev_tx_bytes = get_network_transmit_bytes(network_interface)
    last_timestamp = time.time()
    consecutive_failures = 0

    print(f"✓ Starting metric upload (interval: {UPDATE_INTERVAL}s, device: {device_id})")

    while True:
        try:
            data = {}
            timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

            # Get CPU Temperature
            cpu_temp = get_cpu_temperature()
            if cpu_temp is not None:
                data["CPU_Temperature"] = cpu_temp

            # Get System Memory
            sys_mem = get_sys_memory_usage()
            if sys_mem is not None:
                data["SYS_Memory_Usage"] = sys_mem

            # Get GPU Metrics
            gpu_metrics = get_gpu_metrics()
            if gpu_metrics:
                for key, value in gpu_metrics.items():
                    data[key] = value

            # Get Network Speed
            current_tx_bytes = get_network_transmit_bytes(network_interface)
            current_timestamp = time.time()
            if current_tx_bytes is not None and prev_tx_bytes is not None:
                interval = current_timestamp - last_timestamp
                net_speed = calculate_network_speed(prev_tx_bytes, current_tx_bytes, interval)
                data["Network_Transmit_Speed_MBps"] = net_speed
            prev_tx_bytes = current_tx_bytes
            last_timestamp = current_timestamp

            # Prepare payload
            payload = []
            for key, value in data.items():
                payload.append({
                    "key": key,
                    "machine": device_id,
                    "value": value,
                    "timestamp": timestamp
                })

            if not payload:
                print(f"[{timestamp}] Warning: No metrics collected")
                time.sleep(UPDATE_INTERVAL)
                continue

            # Send data
            response = requests.post(
                f"{BASE_URL}/data/bulk",
                headers={"Authorization": f"Bearer {token}"},
                json=payload,
                verify=get_ssl_config(),
                timeout=10
            )

            if response.status_code == 201:
                consecutive_failures = 0
                # Only print every 10 uploads to reduce log spam
                if int(time.time()) % (UPDATE_INTERVAL * 10) == 0:
                    print(f"[{timestamp}] ✓ Metrics uploaded ({len(payload)} values)")
            else:
                consecutive_failures += 1
                print(f"[{timestamp}] ✗ Upload failed: {response.json().get('message')}")

        except requests.exceptions.RequestException as e:
            consecutive_failures += 1
            print(f"[{time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}] ✗ Upload error: {e}")

        except Exception as e:
            consecutive_failures += 1
            print(f"[{time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}] ✗ Unexpected error: {e}")

        # Retry logic with exponential backoff
        if consecutive_failures >= MAX_RETRY_ATTEMPTS:
            wait_time = min(RETRY_BACKOFF ** consecutive_failures, 300)  # Max 5 minutes
            print(f"Too many failures ({consecutive_failures}). Waiting {wait_time}s before retry...")
            time.sleep(wait_time)
            # Try to re-login
            try:
                token = login()
                consecutive_failures = 0
            except:
                pass
        else:
            time.sleep(UPDATE_INTERVAL)

def main():
    print("=" * 60)
    print("System Monitor - Data Upload Script v2.0")
    print("=" * 60)
    print(f"API URL: {BASE_URL}")
    print(f"Device ID: {DEVICE_ID}")
    print(f"Update Interval: {UPDATE_INTERVAL}s")
    print(f"SSL Verify: {SSL_VERIFY}")
    print("=" * 60)

    # Detect network interface if set to auto
    network_interface = NETWORK_INTERFACE
    if network_interface == 'auto':
        network_interface = detect_network_interface()
        print(f"✓ Detected network interface: {network_interface}")
    else:
        print(f"✓ Using network interface: {network_interface}")

    # Login
    token = login()

    # Start uploading metrics
    upload_metrics(token, DEVICE_ID, network_interface)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n✓ Shutting down gracefully...")
        sys.exit(0)
