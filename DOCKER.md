# Docker & Docker Compose Guide

This guide provides comprehensive instructions for running the Vifi.ee frontend application using Docker and Docker Compose.

## Quick Start

The fastest way to get started on localhost:

```bash
# 1. Copy the localhost environment configuration
cp .env.local.example .env

# 2. Start the application
docker compose up -d

# 3. Access at http://localhost:8080
```

## Table of Contents

- [Docker Compose Options](#docker-compose-options)
- [Environment Configuration](#environment-configuration)
- [Docker Compose Files Explained](#docker-compose-files-explained)
- [Common Use Cases](#common-use-cases)
- [Troubleshooting](#troubleshooting)

## Docker Compose Options

The repository provides three different Docker Compose configurations for different scenarios:

### 1. docker-compose.yml (Production Build)

**Best for:** Production deployments, full environment control

This configuration builds the application inside Docker using `Dockerfile.build`, allowing you to configure all environment variables through the `.env` file.

```bash
# Setup
cp .env.local.example .env  # For localhost
# OR
cp .env.example .env        # For production
# Edit .env with your values

# Run
docker compose up -d

# Access at http://localhost:8080
```

**Features:**
- ✅ Full control over environment variables
- ✅ Builds everything inside Docker
- ✅ Production-ready configuration
- ✅ Configurable port via `PORT` environment variable
- ⚠️ Longer build time (~2-5 minutes)

### 2. docker-compose.simple.yml (Pre-built Serve)

**Best for:** Quick testing, CI/CD pipelines, when you already have a build

This configuration simply serves a pre-built `dist/` folder using nginx. You must build the application locally first.

```bash
# 1. Build locally
npm run build

# 2. Serve with Docker
docker compose -f docker-compose.simple.yml up -d

# Access at http://localhost:8080
```

**Features:**
- ✅ Fastest startup (< 5 seconds)
- ✅ Lightweight (only nginx)
- ✅ Good for testing builds
- ✅ Easy to integrate with CI/CD
- ⚠️ Requires local build first

### 3. docker-compose.dev.yml (Development Mode)

**Best for:** Active development, testing changes

This configuration runs webpack in watch mode, automatically rebuilding when source files change.

```bash
# Start development environment
docker compose -f docker-compose.dev.yml up

# Files in src/ are watched and automatically rebuilt
# Build output: dist/ served at http://localhost:8080
# Webpack dev server: http://localhost:3000 (optional)
```

**Features:**
- ✅ Auto-rebuild on file changes
- ✅ Source maps for debugging
- ✅ Hot reload during development
- ✅ Volume-mounted source code
- ⚠️ Not for production use

## Environment Configuration

### Localhost Configuration

For local development and testing, use `.env.local.example`:

```bash
cp .env.local.example .env
```

This provides sensible defaults for localhost:
- API URL: `//localhost:3000/api/`
- Frontend: `http://localhost:8080`
- Media servers: `localhost:8081`

### Production Configuration

For production deployment, use `.env.example`:

```bash
cp .env.example .env
# Edit with your production URLs and credentials
```

**Important Production Settings:**
- `API_URL` - Your backend API endpoint
- `API_KEY` - Production API authentication key
- `GOOGLE_ANALYTICS_CODE` - Your GA tracking ID
- `SENTRY_DSN` - Error monitoring endpoint
- `FACEBOOK_APP_ID` - For social login

### Custom Configuration

You can override any environment variable:

```bash
# In .env file
API_URL=//my-api.example.com/api/
API_KEY=my-secret-key
PORT=3000

# Or via command line
PORT=3000 docker compose up -d
```

## Docker Compose Files Explained

### docker-compose.yml

```yaml
services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.build
      args:
        - API_URL=${API_URL:-//localhost:3000/api/}
        # ... all environment variables passed as build args
    ports:
      - "${PORT:-8080}:80"
    networks:
      - vifi-network
```

- Uses multi-stage build with Node.js and nginx
- Environment variables injected at build time
- Configurable port (default: 8080)
- Isolated network for security

### docker-compose.simple.yml

```yaml
services:
  frontend:
    image: nginx:alpine
    volumes:
      - ./dist:/usr/share/nginx/html:ro
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
    ports:
      - "${PORT:-8080}:80"
```

- Minimal nginx alpine image
- Volume-mounts pre-built dist folder
- Read-only mounts for security
- No build step required

### docker-compose.dev.yml

```yaml
services:
  frontend-dev:
    image: node:20-alpine
    command: sh -c "npm install && npm run watch"
    volumes:
      - .:/app
      - /app/node_modules
    
  frontend-serve:
    image: nginx:alpine
    volumes:
      - ./dist:/usr/share/nginx/html:ro
    depends_on:
      - frontend-dev
```

- Two services: webpack watch + nginx serve
- Live source code mounting
- Automatic rebuilds on changes
- node_modules volume for faster installs

## Common Use Cases

### Local Development Testing

```bash
# Start and test locally
cp .env.local.example .env
docker compose up -d

# Watch logs
docker compose logs -f

# Rebuild after changes
docker compose up -d --build

# Clean restart
docker compose down
docker compose up -d --build
```

### Development with Hot Reload

```bash
# Start development environment
docker compose -f docker-compose.dev.yml up

# Make changes to files in src/
# Watch console for rebuild notifications
# Refresh browser to see changes

# Stop with Ctrl+C
```

### Production Deployment

```bash
# 1. Configure production environment
cp .env.example .env
nano .env  # Edit with production values

# 2. Build and deploy
docker compose up -d --build

# 3. Verify deployment
docker compose ps
docker compose logs frontend

# 4. Health check
curl http://localhost:8080
```

### CI/CD Pipeline

```bash
# In your CI/CD script:

# Build locally
npm ci
npm run build

# Deploy with simple compose
docker compose -f docker-compose.simple.yml up -d

# Run smoke tests
curl -f http://localhost:8080 || exit 1
```

### Port Configuration

```bash
# Use custom port
PORT=3000 docker compose up -d

# Or set in .env
echo "PORT=3000" >> .env
docker compose up -d

# Access at http://localhost:3000
```

### Multi-Environment Setup

```bash
# Development
cp .env.local.example .env.dev
docker compose --env-file .env.dev up -d

# Staging
cp .env.example .env.staging
# Edit .env.staging with staging values
docker compose --env-file .env.staging up -d

# Production
cp .env.example .env.prod
# Edit .env.prod with production values
docker compose --env-file .env.prod up -d
```

## Troubleshooting

### Port Already in Use

```bash
# Error: port 8080 already allocated

# Solution 1: Use different port
PORT=8081 docker compose up -d

# Solution 2: Stop conflicting container
docker ps
docker stop <container-id>
```

### Build Fails with npm Errors

```bash
# Error: npm install fails in Docker

# Solution 1: Use simple compose with local build
npm install
npm run build
docker compose -f docker-compose.simple.yml up -d

# Solution 2: Clear Docker cache
docker compose down
docker system prune -a
docker compose up -d --build
```

### Cannot Access Application

```bash
# Check container status
docker compose ps

# Check logs
docker compose logs frontend

# Verify port mapping
docker compose port frontend 80

# Test connection
curl -I http://localhost:8080
```

### Environment Variables Not Applied

```bash
# Remember: environment variables are injected at BUILD time

# Solution: Rebuild after changing .env
docker compose down
docker compose up -d --build

# Or force rebuild
docker compose build --no-cache
docker compose up -d
```

### Development Mode Not Rebuilding

```bash
# Check if frontend-dev is running
docker compose -f docker-compose.dev.yml ps

# View webpack logs
docker compose -f docker-compose.dev.yml logs frontend-dev

# Restart if needed
docker compose -f docker-compose.dev.yml restart frontend-dev
```

### Disk Space Issues

```bash
# Clean up Docker resources
docker compose down
docker system prune -a --volumes

# Remove specific images
docker images | grep vifi
docker rmi <image-id>
```

### Permission Issues (Linux)

```bash
# If you get permission errors with volumes

# Solution 1: Fix permissions
sudo chown -R $USER:$USER ./dist ./node_modules

# Solution 2: Run with user mapping
docker compose run --user $(id -u):$(id -g) frontend-dev
```

## Advanced Configuration

### Using Multiple Compose Files

```bash
# Combine configurations
docker compose -f docker-compose.yml -f docker-compose.override.yml up -d

# Example override file (docker-compose.override.yml):
services:
  frontend:
    environment:
      - DEBUG=true
    ports:
      - "8080:80"
      - "8443:443"
```

### Health Checks

Add health checks to docker-compose.yml:

```yaml
services:
  frontend:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### Resource Limits

```yaml
services:
  frontend:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          memory: 256M
```

## Docker Commands Reference

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f [service-name]

# Rebuild and start
docker compose up -d --build

# Force rebuild (no cache)
docker compose build --no-cache

# List services
docker compose ps

# Execute command in container
docker compose exec frontend sh

# View service configuration
docker compose config

# Pull latest images
docker compose pull

# Scale services (not applicable here)
docker compose up -d --scale frontend=3
```

## Notes

- **Docker vs docker-compose**: Modern Docker CLI uses `docker compose` (with space), older versions use `docker-compose` (with hyphen). Both work the same way.

- **Build Time vs Runtime**: Environment variables are injected at build time by webpack, not at runtime. Always rebuild after changing `.env`.

- **Networks**: All compose files create an isolated `vifi-network` for services to communicate securely.

- **Volumes**: Development mode uses volumes to mount source code, allowing live editing without rebuilding the container.

For more information, see:
- [Main README](README.md)
- [Environment Variables Documentation](ENVIRONMENT_VARIABLES.md)
- [Docker Official Documentation](https://docs.docker.com/)
