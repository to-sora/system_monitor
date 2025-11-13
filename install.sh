#!/bin/bash
################################################################################
# System Monitor - One-Script Installer v2.0
# Production-ready installation script
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   log_error "This script must NOT be run as root for security reasons"
   log_info "It will prompt for sudo when needed"
   exit 1
fi

# Print banner
echo "================================================================================"
echo "               System Monitor - Production Installation"
echo "================================================================================"
echo ""

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VER=$VERSION_ID
else
    log_error "Cannot detect OS. /etc/os-release not found."
    exit 1
fi

log_info "Detected OS: $OS $VER"

# Check for supported OS
if [[ "$OS" != "ubuntu" ]] && [[ "$OS" != "debian" ]] && [[ "$OS" != "centos" ]] && [[ "$OS" != "rhel" ]]; then
    log_warning "Unsupported OS: $OS. Installation may fail."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Get installation directory
INSTALL_DIR=$(pwd)
log_info "Installation directory: $INSTALL_DIR"

# Interactive configuration
echo ""
echo "================================================================================"
echo "                        Configuration"
echo "================================================================================"
echo ""

# Domain or IP
read -p "Enter your domain name or IP address: " DOMAIN
while [[ -z "$DOMAIN" ]]; do
    log_error "Domain cannot be empty"
    read -p "Enter your domain name or IP address: " DOMAIN
done

