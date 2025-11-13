#!/usr/bin/env python3
import requests
import sys
import time
import subprocess
import csv
import os
import requests
import urllib3
time.sleep(10)
# Suppress only the InsecureRequestWarning from urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Original session initializer
original_session_init = requests.Session.__init__
# Save the original session initializer
original_session_init = requests.Session.__init__

# Override the session initialization to disable SSL verification
def session_init_without_verification(self, *args, **kwargs):
    # Call the original initializer
    original_session_init(self, *args, **kwargs)
    # Disable SSL verification
    self.verify = False

# Apply the override to the requests.Session class
requests.Session.__init__ = session_init_without_verification


# Backend server URL
BASE_URL = 'https://localhost:"TODO"/api'

# Hardcoded credentials
USERNAME = '"TODO"'
PASSWORD = '"TODO"'

# Default settings
DEFAULT_UPDATE_INTERVAL = 5  # in seconds
DEFAULT_DEVICE_ID = '01'

def login_hardcoded():
    """Logs in using hardcoded credentials."""
    print("=== Auto Login ===")
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json={
            "username": USERNAME,
            "password": PASSWORD
        })
        if response.status_code == 200:
            token = response.json().get('token')
            if token:
                print("Login successful!")
                return token
            else:
                print("Login failed: No token received.")
                sys.exit(1)
        else:
            print(f"Login failed: {response.json().get('message')}")
            sys.exit(1)
    except requests.exceptions.RequestException as e:
        print(f"An error occurred during login: {e}")
        sys.exit(1)

def get_cpu_temperature():
    """Reads CPU temperature from sysfs and converts to Celsius."""
    try:
        with open('"TODO"/temp1_input', 'r') as f:
            temp_str = f.read().strip()
            temp_millidegree = int(temp_str)
            temp_celsius = temp_millidegree / 1000.0
            return temp_celsius
    except FileNotFoundError:
        print("CPU temperature file not found.")
        return None
    except Exception as e:
        print(f"Error reading CPU temperature: {e}")
        return None

def get_gpu_metrics():
    """Uses nvidia-smi to get GPU metrics."""
    try:
        cmd = [
            'nvidia-smi',
            '--query-gpu=temperature.gpu,utilization.gpu,clocks.current.sm,clocks.current.memory,clocks.current.video,clocks.current.graphics,power.draw,memory.used',
            '--format=csv,noheader,nounits'
        ]
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
        metrics = result.stdout.strip().split(', ')
        if len(metrics) < 8:
            print("Unexpected GPU metrics format.")
            return None
        gpu_temperature = float(metrics[0])
        gpu_utilization = float(metrics[1])
        sm_clock = float(metrics[2])
        memory_clock = float(metrics[3])
        video_clock = float(metrics[4])
        graphics_clock = float(metrics[5])
        power_draw = float(metrics[6])
        memory_used = float(metrics[7])
        
        return {
            "GPU_Temperature": gpu_temperature,
            "GPU_Utilization": gpu_utilization,
            "SM_Clock": sm_clock,
            "Memory_Clock": memory_clock,
            "MAX_Video_Graphic_Clock": max(video_clock, graphics_clock),
            "Power_Draw": power_draw,
            "GPU_Memory_Usage": memory_used  # This will be overridden by actual SYS memory usage
        }
    except subprocess.CalledProcessError as e:
        print(f"Error fetching GPU metrics: {e.stderr}")
        return None
    except Exception as e:
        print(f"Unexpected error fetching GPU metrics: {e}")
        return None
def get_network_transmit_bytes(interface='wlp10s0'):
    """Gets the number of transmitted bytes for the specified network interface."""
    try:
        with open('/proc/net/dev', 'r') as f:
            lines = f.readlines()
            for line in lines:
                if interface in line:
                    data = line.split()
                    # The 9th column is the transmitted bytes
                    return int(data[9]) + int(data[1]) 
        return None
    except Exception as e:
        print(f"Error reading network statistics: {e}")
        return None

