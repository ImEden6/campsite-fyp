# Production Deployment Step-by-Step Guide

## Prerequisites

- Linux server (Ubuntu 22.04+ recommended)
- Docker & Docker Compose installed
- A domain name pointing to your server
- SSH access to the server

---

## Step 1: Install Docker & Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose (usually bundled with Docker)
docker --version
docker compose version

# Verify installation
docker run hello-world
```

---

## Step 2: Navigate to Project Directory

```bash
cd /path/to/campsite-fyp
```

---

## Step 3: Generate Secrets

Run these in **PowerShell** (no OpenSSL needed):

```powershell
# 128-char hex secrets (run 3 times for JWT_SECRET, JWT_REFRESH_SECRET, SESSION_SECRET)
-join ((1..64) | ForEach-Object { "{0:x}" -f (Get-Random -Maximum 16) })

# 64-char hex (for POSTGRES_PASSWORD)
-join ((1..32) | ForEach-Object { "{0:x}" -f (Get-Random -Maximum 16) })
```

Save all generated values — you'll need them in Step 4.

---

## Step 4: Configure Environment Files

### 4.1 Root `.env`

```powershell
# PowerShell (or just copy manually)
Copy-Item .env.example .env
```

Edit `.env`:
```env
POSTGRES_PASSWORD=<your-generated-password>
```

### 4.2 Backend `.env.production`

The file already exists — just edit it directly.

Edit `backend/.env.production`:
```env
# Database (use Docker internal hostname)
DATABASE_URL="postgresql://campsite_user:<YOUR_PASSWORD>@postgres:5432/campsite_db"

# JWT (use generated secrets)
JWT_SECRET="<your-64-char-hex>"
JWT_EXPIRES_IN="90d"
JWT_REFRESH_SECRET="<your-64-char-hex>"
JWT_REFRESH_EXPIRES_IN="90d"

# Server
PORT=5000
NODE_ENV=production
API_BASE_URL="https://yourdomain.com"
FRONTEND_URL="https://yourdomain.com"

# Redis (use Docker internal hostname)
REDIS_URL="redis://redis:6379"
REDIS_PASSWORD=""

# Stripe (get from Stripe Dashboard)
STRIPE_SECRET_KEY="sk_live_your-key"
STRIPE_PUBLISHABLE_KEY="pk_live_your-key"
STRIPE_WEBHOOK_SECRET="whsec_your-secret"

# Security
CORS_ORIGIN="https://yourdomain.com"
COOKIE_SECURE=true
COOKIE_SAME_SITE="strict"

# Email (Gmail example)
EMAIL_SERVICE="gmail"
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
EMAIL_FROM="your-email@gmail.com"

# Feature Flags
ENABLE_NOTIFICATIONS=true
ENABLE_WEATHER=false
ENABLE_CALENDAR_SYNC=true
ENABLE_AUDIT_LOGGING=true

# Logging
LOG_LEVEL="info"
LOG_FILE="logs/app.log"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Monitoring (optional)
SENTRY_DSN=""
```

### 4.3 Frontend `.env.production`

Edit `frontend/.env.production`:
```env
VITE_API_URL=https://yourdomain.com/api/v1
VITE_WS_URL=wss://yourdomain.com
VITE_APP_NAME=Campsite Management System
VITE_APP_VERSION=1.0.0
VITE_STRIPE_PUBLIC_KEY=pk_live_your-key
VITE_ENV=production
```

---

## Step 5: Build & Start Services

```bash
# Build and start all services
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d

# Wait for services to be ready (~30 seconds)
docker compose ps
```

Expected output:
```
NAME                  STATUS
campsite_postgres     Up (healthy)
campsite_redis        Up
campsite_backend      Up (healthy)
campsite_frontend     Up (healthy)
```

---

## Step 6: Initialize Database

```bash
# Run migrations, generate Prisma client, and seed data
docker compose exec backend npm run db:setup
```

This runs:
- `db:generate` - Generates Prisma client
- `db:migrate` - Runs database migrations
- `db:seed` - Seeds initial data (admin user, etc.)

---

## Step 7: Verify Deployment

```bash
# Check backend health
curl http://localhost:5000/health

