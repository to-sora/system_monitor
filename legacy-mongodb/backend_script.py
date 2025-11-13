#!/usr/bin/env python3
import requests
import getpass
import sys

# Backend server URL
BASE_URL = 'https://localhost:port/api'
original_session_init = requests.Session.__init__

# Override the session initialization to disable SSL verification
def session_init_without_verification(self, *args, **kwargs):
    # Call the original initializer
    original_session_init(self, *args, **kwargs)
    # Disable SSL verification
    self.verify = False

# Apply the override to the requests.Session class
requests.Session.__init__ = session_init_without_verification

def login():
    print("=== Login ===")
    username = input("Username: ")
    password = getpass.getpass("Password: ")

    try:
        response = requests.post(f"{BASE_URL}/auth/login", json={
            "username": username,
            "password": password
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

def register_user(token):
    print("=== Register New User ===")
    username = input("New Username: ")
    password = getpass.getpass("New Password: ")
    is_admin_input = input("Is Admin? (y/n): ").strip().lower()
    is_admin = True if is_admin_input == 'y' else False

    try:
        response = requests.post(f"{BASE_URL}/auth/register",
                                 headers={"Authorization": f"Bearer {token}"},
                                 json={
                                     "username": username,
                                     "password": password,
                                     "isAdmin": is_admin
                                 })
        if response.status_code == 201:
            print("User registered successfully.")
        else:
            print(f"Failed to register user: {response.json().get('message')}")
    except requests.exceptions.RequestException as e:
        print(f"An error occurred during user registration: {e}")

def list_devices(token):
    print("=== List All Devices ===")
    try:
        response = requests.get(f"{BASE_URL}/devices",
                                headers={"Authorization": f"Bearer {token}"})
        if response.status_code == 200:
            devices = response.json().get('devices', [])
            if devices:
                for device in devices:
                    print(f"Device ID: {device.get('deviceId')}, Name: {device.get('name')}, Description: {device.get('description')}")
            else:
                print("No devices found.")
        else:
            print(f"Failed to retrieve devices: {response.json().get('message')}")
    except requests.exceptions.RequestException as e:
        print(f"An error occurred while fetching devices: {e}")

def create_device(token):
    print("=== Create New Device ===")
    device_id = input("Device ID: ")
    name = input("Device Name: ")
    description = input("Description (optional): ")

    try:
        response = requests.post(f"{BASE_URL}/devices",
                                 headers={"Authorization": f"Bearer {token}"},
                                 json={
                                     "deviceId": device_id,
                                     "name": name,
                                     "description": description
                                 })
        if response.status_code == 201:
            print("Device created successfully.")
        else:
            print(f"Failed to create device: {response.json().get('message')}")
    except requests.exceptions.RequestException as e:
        print(f"An error occurred while creating device: {e}")

def update_device(token):
    print("=== Update Device ===")
    device_id = input("Device ID to update: ")
    name = input("New Device Name (leave blank to keep unchanged): ")
    description = input("New Description (leave blank to keep unchanged): ")

    update_data = {}
    if name:
        update_data['name'] = name
    if description:
        update_data['description'] = description

    if not update_data:
        print("No updates provided.")
        return

    try:
        response = requests.put(f"{BASE_URL}/devices/{device_id}",
                                headers={"Authorization": f"Bearer {token}"},
                                json=update_data)
        if response.status_code == 200:
            print("Device updated successfully.")
        else:
            print(f"Failed to update device: {response.json().get('message')}")
    except requests.exceptions.RequestException as e:
        print(f"An error occurred while updating device: {e}")

def delete_device(token):
    print("=== Delete Device ===")
    device_id = input("Device ID to delete: ")
    confirm = input(f"Are you sure you want to delete device '{device_id}'? (y/n): ").strip().lower()
    if confirm != 'y':
        print("Deletion cancelled.")
        return

    try:
        response = requests.delete(f"{BASE_URL}/devices/{device_id}",
                                   headers={"Authorization": f"Bearer {token}"})
        if response.status_code == 200:
            print("Device deleted successfully.")
        else:
            print(f"Failed to delete device: {response.json().get('message')}")
    except requests.exceptions.RequestException as e:
        print(f"An error occurred while deleting device: {e}")

def list_keys(token):
    print("=== List All Keys ===")
    try:
        response = requests.get(f"{BASE_URL}/keys",
                                headers={"Authorization": f"Bearer {token}"})
        if response.status_code == 200:
            keys = response.json().get('dataTypes', []) or response.json().get('keys', [])
            if keys:
                for key in keys:
                    print(f"Key Name: {key.get('keyName')}, Data Type: {key.get('dataType')}")
            else:
                print("No keys found.")
        else:
            print(f"Failed to retrieve keys: {response.json().get('message')}")
    except requests.exceptions.RequestException as e:
        print(f"An error occurred while fetching keys: {e}")

def create_key(token):
    print("=== Create New Key ===")
    key_name = input("Key Name: ")
    data_type = input("Data Type (float/message): ").strip().lower()
    normal_min = input("Normal Range Minimum (leave blank if not applicable): ")
    normal_max = input("Normal Range Maximum (leave blank if not applicable): ")
    warning_min = input("Warning Range Minimum (leave blank if not applicable): ")
    warning_max = input("Warning Range Maximum (leave blank if not applicable): ")
    missing_data_allowance = input("Missing Data Allowance (in seconds): ")
    email_alert_min = input("Email Alert Range Minimum (leave blank if not applicable): ")
    email_alert_max = input("Email Alert Range Maximum (leave blank if not applicable): ")

    normal_range = None
    if normal_min and normal_max:
        normal_range = {"min": float(normal_min), "max": float(normal_max)}

    warning_range = None
    if warning_min and warning_max:
        warning_range = {"min": float(warning_min), "max": float(warning_max)}

    email_alert_range = None
    if email_alert_min and email_alert_max:
        email_alert_range = {"min": float(email_alert_min), "max": float(email_alert_max)}

    try:
        response = requests.post(f"{BASE_URL}/keys",
                                 headers={"Authorization": f"Bearer {token}"},
                                 json={
                                     "keyName": key_name,
                                     "dataType": data_type,
                                     "normalRange": normal_range,
                                     "warningRange": warning_range,
                                     "missingDataAllowance": float(missing_data_allowance),
                                     "emailAlertRange": email_alert_range
                                 })
        if response.status_code == 201:
            print("Key created successfully.")
        else:
            print(f"Failed to create key: {response.json().get('message')}")
    except requests.exceptions.RequestException as e:
        print(f"An error occurred while creating key: {e}")

def update_key(token):
    print("=== Update Key ===")
    key_name = input("Key Name to update: ")
    print("Enter new values (leave blank to keep unchanged):")
    data_type = input("New Data Type (float/message): ").strip().lower()
    normal_min = input("New Normal Range Minimum: ")
    normal_max = input("New Normal Range Maximum: ")
    warning_min = input("New Warning Range Minimum: ")
    warning_max = input("New Warning Range Maximum: ")
    missing_data_allowance = input("New Missing Data Allowance (in seconds): ")
    email_alert_min = input("New Email Alert Range Minimum: ")
    email_alert_max = input("New Email Alert Range Maximum: ")

    update_data = {}
    if data_type:
        update_data['dataType'] = data_type
    if normal_min and normal_max:
        update_data['normalRange'] = {"min": float(normal_min), "max": float(normal_max)}
    if warning_min and warning_max:
        update_data['warningRange'] = {"min": float(warning_min), "max": float(warning_max)}
    if missing_data_allowance:
        update_data['missingDataAllowance'] = float(missing_data_allowance)
    if email_alert_min and email_alert_max:
        update_data['emailAlertRange'] = {"min": float(email_alert_min), "max": float(email_alert_max)}

    if not update_data:
        print("No updates provided.")
        return

    try:
        response = requests.put(f"{BASE_URL}/keys/{key_name}",
                                headers={"Authorization": f"Bearer {token}"},
                                json=update_data)
        if response.status_code == 200:
            print("Key updated successfully.")
        else:
            print(f"Failed to update key: {response.json().get('message')}")
    except requests.exceptions.RequestException as e:
        print(f"An error occurred while updating key: {e}")

def delete_key(token):
    print("=== Delete Key ===")
    key_name = input("Key Name to delete: ")
    confirm = input(f"Are you sure you want to delete key '{key_name}'? (y/n): ").strip().lower()
    if confirm != 'y':
        print("Deletion cancelled.")
        return

    try:
        response = requests.delete(f"{BASE_URL}/keys/{key_name}",
                                   headers={"Authorization": f"Bearer {token}"})
        if response.status_code == 200:
            print("Key deleted successfully.")
        else:
            print(f"Failed to delete key: {response.json().get('message')}")
    except requests.exceptions.RequestException as e:
        print(f"An error occurred while deleting key: {e}")

def upload_data_value(token):
    print("=== Upload DataValue ===")
    key = input("Key Name: ")
    machine = input("Machine (Device ID): ")
    value = input("Value: ")
    timestamp = input("Timestamp (ISO 8601 format, e.g., 2024-09-19T14:00:00Z): ")

    try:
        value = float(value) if '.' in value or 'e' in value.lower() else value
    except ValueError:
        pass  # Keep as string for message types

    try:
        response = requests.post(f"{BASE_URL}/data",
                                 headers={"Authorization": f"Bearer {token}"},
                                 json={
                                     "key": key,
                                     "machine": machine,
                                     "value": value,
                                     "timestamp": timestamp
                                 })
        if response.status_code == 201:
            print("DataValue uploaded successfully.")
        else:
            print(f"Failed to upload DataValue: {response.json().get('message')}")
    except requests.exceptions.RequestException as e:
        print(f"An error occurred while uploading DataValue: {e}")

def fetch_daily_data(token):
    print("=== Fetch Daily Data ===")
    device = input("Device ID: ")
    keys_input = input("Keys (comma-separated): ")
    range_ = input("Time Range (e.g., 24h, 12h, 3h, 1h, 30m): ")

    keys = [k.strip() for k in keys_input.split(',') if k.strip()]

    if not keys:
        print("No valid keys provided.")
        return

    params = {
        "device": device,
        "keys": keys,
        "range": range_
    }

    try:
        response = requests.get(f"{BASE_URL}/data/daily",
                                headers={"Authorization": f"Bearer {token}"},
                                params=params)
        if response.status_code == 200:
            data = response.json().get('data', {})
            if not data:
                print("No data available for the selected parameters.")
                return
            for key, details in data.items():
                print(f"\nKey: {key}")
                print(f"Type: {details.get('type')}")
                print("Values:")
                for entry in details.get('values', []):
                    print(f" - {entry.get('timestamp')}: {entry.get('value')}")
        else:
            print(f"Failed to fetch daily data: {response.json().get('message')}")
    except requests.exceptions.RequestException as e:
        print(f"An error occurred while fetching daily data: {e}")

def fetch_monthly_data(token):
    print("=== Fetch Monthly Aggregated Data ===")
    device = input("Device ID: ")
    key = input("Key Name: ")

    params = {
        "device": device,
        "key": key
    }

    try:
        response = requests.get(f"{BASE_URL}/data/month",
                                headers={"Authorization": f"Bearer {token}"},
                                params=params)
        if response.status_code == 200:
            data = response.json().get('data', {})
            if not data:
                print("No aggregated data available for the selected parameters.")
                return
            print(f"\nAggregated Data for Key '{key}' on Device '{device}':")
            print(f" - Minimum: {data.get('min')}")
            print(f" - Maximum: {data.get('max')}")
            print(f" - Median: {data.get('median')}")
            print(f" - Mean: {data.get('mean')}")
            print(f" - Area Under Curve (AUC): {data.get('auc')}")
        else:
            print(f"Failed to fetch monthly data: {response.json().get('message')}")
    except requests.exceptions.RequestException as e:
        print(f"An error occurred while fetching monthly data: {e}")
def delete_all_keys(token):
    print("=== Delete All Keys ===")
    try:
        response = requests.get(f"{BASE_URL}/keys",
                                headers={"Authorization": f"Bearer {token}"})
        if response.status_code == 200:
            keys = response.json().get('dataTypes', []) or response.json().get('keys', [])
            if keys:
                for key in keys:
                    key_name = key.get('keyName')
                    delete_response = requests.delete(f"{BASE_URL}/keys/{key_name}",
                                                      headers={"Authorization": f"Bearer {token}"})
                    if delete_response.status_code == 200:
                        print(f"Deleted key: {key_name}")
                    else:
                        print(f"Failed to delete key '{key_name}': {delete_response.json().get('message')}")
            else:
                print("No keys found.")
        else:
            print(f"Failed to retrieve keys: {response.json().get('message')}")
    except requests.exceptions.RequestException as e:
        print(f"An error occurred while deleting all keys: {e}")
def delete_all_devices(token):
    print("=== Delete All Devices ===")
    try:
        response = requests.get(f"{BASE_URL}/devices",
                                headers={"Authorization": f"Bearer {token}"})
        if response.status_code == 200:
            devices = response.json().get('devices', [])
            if devices:
                for device in devices:
                    device_id = device.get('deviceId')
                    delete_response = requests.delete(f"{BASE_URL}/devices/{device_id}",
                                                      headers={"Authorization": f"Bearer {token}"})
                    if delete_response.status_code == 200:
                        print(f"Deleted device: {device_id}")
                    else:
                        print(f"Failed to delete device '{device_id}': {delete_response.json().get('message')}")
            else:
                print("No devices found.")
        else:
            print(f"Failed to retrieve devices: {response.json().get('message')}")
    except requests.exceptions.RequestException as e:
        print(f"An error occurred while deleting all devices: {e}")
import csv

def create_keys_from_csv(token, csv_path):
    print(f"=== Create Keys from CSV ({csv_path}) ===")
    
    try:
        with open(csv_path, mode='r') as csvfile:
            csv_reader = csv.DictReader(csvfile)
            
            for row in csv_reader:
                key_name = row.get('keyName')
                data_type = row.get('dataType')
                normal_range = {
                    "min": float(row['normalMin']) if row.get('normalMin') else None,
                    "max": float(row['normalMax']) if row.get('normalMax') else None
                } if row.get('normalMin') and row.get('normalMax') else None

                warning_range = {
                    "min": float(row['warningMin']) if row.get('warningMin') else None,
                    "max": float(row['warningMax']) if row.get('warningMax') else None
                } if row.get('warningMin') and row.get('warningMax') else None

                email_alert_range = {
                    "min": float(row['emailAlertMin']) if row.get('emailAlertMin') else None,
                    "max": float(row['emailAlertMax']) if row.get('emailAlertMax') else None
                } if row.get('emailAlertMin') and row.get('emailAlertMax') else None

                missing_data_allowance = float(row['missingDataAllowance']) if row.get('missingDataAllowance') else None

                payload = {
                    "keyName": key_name,
                    "dataType": data_type,
                    "normalRange": normal_range,
                    "warningRange": warning_range,
                    "missingDataAllowance": missing_data_allowance,
                    "emailAlertRange": email_alert_range
                }

                # Clean up None values in payload
                payload = {k: v for k, v in payload.items() if v is not None}

                try:
                    response = requests.post(f"{BASE_URL}/keys",
                                             headers={"Authorization": f"Bearer {token}"},
                                             json=payload)
                    if response.status_code == 201:
                        print(f"Created key: {key_name}")
                    else:
                        print(f"Failed to create key '{key_name}': {response.json().get('message')}")
                except requests.exceptions.RequestException as e:
                    print(f"An error occurred while creating key '{key_name}': {e}")

    except FileNotFoundError:
        print(f"File not found: {csv_path}")
    except Exception as e:
        print(f"An error occurred while reading the CSV file: {e}")

def main_menu(token):
    while True:
        print("\n=== API CLI Menu ===")
        print("1. Register New User")
        print("2. List All Devices")
        print("3. Create New Device")
        print("4. Update Device")
        print("5. Delete Device")
        print("6. List All Keys")
        print("7. Create New Key")
        print("8. Update Key")
        print("9. Delete Key")
        print("10. Upload DataValue")
        print("11. Fetch Daily Data")
        print("12. Fetch Monthly Aggregated Data")
        print("13. Exit")

        choice = input("Select an option (1-13): ").strip()

        if choice == '1':
            register_user(token)
        elif choice == '2':
            list_devices(token)
        elif choice == '3':
            create_device(token)
        elif choice == '4':
            update_device(token)
        elif choice == '5':
            delete_device(token)
        elif choice == '6':
            list_keys(token)
        elif choice == '7':
            create_key(token)
        elif choice == '8':
            update_key(token)
        elif choice == '9':
            delete_key(token)
        elif choice == '10':
            upload_data_value(token)
        elif choice == '11':
            fetch_daily_data(token)
        elif choice == '12':
            fetch_monthly_data(token)
        elif choice == '13':
            print("Exiting CLI. Goodbye!")
            sys.exit(0)
        else:
            print("Invalid option. Please select a number between 1 and 13.")
def main_menu(token):
    while True:
        print("\n=== API CLI Menu ===")
        print("1. Register New User")
        print("2. List All Devices")
        print("3. Create New Device")
        print("4. Update Device")
        print("5. Delete Device")
        print("6. List All Keys")
        print("7. Create New Key")
        print("8. Update Key")
        print("9. Delete Key")
        print("10. Upload DataValue")
        print("11. Fetch Daily Data")
        print("12. Fetch Monthly Aggregated Data")
        print("13. Delete All Keys")
        print("14. Delete All Devices")
        print("15. Create Keys from CSV")
        print("16. Exit")

        choice = input("Select an option (1-16): ").strip()

        if choice == '1':
            register_user(token)
        elif choice == '2':
            list_devices(token)
        elif choice == '3':
            create_device(token)
        elif choice == '4':
            update_device(token)
        elif choice == '5':
            delete_device(token)
        elif choice == '6':
            list_keys(token)
        elif choice == '7':
            create_key(token)
        elif choice == '8':
            update_key(token)
        elif choice == '9':
            delete_key(token)
        elif choice == '10':
            upload_data_value(token)
        elif choice == '11':
            fetch_daily_data(token)
        elif choice == '12':
            fetch_monthly_data(token)
        elif choice == '13':
            delete_all_keys(token)
        elif choice == '14':
            delete_all_devices(token)
        elif choice == '15':
            csv_path = "config.csv"
            create_keys_from_csv(token, csv_path)
        elif choice == '16':
            print("Exiting CLI. Goodbye!")
            sys.exit(0)
        else:
            print("Invalid option. Please select a number between 1 and 16.")

def main():
    print("Welcome to the System Monitor API CLI")
    token = login()
    main_menu(token)

if __name__ == "__main__":
    main()
