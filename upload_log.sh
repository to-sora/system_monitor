#!/bin/bash

# Base URL of the server
BASE_URL='https://localhost:"TODO"/api'

# Hardcoded credentials
USERNAME='"TODO"'
PASSWORD='"TODO"'

# Function for auto-login and token retrieval
login_and_get_token() {
    # Send a POST request to the login endpoint and extract the token
    TOKEN=$(curl -s -k -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"username": "'"$USERNAME"'", "password": "'"$PASSWORD"'"}' | jq -r '.token')

    # Check if the token is received
    if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
        echo "Login failed."
        exit 1
    fi
}

# Function to upload a single value
upload_value() {
    local key=$1
    local value=$2
    local device_id=${3:-'01'}
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    # Prepare the JSON payload
    payload=$(jq -n \
        --arg key "$key" \
        --arg device "$device_id" \
        --arg value "$value" \
        --arg timestamp "$timestamp" \
        '[{"key": $key, "machine": $device, "value": $value, "timestamp": $timestamp}]')

    # Upload the data
    response=$(curl -s -k -X POST "$BASE_URL/data/bulk" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "$payload")

    # Check the response
    if echo "$response" | grep -q '"status":201'; then
        echo "Value uploaded successfully."
    else
        echo "Failed to upload value: $response"
    fi
}

# Example usage
login_and_get_token
upload_value "LOG" "test"
