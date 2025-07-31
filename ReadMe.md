# **System Monitor**
This project is a system monitoring tool that allows you to collect, display, and analyze system metrics in real-time and over time. It consists of three main components:

1. **Backend API Server**: A Node.js server connected to MongoDB for storing and providing data via RESTful API.
2. **Frontend Web Application**: A Next.js React application that displays real-time and historical system metrics, rendering graphs using libraries like Chart.js or D3.js.
3. **Python Upload Script**: A script that collects system statistics (e.g., CPU usage, memory usage, GPU stats via `nvidia-smi`) and uploads them to the backend server at regular intervals.


---
## Features

- **Real-time Monitoring**: View live system metrics such as CPU usage, memory consumption, disk I/O, and GPU statistics.
- **Historical Data**: Analyze system performance over time with aggregated data and interactive visualizations.
- **Customizable Metrics**: Configure which metrics to collect and display using RESTful APIs, allowing flexibility based on user needs.
- **User Authentication**: Secure access to the application with admin and user roles.
- **Responsive Design**: Accessible on various devices, including desktops, tablets, and smartphones.


---

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Operating System**: Linux (tested on Ubuntu, but should work on other distributions)
- **Node.js**: backend and frontend
- **npm**: package manager
- **Python**: Version 3.x
- **MongoDB**: A running MongoDB instance for data storage
- **Git**: For cloning the repository
---

## Installation

### 1. Clone and install the Repository

Open a terminal and clone the repository to your local machine:

```bash
# Clone the repository
git clone https://github.com/yourusername/system-monitor.git
cd system-monitor

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../system-monitor-frontend
npm install
```

### 2. Configure the Application

Default ports, credentials, and paths are controlled with environment variables or by editing the service files. The following variables are used:

- **BACKEND_PORT** – Port for the Node.js API server (default `3000`).
- **FRONTEND_PORT** – Port for the Next.js frontend (default `3001`).
- **BASE_URL** – API endpoint used by the upload scripts (default `https://localhost:3000/api`).
- **MONITOR_USER** and **MONITOR_PASS** – Credentials for the upload scripts (default `admin`/`change_me`).
- **CPU_TEMP_PATH** – Location of the CPU temperature sensor (default `/sys/class/hwmon/hwmon0/temp1_input`).
- **ADMIN_USER** and **ADMIN_PASS** – Credentials for `backend/scripts/setupAdmin.js` (default `admin`/`change_me`).

Edit the systemd service files if your installation path or service user differs from `/opt/system_monitor` and `system-monitor`.



## 5. Set Up System Services 

To run the application components as system services that start on boot, you can set up systemd service files.

Warning: Setting up system services requires administrative privileges and should be done carefully.

## 6 Set upadmin
To set up admin you can change the script of ./backend/scripts/setupAdmin.js to create admin user.
Admin user should not be created from api.

## 7 Server Certificate

Both server run in https and the cert should place in follow
```
./system-monitor-frontend/server.cert
./system-monitor-frontend/server.key
./backend/server.cert
./backend/server.key

```
generate by 
```
openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt
```
---
##### DailyMonitor\Screen Shot
![Screenshot](DailyMonitor.png)

## Testing

Run the `test.sh` script at the project root to execute backend tests and frontend linting:

```bash
./test.sh
```