# Admin credentials
read -p "Enter admin username: " ADMIN_USERNAME
while [[ -z "$ADMIN_USERNAME" ]] || [[ ${#ADMIN_USERNAME} -lt 3 ]]; then
    log_error "Username must be at least 3 characters"
    read -p "Enter admin username: " ADMIN_USERNAME
done

read -sp "Enter admin password (min 8 chars): " ADMIN_PASSWORD
echo ""
while [[ -z "$ADMIN_PASSWORD" ]] || [[ ${#ADMIN_PASSWORD} -lt 8 ]]; then
    log_error "Password must be at least 8 characters"
    read -sp "Enter admin password (min 8 chars): " ADMIN_PASSWORD
    echo ""
done

read -sp "Confirm admin password: " ADMIN_PASSWORD_CONFIRM
echo ""
if [[ "$ADMIN_PASSWORD" != "$ADMIN_PASSWORD_CONFIRM" ]]; then
    log_error "Passwords do not match"
    exit 1
fi

# Email for Let's Encrypt
read -p "Enter email for Let's Encrypt SSL (optional, press Enter to skip): " LETSENCRYPT_EMAIL

# Device ID
read -p "Enter device ID for this machine (default: 01): " DEVICE_ID
DEVICE_ID=${DEVICE_ID:-01}

# Backend port
read -p "Enter backend port (default: 3000): " BACKEND_PORT
BACKEND_PORT=${BACKEND_PORT:-3000}

# Frontend port
read -p "Enter frontend port (default: 3001): " FRONTEND_PORT
FRONTEND_PORT=${FRONTEND_PORT:-3001}

echo ""
log_info "Configuration complete"
echo ""

# Install dependencies
echo "================================================================================"
echo "                     Installing Dependencies"
echo "================================================================================"
echo ""

log_info "Updating package lists..."
if [[ "$OS" == "ubuntu" ]] || [[ "$OS" == "debian" ]]; then
    sudo apt-get update -qq
elif [[ "$OS" == "centos" ]] || [[ "$OS" == "rhel" ]]; then
    sudo yum update -y -q
fi

# Install Node.js
if ! command -v node &> /dev/null; then
    log_info "Installing Node.js..."
    if [[ "$OS" == "ubuntu" ]] || [[ "$OS" == "debian" ]]; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [[ "$OS" == "centos" ]] || [[ "$OS" == "rhel" ]]; then
        curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
        sudo yum install -y nodejs
    fi
    log_success "Node.js installed"
else
    log_success "Node.js already installed ($(node --version))"
fi

# Install Python 3
if ! command -v python3 &> /dev/null; then
    log_info "Installing Python 3..."
    if [[ "$OS" == "ubuntu" ]] || [[ "$OS" == "debian" ]]; then
        sudo apt-get install -y python3 python3-pip
    elif [[ "$OS" == "centos" ]] || [[ "$OS" == "rhel" ]]; then
        sudo yum install -y python3 python3-pip
    fi
    log_success "Python 3 installed"
else
    log_success "Python 3 already installed ($(python3 --version))"
fi

# Install Python packages
log_info "Installing Python packages..."
pip3 install --user requests urllib3 --quiet
log_success "Python packages installed"

# Install other dependencies
log_info "Installing other dependencies..."
if [[ "$OS" == "ubuntu" ]] || [[ "$OS" == "debian" ]]; then
    sudo apt-get install -y openssl curl wget
elif [[ "$OS" == "centos" ]] || [[ "$OS" == "rhel" ]]; then
    sudo yum install -y openssl curl wget
fi

echo ""
# Install backend dependencies
log_info "Installing backend Node.js dependencies..."
cd "$INSTALL_DIR/backend"
npm install --production --quiet
log_success "Backend dependencies installed"

# Install frontend dependencies
log_info "Installing frontend Node.js dependencies..."
cd "$INSTALL_DIR/system-monitor-frontend"
npm install --production --quiet
log_success "Frontend dependencies installed"

cd "$INSTALL_DIR"

# Generate secrets
echo ""
echo "================================================================================"
echo "                     Generating Secrets"
echo "================================================================================"
echo ""

JWT_SECRET=$(openssl rand -hex 32)
DB_ENCRYPTION_KEY=$(openssl rand -hex 32)
log_success "Secrets generated"

# Create .env file
log_info "Creating .env file..."
cat > "$INSTALL_DIR/.env" <<EOF
# System Monitor Configuration - Generated by installer
NODE_ENV=production
HOST=0.0.0.0
PORT=$BACKEND_PORT

# SSL Configuration
SSL_KEY_PATH=$INSTALL_DIR/backend/server.key
SSL_CERT_PATH=$INSTALL_DIR/backend/server.cert

# Database
DB_PATH=$INSTALL_DIR/data/system_monitor.db
DB_ENCRYPTION_KEY=$DB_ENCRYPTION_KEY

# Authentication
JWT_SECRET=$JWT_SECRET
JWT_EXPIRY=7d

# Security
CORS_ORIGIN=https://$DOMAIN

# Backup
ENABLE_AUTO_BACKUP=true
BACKUP_INTERVAL_HOURS=6
BACKUP_RETENTION_DAYS=7
BACKUP_DIR=$INSTALL_DIR/backups

# Upload Script
SYSTEM_MONITOR_API_URL=https://$DOMAIN:$BACKEND_PORT/api
SYSTEM_MONITOR_USERNAME=$ADMIN_USERNAME
SYSTEM_MONITOR_PASSWORD=$ADMIN_PASSWORD
SYSTEM_MONITOR_DEVICE_ID=$DEVICE_ID
SYSTEM_MONITOR_INTERVAL=5
SYSTEM_MONITOR_NETWORK_INTERFACE=auto
SYSTEM_MONITOR_CPU_TEMP_PATH=/sys/class/hwmon/hwmon0/temp1_input
SYSTEM_MONITOR_SSL_VERIFY=true
EOF

# Copy .env to backend
cp "$INSTALL_DIR/.env" "$INSTALL_DIR/backend/.env"
log_success ".env file created"

# Generate SSL certificates
echo ""
echo "================================================================================"
echo "                     SSL Certificate Setup"
echo "================================================================================"
echo ""

if [[ -n "$LETSENCRYPT_EMAIL" ]]; then
    log_info "Setting up Let's Encrypt SSL..."
    # Install certbot
    if ! command -v certbot &> /dev/null; then
        if [[ "$OS" == "ubuntu" ]] || [[ "$OS" == "debian" ]]; then
            sudo apt-get install -y certbot
        elif [[ "$OS" == "centos" ]] || [[ "$OS" == "rhel" ]]; then
            sudo yum install -y certbot
        fi
    fi

    log_warning "Let's Encrypt requires port 80 to be accessible"
    log_info "Obtaining certificate for $DOMAIN..."
    sudo certbot certonly --standalone -d "$DOMAIN" --email "$LETSENCRYPT_EMAIL" --agree-tos --non-interactive || {
        log_warning "Let's Encrypt failed. Falling back to self-signed certificate."
        LETSENCRYPT_EMAIL=""
    }

    if [[ -n "$LETSENCRYPT_EMAIL" ]]; then
        # Copy certificates
        sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$INSTALL_DIR/backend/server.key"
        sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$INSTALL_DIR/backend/server.cert"
        sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$INSTALL_DIR/system-monitor-frontend/server.key"
        sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$INSTALL_DIR/system-monitor-frontend/server.cert"
        sudo chown $(whoami):$(whoami) "$INSTALL_DIR/backend/server.key" "$INSTALL_DIR/backend/server.cert"
        sudo chown $(whoami):$(whoami) "$INSTALL_DIR/system-monitor-frontend/server.key" "$INSTALL_DIR/system-monitor-frontend/server.cert"
        log_success "Let's Encrypt SSL certificate installed"
    fi
fi

if [[ -z "$LETSENCRYPT_EMAIL" ]]; then
    log_info "Generating self-signed SSL certificate..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$INSTALL_DIR/backend/server.key" \
        -out "$INSTALL_DIR/backend/server.cert" \
        -subj "/C=US/ST=State/L=City/O=Organization/OU=IT/CN=$DOMAIN" 2>/dev/null

    cp "$INSTALL_DIR/backend/server.key" "$INSTALL_DIR/system-monitor-frontend/server.key"
    cp "$INSTALL_DIR/backend/server.cert" "$INSTALL_DIR/system-monitor-frontend/server.cert"
    log_success "Self-signed SSL certificate created"
    log_warning "Self-signed certificates will show browser warnings"
fi

# Create directories
echo ""
log_info "Creating directories..."
mkdir -p "$INSTALL_DIR/data"
mkdir -p "$INSTALL_DIR/backups"
mkdir -p "$INSTALL_DIR/logs"
chmod 700 "$INSTALL_DIR/data" "$INSTALL_DIR/backups"
log_success "Directories created"

# Switch to new backend
echo ""
log_info "Switching to production backend..."
cd "$INSTALL_DIR/backend"
[ -f app.js ] && mv app.js app.old.js
[ -f server.js ] && mv server.js server.old.js
cp app.new.js app.js
cp server.new.js server.js

# Copy new controllers
for file in controllers/*.new.js; do
    if [ -f "$file" ]; then
        basename=$(basename "$file" .new.js)
        [ -f "controllers/${basename}.js" ] && mv "controllers/${basename}.js" "controllers/${basename}.old.js"
        cp "$file" "controllers/${basename}.js"
    fi
done

# Copy new routes
for file in routes/*.new.js; do
    if [ -f "$file" ]; then
        basename=$(basename "$file" .new.js)
        [ -f "routes/${basename}.js" ] && mv "routes/${basename}.js" "routes/${basename}.old.js"
        cp "$file" "routes/${basename}.js"
    fi
done

# Copy new middleware
[ -f middleware/authMiddleware.new.js ] && cp middleware/authMiddleware.new.js middleware/authMiddleware.js

log_success "Backend files updated"

# Setup Python script
cd "$INSTALL_DIR"
[ -f upload_stat_loop.py ] && mv upload_stat_loop.py upload_stat_loop.old.py
cp upload_stat_loop.new.py upload_stat_loop.py
chmod +x upload_stat_loop.py
log_success "Python upload script updated"

# Initialize database and create admin
echo ""
echo "================================================================================"
echo "                     Database Initialization"
echo "================================================================================"
echo ""

cd "$INSTALL_DIR/backend"
log_info "Initializing database..."
node -e "const db = require('./db/database'); db.connect(); db.close();" 2>&1 | grep -v "ExperimentalWarning" || true
log_success "Database initialized"

log_info "Creating admin user..."
echo -e "$ADMIN_USERNAME\n$ADMIN_PASSWORD\n$ADMIN_PASSWORD" | node scripts/setupAdmin.new.js 2>&1 | grep -v "ExperimentalWarning" || true
log_success "Admin user created"

# Install systemd services
echo ""
echo "================================================================================"
echo "                     Installing System Services"
echo "================================================================================"
echo ""

# Create systemd service files
log_info "Creating systemd service files..."

# Backend service
sudo tee /etc/systemd/system/system-monitor-backend.service > /dev/null <<EOF
[Unit]
Description=System Monitor Backend Service
After=network.target

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=$INSTALL_DIR/backend
ExecStart=$(which node) server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$INSTALL_DIR/data $INSTALL_DIR/backups $INSTALL_DIR/logs

[Install]
WantedBy=multi-user.target
EOF

# Frontend service
sudo tee /etc/systemd/system/system-monitor-frontend.service > /dev/null <<EOF
[Unit]
Description=System Monitor Frontend Service
After=network.target

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=$INSTALL_DIR/system-monitor-frontend
ExecStart=$(which node) server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=$FRONTEND_PORT

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true

[Install]
WantedBy=multi-user.target
EOF

# Upload service
sudo tee /etc/systemd/system/system-monitor-upload.service > /dev/null <<EOF
[Unit]
Description=System Monitor Upload Service
After=network.target system-monitor-backend.service

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=$INSTALL_DIR
ExecStart=$(which python3) upload_stat_loop.py
Restart=always
RestartSec=30
EnvironmentFile=$INSTALL_DIR/.env

# Security hardening
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
sudo systemctl daemon-reload
log_success "Systemd services installed"

# Configure firewall
echo ""
log_info "Configuring firewall..."
if command -v ufw &> /dev/null; then
    sudo ufw allow $BACKEND_PORT/tcp comment 'System Monitor Backend'
    sudo ufw allow $FRONTEND_PORT/tcp comment 'System Monitor Frontend'
    log_success "Firewall rules added (ufw)"
elif command -v firewall-cmd &> /dev/null; then
    sudo firewall-cmd --permanent --add-port=$BACKEND_PORT/tcp
    sudo firewall-cmd --permanent --add-port=$FRONTEND_PORT/tcp
    sudo firewall-cmd --reload
    log_success "Firewall rules added (firewalld)"
else
    log_warning "No firewall detected. Please manually open ports $BACKEND_PORT and $FRONTEND_PORT"
fi

# Start services
echo ""
log_info "Starting services..."
sudo systemctl enable system-monitor-backend.service
sudo systemctl enable system-monitor-frontend.service
sudo systemctl enable system-monitor-upload.service

sudo systemctl start system-monitor-backend.service
sleep 2
sudo systemctl start system-monitor-frontend.service
sleep 2
sudo systemctl start system-monitor-upload.service

log_success "Services started"

# Installation complete
echo ""
echo "================================================================================"
echo "                     Installation Complete!"
echo "================================================================================"
echo ""
log_success "System Monitor v2.0 has been installed successfully"
echo ""
echo "Access Information:"
echo "  Backend:  https://$DOMAIN:$BACKEND_PORT"
echo "  Frontend: https://$DOMAIN:$FRONTEND_PORT"
echo ""
echo "Admin Credentials:"
echo "  Username: $ADMIN_USERNAME"
echo "  Password: [hidden]"
echo ""
echo "Service Status:"
sudo systemctl status system-monitor-backend.service --no-pager | head -3
sudo systemctl status system-monitor-frontend.service --no-pager | head -3
sudo systemctl status system-monitor-upload.service --no-pager | head -3
echo ""
echo "Useful Commands:"
echo "  View logs:    sudo journalctl -fu system-monitor-backend"
echo "  Stop all:     sudo systemctl stop system-monitor-*"
echo "  Restart all:  sudo systemctl restart system-monitor-*"
echo "  Create backup: cd backend && node -e \"require('./utils/backup').createBackup()\""
echo ""
echo "Next Steps:"
echo "  1. Test the web interface at https://$DOMAIN:$FRONTEND_PORT"
echo "  2. Configure additional devices in the web UI"
echo "  3. Set up data types (keys) for metrics"
echo "  4. Review logs to ensure everything is working"
echo ""
echo "================================================================================"
echo ""
