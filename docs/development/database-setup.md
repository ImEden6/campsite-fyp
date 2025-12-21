# Database Configuration

This directory contains database-related scripts and configurations for the Campsite Management System.

## Files

- `init/01-init.sql` - Database initialization script
- `backup.sh` - Database backup script
- `restore.sh` - Database restore script
- `README.md` - This file

## Database Setup

The system uses PostgreSQL with the following default configuration:
- Database: `campsite_db`
- User: `campsite_user`
- Password: `campsite_password`
- Port: `5432`

### Connection Management

The application uses Prisma Client with lazy initialization and automatic connection pooling:

- **Lazy Loading**: Database connections are established on first use
- **Singleton Pattern**: A single Prisma Client instance is reused across the application
- **Automatic Cleanup**: Connections are properly closed on process termination (SIGINT, SIGTERM, beforeExit)
- **Environment-based Logging**: Query logging is enabled in development mode only

The database connection is managed through `backend/src/database/index.ts` which provides:
- `getPrismaClient()` - Get the Prisma Client instance
- `connectDatabase()` - Explicitly connect to the database
- `disconnectDatabase()` - Gracefully disconnect from the database
- `checkDatabaseHealth()` - Verify database connectivity
- `transaction()` - Execute operations within a transaction
- `getDatabaseMetrics()` - Retrieve database statistics

## Initialization

The database is automatically initialized when you run:

```bash
npm run setup:db
```

This will:
1. Generate Prisma client
2. Run database migrations
3. Seed the database with sample data

## Manual Database Operations

### Connect to Database

```bash
# Local connection
psql -h localhost -p 5432 -U campsite_user -d campsite_db

# Docker connection
docker exec -it campsite_postgres psql -U campsite_user -d campsite_db
```

### Backup Database

```bash
# Create backup
./database/backup.sh

# Create backup with custom name
./database/backup.sh my_backup_name
```

### Restore Database

```bash
# Restore from backup
./database/restore.sh backup_20240101_120000.sql.gz
```

### Reset Database

```bash
# Reset and reseed database
npm run db:reset
```

## Database Schema

The database schema is managed by Prisma ORM. Key tables include:

- `users` - User accounts and authentication
- `campsites` - Campsite information and locations
- `campsite_categories` - Types of campsites (tent, RV, cabin, etc.)
- `amenities` - Available amenities
- `bookings` - Reservation information
- `payments` - Payment records
- `audit_logs` - System activity logs

## Migrations

Database migrations are handled by Prisma:

```bash
# Create new migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Reset migrations
npx prisma migrate reset
```

## Seeding

The database can be seeded with sample data:

```bash
# Run seed script
npm run db:seed

# Custom seed script
npx ts-node backend/prisma/seed.ts
```

## Production Considerations

### Security
- Change default passwords in production
- Use environment variables for credentials
- Enable SSL connections
- Restrict database access to application servers only

### Performance
- Configure appropriate connection pooling
- Set up read replicas for heavy read workloads
- Monitor query performance
- Implement proper indexing

### Backup Strategy
- Set up automated daily backups
- Test backup restoration procedures
- Store backups in secure, offsite locations
- Implement backup rotation policies

### Monitoring
- Monitor database performance metrics
- Set up alerts for connection issues
- Track slow queries
- Monitor disk usage

## Connection Lifecycle

The database connection follows this lifecycle:

1. **Initialization**: On first database operation, Prisma Client is instantiated with configuration from environment variables
2. **Connection Pooling**: Prisma automatically manages a connection pool (default: 10 connections)
3. **Query Execution**: Connections are borrowed from the pool for each query
4. **Graceful Shutdown**: On process termination signals, all connections are properly closed before exit

### Process Signal Handling

The application handles these signals for clean database disconnection:
- `SIGINT` (Ctrl+C) - Disconnects and exits with code 0
- `SIGTERM` (Docker/PM2 stop) - Disconnects and exits with code 0
- `beforeExit` - Disconnects before Node.js process exits

## Environment Variables

```env
DATABASE_URL="postgresql://campsite_user:campsite_password@localhost:5432/campsite_db"
DB_HOST=localhost
DB_PORT=5432
DB_NAME=campsite_db
DB_USER=campsite_user
DB_PASSWORD=campsite_password
```

## Troubleshooting

### Common Issues

1. **Connection refused**
   - Check if PostgreSQL is running
   - Verify connection parameters
   - Check firewall settings

2. **Authentication failed**
   - Verify username and password
   - Check user permissions
   - Ensure user exists

3. **Migration issues**
   - Check migration status: `npx prisma migrate status`
   - Resolve conflicts manually
   - Reset if necessary: `npx prisma migrate reset`

### Useful Commands

```bash
# Check database status
npx prisma db push

# View database in browser
npx prisma studio

# Generate Prisma client
npx prisma generate

# Format schema
npx prisma format
```
