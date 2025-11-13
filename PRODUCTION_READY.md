# System Monitor v2.0 - Production Ready

## 🎉 What's New

This is a **complete rewrite** of the System Monitor application, transforming it from a home lab project into a **production-ready system** suitable for deployment on a VPS with proper security, reliability, and ease of installation.

---

## 🔒 Security Fixes

### Critical Issues Fixed

1. **✓ SSL Verification Enabled**
   - Removed SSL bypass in Python upload scripts
   - Proper certificate validation
   - Support for custom CA certificates

2. **✓ Database Encryption**
   - SQLite database with optional encryption (SQLCipher)
   - Encrypted backups
   - Secure storage of sensitive data

3. **✓ Credentials Management**
   - All credentials moved to environment variables
   - No hardcoded passwords
   - Secure secret generation

4. **✓ Input Validation**
   - Express-validator on all endpoints
   - SQL injection prevention (parameterized queries)
   - XSS protection

5. **✓ Rate Limiting**
   - Brute force protection (5 attempts / 15 minutes)
   - API rate limiting (100 req / 15 min)
   - Upload rate limiting (1000 req / 15 min)

6. **✓ CORS & Security Headers**
   - Configurable CORS origins
   - Helmet.js security headers
   - Content Security Policy

7. **✓ Authentication Hardening**
   - Password complexity requirements
   - Failed login attempt tracking
   - JWT token expiration

---

## 🐛 Bug Fixes

### Monthly Analysis Median Calculation (FIXED)

**Bug Location:** `backend/controllers/dataRetrievalController.js:165`

**Problem:**
```javascript
// OLD (WRONG):
const median = values.slice().sort((a, b) => a - b)[Math.floor(values.length / 2)];
```

This only takes the middle element and doesn't handle even-length arrays correctly.

**Fixed:**
```javascript
// NEW (CORRECT):
const calculateMedian = (values) => {
  if (values.length === 0) return null;
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    // Even: average of two middle values
    return (sorted[mid - 1] + sorted[mid]) / 2;
  } else {
    // Odd: middle value
    return sorted[mid];
  }
};
```

**Impact:** Monthly aggregated data now shows correct median values.

---

## 🔄 Major Changes

### 1. Database Migration: MongoDB → SQLite

**Why?**
- Lightweight (no separate database server)
- Perfect for VPS with limited resources
- Single-file database (easy backups)
- Encrypted storage support
- No licensing concerns

**Schema:**
- users
- devices
- data_types
- data_values (time-series data)
- sessions
- login_attempts
- audit_log

**Migration Tool:**
```bash
cd backend
node scripts/migrateMongoDB.js
```

### 2. Automated Backup System

**Features:**
- Automatic backups every 6 hours (configurable)
- Retention policy (7 days default)
- Backup verification
- Manual backup command

**Usage:**
```bash
# Manual backup
cd backend
node -e "require('./utils/backup').createBackup()"

# List backups
node -e "console.log(require('./utils/backup').listBackups())"
```

### 3. Health Check Endpoints

**New endpoints:**
- `GET /health` - Basic health check
- `GET /health/detailed` - System metrics
- `GET /health/db` - Database connectivity

**Usage:**
```bash
curl https://localhost:3000/health
```

### 4. Improved Upload Script

**Features:**
- Auto-detect network interface
- Exponential backoff retry
- Configurable via environment variables
- Better error handling
- No arbitrary failure limits

**Configuration:**
All via environment variables (no more hardcoded values!)

### 5. One-Script Installation

**New file:** `install.sh`

