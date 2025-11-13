# System Monitor v2.0 - Quick Start Guide

## 🚀 Installation (3 commands)

```bash
git clone <your-repo-url>
cd system-monitor
./install.sh
```

That's it! The script will:
- Install all dependencies
- Configure everything
- Set up SSL certificates
- Create admin user
- Start all services

## 📱 Access Your System

After installation:

- **Frontend (Web UI):** `https://your-domain:3001`
- **Backend (API):** `https://your-domain:3000`
- **Health Check:** `https://your-domain:3000/health`

## 🔐 First Login

Use the credentials you provided during installation:

1. Open `https://your-domain:3001`
2. Login with admin username/password
3. Accept SSL warning if using self-signed certificate

## ⚙️ Initial Setup

### 1. Create Device

```bash
# Via Web UI:
Settings → Devices → Add Device

# Or via CLI:
python3 backend_script.py
# Choose option 3 (Create New Device)
```

### 2. Import Metrics Configuration

```bash
python3 backend_script.py
# Choose option 15 (Create Keys from CSV)
# Uses config.csv in the root directory
```

### 3. Verify Data Upload

Check dashboard - you should see metrics appearing every 5 seconds.

## 🔧 Common Commands

```bash
# View logs
sudo journalctl -fu system-monitor-backend
sudo journalctl -fu system-monitor-upload

# Restart services
sudo systemctl restart system-monitor-*

# Stop services
sudo systemctl stop system-monitor-*

# Create manual backup
cd backend && node -e "require('./utils/backup').createBackup()"

# Check service status
sudo systemctl status system-monitor-*
```

## 📊 Monitoring

### Health Checks

```bash
# Basic health
curl -k https://localhost:3000/health

# Detailed metrics
curl -k https://localhost:3000/health/detailed

# Database status
curl -k https://localhost:3000/health/db
```

### View Metrics

- **Daily Monitor:** Real-time graphs (last 24h)
- **Monthly Monitor:** Aggregated statistics
- **Logs:** Historical message data

## 🐛 Troubleshooting

### Services won't start

```bash
# Check what's wrong
sudo journalctl -xe -u system-monitor-backend

# Common issues:
# 1. Port already in use - change PORT in .env
# 2. Missing SSL certs - regenerate with openssl
# 3. Database locked - stop all services, then start
```

### No data showing

```bash
# Check upload script
sudo systemctl status system-monitor-upload
sudo journalctl -fu system-monitor-upload

# Verify device exists
# Verify data types (keys) are created
# Check network connectivity
```

### SSL Certificate Warnings

**Self-signed certificates will show browser warnings - this is normal.**

To fix:
1. Use Let's Encrypt (provide email during install)
2. Or add exception in browser
3. Or import certificate to system trust store

## 🔐 Security Checklist

- [ ] Changed default admin password
- [ ] Using strong JWT_SECRET (32+ chars)
- [ ] Using strong DB_ENCRYPTION_KEY
- [ ] SSL certificates configured (Let's Encrypt preferred)
- [ ] Firewall enabled (only necessary ports)
- [ ] CORS_ORIGIN set to your domain
- [ ] Backups enabled and tested
- [ ] Services running as non-root user

## 💾 Backup & Recovery

### Automatic Backups

Backups run every 6 hours automatically (configurable).

Location: `./backups/`

### Manual Backup

```bash
cd backend
node -e "require('./utils/backup').createBackup()"
```

### Restore

```bash
# Stop services
sudo systemctl stop system-monitor-*

# Restore
cp backups/backup_YYYY-MM-DD....db data/system_monitor.db

# Start services
sudo systemctl start system-monitor-*
```

## 🔄 Upgrading from MongoDB Version

```bash
# 1. Install new version
./install.sh

# 2. Migrate data
cd backend
node scripts/migrateMongoDB.js

# 3. Verify everything works

# 4. Stop old MongoDB
sudo systemctl stop mongod
sudo systemctl disable mongod
```

## 📚 More Documentation

- **Full Guide:** `PRODUCTION_READY.md`
- **Original README:** `ReadMe.md`
- **Environment Vars:** `.env.example`
- **API Docs:** Check `/api` endpoints

## 🆘 Getting Help

1. **Check logs:** `sudo journalctl -fu system-monitor-*`
2. **Read docs:** `PRODUCTION_READY.md`, `TROUBLESHOOTING.md`
3. **GitHub issues:** Report bugs with logs (redact secrets!)

---

## 📝 What's New in v2.0?

- ✅ **MongoDB → SQLite** (lightweight, encrypted)
- ✅ **One-script installation** (no manual setup)
- ✅ **Fixed median calculation bug**
- ✅ **Production-ready security** (rate limiting, validation, SSL)
- ✅ **Automated backups** (with retention)
- ✅ **Health monitoring** (endpoints for uptime checks)
- ✅ **Improved reliability** (graceful shutdown, error recovery)
- ✅ **Same UI** (no learning curve!)

---

## 💡 Pro Tips

1. **Use Let's Encrypt** for real SSL certificates (free!)
2. **Monitor with external service** using `/health` endpoint
3. **Adjust upload interval** based on needs (5s default)
4. **Set up off-site backups** for critical data
5. **Review logs regularly** for security issues
6. **Keep dependencies updated** with `npm audit`

---

**Ready to monitor!** 🎉

For detailed documentation, see `PRODUCTION_READY.md`