# Check frontend
curl http://localhost:5137

# View logs
docker compose logs -f backend
docker compose logs -f frontend
```

---

## Step 8: Set Up SSL (Let's Encrypt)

```bash
# Stop services temporarily
docker compose down

# Install Certbot
sudo apt update
sudo apt install certbot

# Get SSL certificate (replace with your domain)
sudo certbot certonly --standalone -d yourdomain.com

# Create SSL directory
mkdir -p docker/ssl

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem docker/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem docker/ssl/key.pem

# Set permissions
sudo chown $USER:$USER docker/ssl/*.pem
```

### Enable HTTPS in Nginx

Edit `docker/nginx.conf` and uncomment the HTTPS server block (lines 112-125):

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Add your location blocks here (same as port 80)
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Update Backend CORS

In `backend/.env.production`:
```env
CORS_ORIGIN="https://yourdomain.com"
COOKIE_SECURE=true
```

### Restart with SSL

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

---

## Step 9: Security Hardening

### 9.1 Remove Prisma Studio (Production)

Edit `docker-compose.prod.yml` and remove the `studio` service (lines 17-35).

### 9.2 Remove Database Port Exposure

Edit `docker-compose.yml` and comment out or remove line 19:
```yaml
# ports:
#   - "5433:5432"  # Remove this
```

### 9.3 Remove Redis Port Exposure (Optional)

Edit `docker-compose.yml` and comment out line 41:
```yaml
# ports:
#   - "6379:6379"  # Remove this
```

### 9.4 Configure Firewall

```bash
# Ubuntu UFW
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 9.5 Set Up Auto-Renewal for SSL

```bash
# Add to crontab
sudo crontab -e

# Add this line:
0 3 * * * certbot renew --quiet && docker compose restart nginx
```

---

## Step 10: Test Accounts

After `db:seed`, use these credentials:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@campsite.com | Admin123! |
| Manager | manager@campsite.com | Manager123! |
| Staff | staff@campsite.com | Staff123! |
| Customer | customer@campsite.com | Customer123! |

**Important**: Change all default passwords in production!

---

## Access URLs

| Service | URL | Port |
|---------|-----|------|
| Frontend | https://yourdomain.com | 443 |
| Backend API | https://yourdomain.com/api/v1 | 443 |
| Prisma Studio | http://localhost:5555 | 5555 (DEV ONLY) |

---

## Troubleshooting

### View Logs
```bash
docker compose logs -f           # All services
docker compose logs -f backend   # Backend only
docker compose logs -f frontend  # Frontend only
```

### Restart Services
```bash
docker compose restart backend
docker compose restart frontend
```

### Rebuild from Scratch
```bash
docker compose down
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

### Database Issues
```bash
# Run migrations manually
docker compose exec backend npm run db:migrate

# Re-seed data
docker compose exec backend npm run db:seed

# Open Prisma Studio
docker compose exec backend npx prisma studio
```

### Check Service Health
```bash
docker compose ps
curl http://localhost:5000/health
curl http://localhost:5137
```

---

## Maintenance

### Update Deployment
```bash
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
docker compose exec backend npm run db:migrate
```

### Backup Database
```bash
docker compose exec postgres pg_dump -U campsite_user campsite_db > backup.sql
```

### Restore Database
```bash
cat backup.sql | docker compose exec -T postgres psql -U campsite_user campsite_db
```

### View Disk Usage
```bash
docker system df
docker compose logs --tail=100
```

---

## Notes

- PostgreSQL and Redis run as Docker containers — no need to install them separately
- All secrets should be unique and never committed to git
- The `USE_MOCK_DATA=true` flag in prod compose is for demo purposes; set to `false` for real queries
- Prisma Studio is included for FYP evaluation only — remove in real production
- Logs are stored in `backend/logs/` directory (winston + daily rotate)