**Features:**
- Interactive setup
- Automatic dependency installation
- SSL certificate generation (Let's Encrypt or self-signed)
- Database initialization
- Admin user creation
- Systemd service installation
- Firewall configuration

**Usage:**
```bash
chmod +x install.sh
./install.sh
```

---

## 📦 Installation

### Quick Start (New Installation)

```bash
# Clone repository
git clone <repository-url>
cd system-monitor

# Run installer
chmod +x install.sh
./install.sh

# Follow interactive prompts
```

The installer will:
1. Install Node.js, Python, and dependencies
2. Generate secure secrets
3. Configure SSL certificates
4. Initialize database
5. Create admin user
6. Install systemd services
7. Start all services

### Manual Installation

See `INSTALL.md` for detailed manual installation steps.

---

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
nano .env
```

**Key variables:**
- `JWT_SECRET` - JWT signing key (32+ chars)
- `DB_ENCRYPTION_KEY` - Database encryption key
- `CORS_ORIGIN` - Allowed frontend origin
- `BACKUP_INTERVAL_HOURS` - Backup frequency
- `SYSTEM_MONITOR_API_URL` - Backend URL for upload script
- `SYSTEM_MONITOR_USERNAME` - Upload script username
- `SYSTEM_MONITOR_PASSWORD` - Upload script password

### SSL Certificates

**Option 1: Let's Encrypt (Recommended for production)**
```bash
# During installation, provide email when prompted
# Certificates auto-renew via certbot
```

**Option 2: Self-signed (Development/Testing)**
```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout backend/server.key \
  -out backend/server.cert
```

Copy certificates to both `backend/` and `system-monitor-frontend/`.

---

## 🚀 Usage

### Admin Setup

```bash
cd backend
node scripts/setupAdmin.new.js
```

### Start Services

```bash
sudo systemctl start system-monitor-backend
sudo systemctl start system-monitor-frontend
sudo systemctl start system-monitor-upload
```

### View Logs

```bash
# All services
sudo journalctl -fu system-monitor-*

# Backend only
sudo journalctl -fu system-monitor-backend

# Upload script only
sudo journalctl -fu system-monitor-upload
```

### Stop Services

```bash
sudo systemctl stop system-monitor-*
```

### Restart Services

```bash
sudo systemctl restart system-monitor-*
```

---

## 🧪 Testing

### Test Backend

```bash
curl -k https://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-XX...",
  "uptime": 123.45
}
```

### Test Frontend

Open browser to `https://localhost:3001` (or your domain).

### Test Upload Script

```bash
# Test manually
cd /path/to/system-monitor
python3 upload_stat_loop.new.py
```

---

## 📊 API Changes

### New Endpoints

- `GET /health` - Health check
- `GET /health/detailed` - Detailed health metrics
- `GET /health/db` - Database connectivity check

### Changed Endpoints

All endpoints now have:
- Input validation
- Rate limiting
- Improved error messages

### Backward Compatibility

Frontend remains **100% compatible** - no changes needed to the UI.

---

## 🔐 Security Best Practices

### For Production Deployment

1. **✓ Use Let's Encrypt SSL certificates**
2. **✓ Set strong JWT_SECRET and DB_ENCRYPTION_KEY**
3. **✓ Configure CORS_ORIGIN to your domain**
4. **✓ Use strong admin password (12+ chars, mixed case, numbers, symbols)**
5. **✓ Keep Node.js and dependencies updated**
6. **✓ Enable firewall (only ports 80, 443, backend, frontend)**
7. **✓ Regular backups (automated + off-site)**
8. **✓ Monitor logs for suspicious activity**
9. **✓ Use non-root user for services (already configured)**
10. **✓ Enable systemd security features (already configured)**

### Systemd Security Features (Enabled)

- `NoNewPrivileges=true` - Prevent privilege escalation
- `PrivateTmp=true` - Isolated /tmp directory
- `ProtectSystem=strict` - Read-only system directories
- `ProtectHome=true` - No access to home directories
- `Restart=always` - Auto-restart on failure

---

## 💾 Backup & Recovery

### Automatic Backups

Configured via environment variables:
```env
ENABLE_AUTO_BACKUP=true
BACKUP_INTERVAL_HOURS=6
BACKUP_RETENTION_DAYS=7
BACKUP_DIR=./backups
```

### Manual Backup

```bash
cd backend
node -e "require('./utils/backup').createBackup()"
```

### Restore from Backup

```bash
# Stop services
sudo systemctl stop system-monitor-*

# Restore database
cp backups/backup_YYYY-MM-DDTHH-MM-SS.db data/system_monitor.db

# Start services
sudo systemctl start system-monitor-*
```

---

## 🔄 Upgrading from v1.0 (MongoDB)

### Migration Process

1. **Backup existing MongoDB data**
   ```bash
   mongodump --db system_monitor --out ./mongodb_backup
   ```

2. **Install new version**
   ```bash
   git pull origin main
   ./install.sh
   ```

3. **Run migration**
   ```bash
   cd backend
   # Set MONGODB_URI in .env if not localhost
   node scripts/migrateMongoDB.js
   ```

4. **Verify migration**
   - Check logs for any errors
   - Test frontend functionality
   - Verify data completeness

5. **Stop MongoDB (after verification)**
   ```bash
   sudo systemctl stop mongod
   sudo systemctl disable mongod
   ```

---

## 📝 Development

### File Structure