def calculate_network_speed(initial_tx_bytes, current_tx_bytes, interval=1):
    """Calculates the network transmission speed in MB/s."""
    # Calculate speed in MBps
    speed_mbps = (current_tx_bytes - initial_tx_bytes) / (interval * 1024 * 1024)
    return speed_mbps

def get_sys_memory_usage():
    """Uses free to get system memory usage in GB (excluding cached)."""
    try:
        result = subprocess.run(['free', '-m'], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
        lines = result.stdout.strip().split('\n')
        mem_line = next((line for line in lines if line.startswith('Mem:')), None)
        if mem_line:
            parts = mem_line.split()
            # total_mem = float(parts[1])  # Total memory in GB
            used_mem = float(parts[2]) / float(1024)  # Used memory in GB
            # Excluding cached memory if needed
            return used_mem
        else:
            print("Memory information not found.")
            return None
    except subprocess.CalledProcessError as e:
        print(f"Error fetching memory usage: {e.stderr}")
        return None
    except Exception as e:
        print(f"Unexpected error fetching memory usage: {e}")
        return None

def upload_metrics(token, device_id):
    """Collects metrics and uploads them to the server."""
    prev_tx_bytes = get_network_transmit_bytes()
    last_timestamp = time.time()
    TOTAL_fail = 0
    while True:
        data = {}
        timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

        # Get CPU Temperature
        cpu_temp = get_cpu_temperature()
        # print(cpu_temp)
        if cpu_temp is not None:
            data["CPU_Temperature"] = cpu_temp
        sys_mem = get_sys_memory_usage()
        if sys_mem is not None:
            data["SYS_Memory_Usage"] = sys_mem

        # Get GPU Metrics
        gpu_metrics = get_gpu_metrics()
        # print(gpu_metrics)
        if gpu_metrics:
            # Overriding SYS_Memory_Usage with actual system memory usage

            # Remove LOG as per requirement
            if "LOG" in data:
                del data["LOG"]

            # Exclude LOG key
            # Note: Assuming LOG is handled separately
            # If LOG needs to be updated, implement separately

            # Prepare payload
            for key, value in gpu_metrics.items():
                if key != "LOG":
                    data[key] = value
        current_tx_bytes = get_network_transmit_bytes()
        current_timestamp = time.time()
        if current_tx_bytes is not None and prev_tx_bytes is not None:
            interval = current_timestamp - last_timestamp
            net_speed = calculate_network_speed(prev_tx_bytes, current_tx_bytes, interval)
            data["Network_Transmit_Speed_MBps"] = net_speed
        prev_tx_bytes = current_tx_bytes
        last_timestamp = current_timestamp
        # Prepare data payload
        payload = []
        for key, value in data.items():
            payload.append({
                "key": key,
                "machine": device_id,
                "value": value,
                "timestamp": timestamp
            })

        # Send data
        try:
            response = requests.post(f"{BASE_URL}/data/bulk",  # Assuming a bulk endpoint exists
                                     headers={"Authorization": f"Bearer {token}"},
                                     json=payload)
            if response.status_code == 201:
                # print(f"[{timestamp}] Metrics uploaded successfully.")
                pass
            else:
                print(f"[{timestamp}] Failed to upload metrics: {response.json().get('message')}")
                TOTAL_fail += 1
        except requests.exceptions.RequestException as e:
            print(f"[{timestamp}] An error occurred while uploading metrics: {e}")
            TOTAL_fail += 1

        # Wait for the next update
        time.sleep(DEFAULT_UPDATE_INTERVAL)
        if TOTAL_fail >= 5:
            print("Failed to upload metrics 5 times. Exiting...")
            break
def main():
    print("Welcome to the Automated System Monitor and Uploader")
    token = login_hardcoded()
    
    # Start uploading metrics
    print(f"Starting to upload metrics every {DEFAULT_UPDATE_INTERVAL} seconds for device ID '{DEFAULT_DEVICE_ID}'...")
    upload_metrics(token, DEFAULT_DEVICE_ID)

if __name__ == "__main__":
    main()
