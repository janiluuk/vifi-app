# Environment Variables Reference

This document provides a comprehensive guide to configuring the Vifi.ee frontend application using environment variables.

## Quick Start

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your values:**
   ```bash
   # Minimum required configuration
   API_URL=//api.yourdomain.com/api/
   API_KEY=your-api-key-here
   
   # Customize other URLs as needed (optional)
   HLS_URL=https://media.yourdomain.com/vod/vod
   MP4_URL=//cdn.yourdomain.com/zsf/
   ```

3. **Build the application:**
   ```bash
   npm run build
   ```

## All Environment Variables

### Required Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `API_URL` | `//api.example.com/api/` | Backend API endpoint URL (required) |
| `API_KEY` | (empty) | API authentication key (required) |

### Streaming URLs

| Variable | Default | Description |
|----------|---------|-------------|
| `HLS_URL` | `https://media.example.com/vod/vod` | Base URL for HLS adaptive streaming |
| `MP4_URL` | `//cdn.example.com/zsf/` | Base URL for MP4 progressive download |
| `RTMP_URL` | `rtmp://media.example.com/vod` | Base URL for RTMP streaming (legacy) |

### Asset URLs

| Variable | Default | Description |
|----------|---------|-------------|
| `IMAGE_OPTIMIZER_URL` | `//cdn.example.com/files/images/image.php` | URL for image optimization service |
| `SPEEDTEST_URL` | `//cdn.example.com/files/bwtest.jpg` | URL for bandwidth speed testing |

### Service URLs

| Variable | Default | Description |
|----------|---------|-------------|
| `SUBTITLES_URL` | `//beta.example.com/subs/` | Base URL for subtitle files |
| `CHANNEL_URL` | `//beta.example.com/channel.html` | Facebook channel file URL |
| `CACHED_INIT_URL` | `//www.example.com/init.json` | URL for cached initialization data |

### Application Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `ANONYMOUS_USERNAME` | `anonymous@example.com` | Email address for anonymous users |
| `SITE_NAME` | `Vifi` | Site name displayed in the application |
| `DISQUS_SHORTNAME` | `vifi` | Disqus shortname for comments integration |

### Social Media & External Links

| Variable | Default | Description |
|----------|---------|-------------|
| `WWW_URL` | `//www.example.com` | Main website URL for Open Graph and meta tags |
| `SOCIAL_FACEBOOK_URL` | `https://www.facebook.com/pages/Vifiee/385723814833754` | Facebook page URL |
| `SOCIAL_TWITTER_URL` | `https://twitter.com/vifi_ee` | Twitter profile URL |
| `RSS_FEED_URL` | `//www.example.com/feed` | RSS feed URL |

### Support & Contact Information

| Variable | Default | Description |
|----------|---------|-------------|
| `SUPPORT_PHONE` | `+372 58 667 570` | Support phone number |
| `SUPPORT_EMAIL` | `support@example.com` | Support email address |
| `PRIVACY_URL` | `//www.example.com/privacy` | Privacy policy URL |

### Optional Integration Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `FACEBOOK_APP_ID` | (empty) | Facebook App ID for OAuth login (leave empty to disable) |
| `GOOGLE_ANALYTICS_CODE` | `UA-XXXXX-1` | Google Analytics tracking ID (leave empty to disable) |
| `SENTRY_DSN` | (empty) | Sentry DSN for error reporting (leave empty to disable) |

## Example Configurations

### Development Environment

```bash
# .env.development
API_URL=//api.dev.mysite.com/api/
API_KEY=dev-api-key-here
HLS_URL=https://media.dev.mysite.com/vod/vod
MP4_URL=//cdn.dev.mysite.com/zsf/
SUBTITLES_URL=//cdn.dev.mysite.com/subs/
GOOGLE_ANALYTICS_CODE=
SENTRY_DSN=
```

### Staging Environment

```bash
# .env.staging
API_URL=//api.staging.mysite.com/api/
API_KEY=staging-api-key-here
HLS_URL=https://media.staging.mysite.com/vod/vod
MP4_URL=//cdn.staging.mysite.com/zsf/
GOOGLE_ANALYTICS_CODE=UA-XXXXX-1
SENTRY_DSN=https://...@sentry.io/...
```

### Production Environment

```bash
# .env.production
API_URL=//api.mysite.com/api/
API_KEY=production-api-key-here
HLS_URL=https://media.mysite.com/vod/vod
MP4_URL=//cdn.mysite.com/zsf/
IMAGE_OPTIMIZER_URL=//cdn.mysite.com/files/images/image.php
SUBTITLES_URL=//cdn.mysite.com/subs/
FACEBOOK_APP_ID=123456789
GOOGLE_ANALYTICS_CODE=UA-12345678-1
SENTRY_DSN=https://...@sentry.io/...
```

### Using Original Vifi.ee Domains

```bash
# Copy the pre-configured Vifi.ee settings
cp .env.vifi .env

# Then add your API key
echo "API_KEY=your-api-key-here" >> .env
```

## Important Notes

### Build Time vs Runtime

**Important:** Environment variables are injected at **build time** by webpack, not at runtime. This means:

1. You must rebuild the application whenever you change environment variables
2. Environment variables are baked into the JavaScript bundle
3. The same build cannot be used for different environments

### Switching Between Environments

To switch between environments, use different .env files:

```bash
# For development
cp .env.development .env
npm run build:dev

# For production
cp .env.production .env
npm run build
```

### Docker Deployments

For Docker deployments, environment variables can be passed as build arguments:

```bash
docker build -f docker/Dockerfile.build \
  --build-arg API_URL=//api.mysite.com/api/ \
  --build-arg API_KEY=my-secret-key \
  --build-arg MAIN_DOMAIN=mysite.com \
  -t vifi-frontend .
```

Or use docker-compose with a .env file:

```bash
# Create .env with your values
cp .env.example .env

# Build and run
docker compose -f docker/docker-compose.yml up -d
```

### Security Considerations

1. **Never commit `.env` files** to version control (they're in .gitignore)
2. **Protect your API_KEY** - it should be kept secret
3. **Use HTTPS** for all production domains
4. **Different keys** for different environments (dev, staging, prod)

## Troubleshooting

### Variables Not Being Replaced

If environment variables aren't being replaced in your build:

1. Check that `.env` file exists and is in the project root
2. Ensure the variable name is correct (case-sensitive)
3. Rebuild the application: `npm run build`
4. Clear webpack cache: `rm -rf node_modules/.cache`

### Environment File Not Found

If you see ".env file not found or invalid" during build:

- This is just a warning - the build will use system environment variables or defaults
- To create a .env file: `cp .env.example .env`

### Build Failing

If the build fails after adding environment variables:

1. Check for syntax errors in your .env file
2. Ensure no quotes around values (unless the value itself contains spaces)
3. Verify all required variables are set (especially `API_KEY`)

## Migration from Hardcoded Values

If you're migrating from a version with hardcoded domains:

1. **Backup your current settings.js** (if you modified it)
2. **Create a .env file** with your domains
3. **Rebuild the application**
4. **Test thoroughly** in a non-production environment first

Old hardcoded values in `settings.js` will be replaced by environment variables. If you have custom values that aren't domains, those will still work.

## Support

For issues or questions:
- Check the main [README.md](../README.md) for general documentation
- Review [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for API details
- Open an issue on GitHub if you encounter problems