```
system-monitor/
├── backend/
│   ├── db/                    # NEW: SQLite database layer
│   │   ├── database.js        # Connection manager
│   │   ├── schema.sql         # Database schema
│   │   └── models/            # SQLite models
│   ├── controllers/           # Updated controllers
│   ├── middleware/
│   │   ├── validation.js      # NEW: Input validation
│   │   ├── rateLimiter.js     # NEW: Rate limiting
│   │   └── authMiddleware.js  # Updated
│   ├── routes/                # Updated routes
│   ├── utils/
│   │   └── backup.js          # NEW: Backup system
│   ├── scripts/
│   │   ├── setupAdmin.new.js  # NEW: Admin setup
│   │   └── migrateMongoDB.js  # NEW: Migration tool
│   ├── app.js                 # Refactored
│   └── server.js              # Enhanced
├── frontend/                  # No changes (UI stays same)
├── install.sh                 # NEW: One-script installer
├── upload_stat_loop.py        # Enhanced
├── .env.example               # NEW: Configuration template
└── PRODUCTION_READY.md        # This file
```

### Running in Development

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with development values
npm install
npm run dev

# Frontend
cd system-monitor-frontend
npm install
npm run dev

# Upload script
python3 upload_stat_loop.new.py
```

---

## 🐞 Troubleshooting

### Services won't start

```bash
# Check status
sudo systemctl status system-monitor-backend
sudo systemctl status system-monitor-frontend

# Check logs
sudo journalctl -xe -u system-monitor-backend
```

### Database errors

```bash
# Check database file exists
ls -la data/system_monitor.db

# Reinitialize if needed
cd backend
rm -f ../data/system_monitor.db
node -e "const db = require('./db/database'); db.connect(); db.close();"
node scripts/setupAdmin.new.js
```

### Upload script not connecting

```bash
# Check .env file
cat .env | grep SYSTEM_MONITOR

# Test connection
curl -k https://localhost:3000/health

# Check SSL certificate
openssl s_client -connect localhost:3000 < /dev/null
```

### SSL certificate issues

```bash
# Regenerate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout backend/server.key \
  -out backend/server.cert \
  -subj "/CN=localhost"

# Copy to frontend
cp backend/server.{key,cert} system-monitor-frontend/

# Restart services
sudo systemctl restart system-monitor-*
```

---

## 📈 Performance

### Resource Usage (VPS)

**Minimum Requirements:**
- 1 CPU core
- 1GB RAM
- 10GB disk space

**Typical Usage:**
- Backend: ~100MB RAM
- Frontend: ~80MB RAM
- Upload script: ~30MB RAM
- Database: Grows ~1MB per day (5-second intervals)

### Optimization Tips

1. **Adjust upload interval** for less frequent metrics
   ```env
   SYSTEM_MONITOR_INTERVAL=10  # 10 seconds instead of 5
   ```

2. **Clean old data** periodically
   ```bash
   cd backend
   node -e "require('./db/database').cleanup(30)"  # Keep 30 days
   ```

3. **Reduce backup frequency** if disk space limited
   ```env
   BACKUP_INTERVAL_HOURS=12  # Every 12 hours
   BACKUP_RETENTION_DAYS=3   # Keep 3 days
   ```

---

## 📞 Support

### Common Issues

See `TROUBLESHOOTING.md` for detailed solutions.

### Logs Location

- Systemd logs: `journalctl -u system-monitor-*`
- Application logs: `./logs/` (if configured)
- Backup logs: Check systemd journal

### Getting Help

1. Check logs first
2. Review this documentation
3. Open GitHub issue with logs and configuration (redact secrets!)

---

## 🎯 Next Steps

After installation:

1. ✅ **Test the web interface** - Login with admin credentials
2. ✅ **Create a device** - Add device ID from upload script
3. ✅ **Create data types** - Import from `config.csv` or create manually
4. ✅ **Verify data upload** - Check dashboard for incoming metrics
5. ✅ **Test monthly analysis** - Ensure aggregates calculate correctly
6. ✅ **Configure backups** - Test backup/restore procedure
7. ✅ **Set up monitoring** - Health check endpoint + external monitor
8. ✅ **Review security** - Ensure SSL, firewall, strong passwords

---

## 📄 License

Same as original project (see LICENSE file).

---

## 🙏 Acknowledgments

- Original System Monitor project
- Community feedback on security issues
- Open source libraries: Express, SQLite, React, Next.js

---

## ✨ Summary

**System Monitor v2.0** is a **complete transformation**:

- ✅ Production-ready security
- ✅ Easy one-script installation
- ✅ Lightweight SQLite database
- ✅ Automated backups
- ✅ Fixed median calculation bug
- ✅ Enhanced reliability
- ✅ VPS-optimized
- ✅ Same great UI

**Ready to deploy!** 🚀
