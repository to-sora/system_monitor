# Legacy MongoDB Files

This directory contains the **original MongoDB-based implementation** from System Monitor v1.0.

## ⚠️ These files are DEPRECATED

**Do not use these files for new deployments.**

They are kept for:
1. **Reference** - Understanding the original implementation
2. **Migration** - Migrating existing MongoDB installations
3. **Comparison** - Comparing v1.0 vs v2.0

## What's Here

### Models (MongoDB/Mongoose)
- `User.js` - User model with Mongoose
- `Device.js` - Device model
- `DataType.js` - Data type model
- `DataValue.js` - Data value model

### Backend Files
- `app.mongodb.js` - Original Express app setup
- `server.mongodb.js` - Original server with MongoDB connection
- `authMiddleware.mongodb.js` - MongoDB-based auth middleware
- `authorizeAdminMiddleware.mongodb.js` - Admin authorization

### Controllers (MongoDB)
- `authController.mongodb.js`
- `dataController.mongodb.js`
- `dataRetrievalController.mongodb.js`
- `datatypeController.mongodb.js`
- `deviceController.mongodb.js`
- `userController.mongodb.js`

### Routes (MongoDB)
- `authRoutes.mongodb.js`
- `dataRoutes.mongodb.js`
- `dataRetrievalRoutes.mongodb.js`
- `datatypeRoutes.mongodb.js`
- `deviceRoutes.mongodb.js`
- `keyRoutes.mongodb.js`
- `userRoutes.mongodb.js`

### Scripts
- `upload_stat_loop.py` - Original Python upload script (no env vars, hardcoded)
- `backend_script.py` - Original CLI management tool
- `setupAdmin.js` - Original admin setup (MongoDB)

## Migrating from v1.0 to v2.0

If you're running v1.0 (MongoDB), see the migration guide:

```bash
# From project root
cd backend
node scripts/migrateMongoDB.js
```

This will copy all data from MongoDB to the new SQLite database.

## Why These Were Replaced

| Issue | v1.0 (MongoDB) | v2.0 (SQLite) |
|-------|----------------|---------------|
| Database server | Required | Not needed |
| Memory usage | ~500 MB | ~50 MB |
| Setup complexity | Complex | Simple |
| Backup | mongodump | File copy |
| Security | Network exposed | Local file |
| VPS cost | Higher | Lower |
| Performance | Network latency | Local queries |
| Encryption | Enterprise only | Built-in support |

## Can I Still Use MongoDB?

Yes! MongoDB version still works. To revert:

1. Copy files from this directory back to `backend/`
2. Change `package.json` back to original
3. Install MongoDB
4. Configure connection string

**But we don't recommend it** - v2.0 is more secure, faster, and cheaper to run.

## Version History

- **v1.0** (2024) - Original MongoDB implementation
- **v2.0** (2025) - SQLite rewrite with production hardening

---

**These files are preserved for reference only.**
**Use v2.0 for all new deployments.**
