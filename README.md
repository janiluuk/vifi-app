# Vifi.ee Frontend

[![Version](https://img.shields.io/badge/version-2020.5.2-blue.svg)](https://github.com/janiluuk/Vifi.ee-frontend)
[![License](https://img.shields.io/badge/license-ISC-green.svg)](LICENSE)

Vifi.ee is an online video streaming service frontend application built with Backbone.js. This application provides a modern interface for browsing, purchasing, and watching video content.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Configuration](#configuration)
- [Building for Production](#building-for-production)
- [Testing](#testing)
- [Development](#development)
- [Project Structure](#project-structure)
- [Supported Technologies](#supported-technologies)
- [Documentation](#documentation)
- [Troubleshooting](#troubleshooting)

## Features

- **Video Streaming**: Watch video content with adaptive streaming (HLS) and progressive download (MP4)
- **Video Player**: Powered by Flowplayer 6/7 with quality selection and subtitle support
- **Search & Discovery**: Advanced search with genre, period, and duration filters
- **User Management**: Registration, login, and Facebook authentication
- **Purchase System**: Multiple payment methods (code, mobile, card)
- **Responsive Design**: Works on desktop and mobile devices
- **Resume Playback**: Automatically resume watching from where you left off
- **Multilingual Support**: Currently supports Estonian (est)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v16.x or higher (recommended: v18.x or later)
- **npm**: v8.x or higher (comes with Node.js)
- A modern web browser (Chrome, Firefox, Safari, or Edge)

You can verify your installations by running:

```bash
node --version
npm --version
```

## Installation

1. **Clone the repository**:

```bash
git clone https://github.com/janiluuk/Vifi.ee-frontend.git
cd Vifi.ee-frontend
```

2. **Install dependencies**:

```bash
npm install
```

This will install all the necessary packages defined in `package.json`, including:
- Webpack and Babel for building and transpiling
- ESLint for code linting
- Jest for testing
- Backbone.js, jQuery, and Lodash for the application

## Running the Application

### Development Mode

For development with auto-rebuild on file changes:

```bash
npm run watch
```

This will:
- Start webpack in watch mode
- Automatically rebuild when you change files
- Generate source maps for debugging
- Output files to the `dist/` directory

To view the application, open `dist/index.html` in your web browser, or serve the `dist/` directory with a local web server:

```bash
# Using Python 3
cd dist && python3 -m http.server 8000

# Using Node.js (if you have http-server installed globally)
cd dist && npx http-server -p 8000
```

Then navigate to `http://localhost:8000` in your browser.

### Development Build (One-time)

For a single development build without watching:

```bash
npm run build:dev
```

### Production Build

For an optimized production build:

```bash
npm run build
```

This will:
- Minify JavaScript code
- Remove console.log statements and debuggers
- Generate optimized bundles
- Create source maps for debugging
- Output files to the `dist/` directory

## Configuration

### Environment Variables

The application supports environment-based configuration for all domain names and URLs. This allows you to easily deploy the application to different environments (development, staging, production) or customize it for your own deployment.

#### Setting Up Environment Variables

1. **Copy the example environment file**:

```bash
cp .env.example .env
```

2. **Edit `.env` and customize the values**:

```bash
# Example .env configuration
MAIN_DOMAIN=yourdomain.com
WWW_DOMAIN=www.yourdomain.com
API_URL=//api.yourdomain.com/api/
API_KEY=your-api-key-here
# ... other settings
```

3. **Build the application** (environment variables are injected at build time):

```bash
npm run build
```

#### Available Environment Variables

**Required:**
| Variable | Default | Description |
|----------|---------|-------------|
| `API_URL` | `//api.example.com/api/` | Backend API endpoint URL (required) |
| `API_KEY` | (empty) | API authentication key (required) |

**Media & Streaming:**
| Variable | Default | Description |
|----------|---------|-------------|
| `HLS_URL` | `https://media.example.com/vod/vod` | HLS adaptive streaming base URL |
| `MP4_URL` | `//cdn.example.com/zsf/` | MP4 progressive download base URL |
| `RTMP_URL` | `rtmp://media.example.com/vod` | RTMP streaming base URL (legacy) |
| `SUBTITLES_URL` | `//cdn.example.com/subs/` | Subtitle files base URL |

**Content Delivery:**
| Variable | Default | Description |
|----------|---------|-------------|
| `IMAGE_OPTIMIZER_URL` | `//cdn.example.com/files/images/image.php` | Image optimization service URL |
| `SPEEDTEST_URL` | `//cdn.example.com/files/bwtest.jpg` | Bandwidth test file URL |
| `CHANNEL_URL` | `//www.example.com/channel.html` | Facebook channel file URL |
| `CACHED_INIT_URL` | `//www.example.com/init.json` | Cached initialization data URL |

**Application Settings:**
| Variable | Default | Description |
|----------|---------|-------------|
| `SITE_NAME` | `Vifi` | Site name displayed in the application |
| `ANONYMOUS_USERNAME` | `anonymous@example.com` | Email for anonymous users |
| `DISQUS_SHORTNAME` | `vifi` | Disqus comments integration shortname |

**Optional Integrations:**
| Variable | Default | Description |
|----------|---------|-------------|
| `FACEBOOK_APP_ID` | (empty) | Facebook App ID for OAuth login |
| `GOOGLE_ANALYTICS_CODE` | `UA-XXXXX-1` | Google Analytics tracking ID |
| `SENTRY_DSN` | (empty) | Sentry error tracking DSN |

**Legacy (auto-derived):** `MAIN_DOMAIN`, `WWW_DOMAIN`, `COOKIE_DOMAIN`, `API_DOMAIN`, `MEDIA_DOMAIN`, `CDN_DOMAIN` are automatically computed from the URLs above for backward compatibility.

**Note:** Environment variables are injected at **build time** by webpack, not at runtime. You need to rebuild the application whenever you change environment variables.

### Docker Deployment

The application includes comprehensive Docker support for easy deployment with multiple options for different scenarios.

**📖 For detailed Docker instructions, see [DOCKER.md](docs/DOCKER.md)**

**Quick Start (Localhost):**
```bash
cp .env.local.example .env
docker compose -f docker/docker-compose.yml up -d
# Access at http://localhost:8080
```

There are three Docker Compose configurations available:
- **docker/docker-compose.yml** - Full production build with environment control
- **docker/docker-compose.simple.yml** - Quick serve of pre-built dist/ folder
- **docker/docker-compose.dev.yml** - Development mode with hot reload

For detailed instructions on each option, troubleshooting, and advanced configurations, see [DOCKER.md](docs/DOCKER.md).

#### Standard Dockerfile Options

There are two Dockerfile options:

1. **docker/Dockerfile** (recommended) - Serves pre-built `dist/` folder
2. **docker/Dockerfile.build** - Multi-stage build (may have npm issues in some environments)

#### Method 1: Simple Docker Deployment (Recommended)

Build the application locally first, then create a Docker image:

```bash
# 1. Configure environment variables
cp .env.example .env
# Edit .env with your values

# 2. Build the application
npm run build

# 3. Build and run Docker image
docker build -t vifi-frontend .
docker run -p 8080:80 vifi-frontend
```

#### Method 2: Multi-stage Build with Docker

Use `docker/Dockerfile.build` to build everything inside Docker:

```bash
# Build with default settings
docker build -f docker/Dockerfile.build -t vifi-frontend .

# Build with custom environment variables
docker build -f docker/Dockerfile.build \
  --build-arg API_URL=//api.mysite.com/api/ \
  --build-arg API_KEY=my-secret-key \
  --build-arg MAIN_DOMAIN=mysite.com \
  -t vifi-frontend .

# Run the container
docker run -p 8080:80 vifi-frontend
```

#### Using Docker Compose

Three docker-compose configurations are available depending on your needs:

##### Option 1: Full Build (Recommended for Production)

Uses `docker/docker-compose.yml` - Builds the application inside Docker with all environment variables.

1. **Create or edit `.env` file** with your configuration:

```bash
# For localhost development
cp .env.local.example .env

# For production, use .env.example
# cp .env.example .env
# Edit .env with your values
```

2. **Build and run**:

```bash
# Build and start the container
docker compose -f docker/docker-compose.yml up -d

# View logs
docker compose -f docker/docker-compose.yml logs -f

# Stop the container
docker compose -f docker/docker-compose.yml down
```

The application will be available at `http://localhost:8080`.

##### Option 2: Simple Serve (Fastest for Local Testing)

Uses `docker/docker-compose.simple.yml` - Serves pre-built `dist/` folder. Build locally first:

```bash
# 1. Build the application
npm run build

# 2. Start the server
docker compose -f docker/docker-compose.simple.yml up -d

# The application will be available at http://localhost:8080
```

##### Option 3: Development Mode with Hot Reload

Uses `docker/docker-compose.dev.yml` - Runs webpack in watch mode for development:

```bash
# Start development environment
docker compose -f docker/docker-compose.dev.yml up

# The build output will be in dist/ and served at http://localhost:8080
# Webpack watch mode runs on http://localhost:3000
```

**Note:** For any docker compose commands, you can use either `docker-compose` (older) or `docker compose` (newer Docker CLI plugin).

#### Docker Environment Variables

When using Docker, you can pass environment variables in three ways:

1. **Via `.env` file** (recommended for docker-compose):
   ```bash
   # .env file in the same directory as docker-compose.yml
   API_URL=//api.mysite.com/api/
   API_KEY=my-secret-key
   ```

2. **Via build arguments** in `docker build`:
   ```bash
   docker build --build-arg API_URL=//api.mysite.com/api/ -t vifi-frontend .
   ```

3. **Via environment variables** in docker-compose.yml:
   ```yaml
   services:
     frontend:
       build:
         args:
           - API_URL=${API_URL}
           - API_KEY=${API_KEY}
   ```

### Static Configuration

The application is also configured through the `src/js/settings.js` file. All settings are defined in the `App.Settings` object. However, **domain-related settings now use environment variables** and should be configured via `.env` file instead of editing `settings.js` directly.

### Settings Reference Table

Below is a comprehensive table of all available settings and their descriptions:

#### Basic Settings

| Setting | Type | Default Value | Description |
|---------|------|---------------|-------------|
| `version` | String | `'2020-05.2'` | Application version number |
| `debug` | Boolean | `false` | Enable debug mode for additional logging |
| `language` | String | `'est'` | Default language code (Estonian) |
| `sitename` | String | `process.env.SITE_NAME` | Site name displayed in the application (from env) |
| `skin` | String | `'vifi'` | UI theme/skin identifier |
| `anonymous_username` | String | `process.env.ANONYMOUS_USERNAME` | Default username for anonymous users (from env) |
| `sortingEnabled` | Boolean | `true` | Enable/disable sorting functionality in UI |
| `loginEnabled` | Boolean | `true` | Enable/disable user login and registration |
| `commentsEnabled` | Boolean | `true` | Enable/disable Disqus comments on videos |
| `disqus_shortname` | String | `process.env.DISQUS_SHORTNAME` | Disqus shortname for comments integration (from env) |

#### API Settings (`Api` object)

| Setting | Type | Default Value | Description |
|---------|------|---------------|-------------|
| `Api.url` | String | `process.env.API_URL` | Backend API endpoint URL (from env) |
| `Api.key` | String | `process.env.API_KEY` | API authentication key (from env, required for API access) |

**Important**: You must set `API_KEY` environment variable for the application to work properly.

#### Cookie Settings (`Cookies` object)

| Setting | Type | Default Value | Description |
|---------|------|---------------|-------------|
| `Cookies.cookie_name` | String | `'vifi_session'` | Name of the session cookie |
| `Cookies.cookie_options.path` | String | `'/'` | Cookie path scope |
| `Cookies.cookie_options.domain` | String | `process.env.COOKIE_DOMAIN` | Cookie domain scope (from env, include leading dot) |
| `Cookies.purchase_cookie_name` | String | `'film'` | Name of the purchase tracking cookie |

#### Image Settings (`Images` object)

| Setting | Type | Default Value | Description |
|---------|------|---------------|-------------|
| `Images.image_optimizer_enabled` | Boolean | `true` | Enable/disable image optimization service |
| `Images.image_optimizer_url` | String | `process.env.IMAGE_OPTIMIZER_URL` | URL of the image optimization service (from env) |
| `Images.image_optimizer_default_preset` | String | `'w780'` | Default image width preset for optimization |

#### Featured Content Settings (`Featured` object)

| Setting | Type | Default Value | Description |
|---------|------|---------------|-------------|
| `Featured.featured_slides_limit` | Number | `8` | Maximum number of featured slides to display |
| `Featured.featured_slides_randomize` | Boolean | `true` | Randomize the order of featured slides |
| `Featured.featured_slides_autoplay_interval` | Number | `6000` | Autoplay interval in milliseconds (6 seconds) |

#### Payment Settings (`Payment` object)

| Setting | Type | Default Value | Description |
|---------|------|---------------|-------------|
| `Payment.default_method` | String | `'code'` | Default payment method (code, mobile, or card) |
| `Payment.mobile.autostart` | Boolean | `false` | Automatically start mobile payment flow |
| `Payment.allowFreeProducts` | Boolean | `true` | Allow access to free content without payment |

#### Player Settings (`Player` object)

| Setting | Type | Default Value | Description |
|---------|------|---------------|-------------|
| `Player.defaultMediaPlayer` | String | `'fp7'` | Default video player version (fp6 or fp7) |
| `Player.flowplayer_fp6_key` | String | `'$202296466927761'` | Flowplayer 6 license key |
| `Player.flowplayer_flash_key` | String | `'#$05466e2f492e2ca07a3'` | Flowplayer Flash license key (legacy) |
| `Player.flowplayer_html5_key` | String | `'$202296466927761'` | Flowplayer HTML5 license key |
| `Player.flowplayer_fp7_token` | String | (JWT token string) | Flowplayer 7 JWT license token - replace with your token |
| `Player.hls_url` | String | `process.env.HLS_URL` | Base URL for HLS adaptive streaming (from env) |
| `Player.mp4_url` | String | `process.env.MP4_URL` | Base URL for MP4 progressive download (from env) |
| `Player.rtmp_url` | String | `process.env.RTMP_URL` | Base URL for RTMP streaming (from env, legacy) |
| `Player.speedtest_url` | String | `process.env.SPEEDTEST_URL` | URL for bandwidth speed testing (from env) |
| `Player.subtitles_url` | String | `process.env.SUBTITLES_URL` | Base URL for subtitle files (from env) |
| `Player.enable_legacy_subtitles` | Boolean | `false` | Enable legacy subtitle format support |
| `Player.convert_srt_to_vtt` | Boolean | `true` | Auto-convert SRT subtitles to WebVTT format |

#### Search Settings (`Search` object)

| Setting | Type | Default Value | Description |
|---------|------|---------------|-------------|
| `Search.initial_film_amount` | Number | `300` | Number of films to load on initial page load |
| `Search.default_query_params.totalPages` | Number | `null` | Total pages in search results (calculated) |
| `Search.default_query_params.totalRecords` | Number | `null` | Total records in search results (calculated) |
| `Search.default_query_params.sortKey` | String | `'sort'` | Query parameter name for sorting |
| `Search.default_query_params.limit` | Number | `400` | Maximum number of results per API request |
| `Search.default_search_state.q` | String | `''` | Default search query string |
| `Search.default_search_state.genres` | Array\|undefined | `undefined` | Default genre filter (array of genre IDs) |
| `Search.default_search_state.periods` | Array\|undefined | `undefined` | Default period/year filter (array of year ranges) |
| `Search.default_search_state.durations` | Array\|undefined | `undefined` | Default duration filter (array of duration ranges) |
| `Search.default_pagination_state.pageSize` | Number | `12` | Number of results to display per page |
| `Search.default_pagination_state.sortKey` | String | `'updated_at'` | Default field to sort results by |
| `Search.default_pagination_state.order` | Number | `0` | Sort order (0 = descending, 1 = ascending) |

#### Analytics & Monitoring Settings

| Setting | Type | Default Value | Description |
|---------|------|---------------|-------------|
| `google_analytics_enabled` | Boolean | `true` | Enable/disable Google Analytics tracking |
| `google_analytics_code` | String | `process.env.GOOGLE_ANALYTICS_CODE` | Google Analytics tracking ID (from env) |
| `sentry_enabled` | Boolean | `true` | Enable/disable Sentry error monitoring |
| `sentry_dsn` | String | `process.env.SENTRY_DSN` | Sentry DSN (Data Source Name) for error reporting (from env) |
| `rt_api_key` | String | `''` | Runtime API key (if applicable) |
| `facebook_app_id` | String | `process.env.FACEBOOK_APP_ID` | Facebook App ID for OAuth login integration (from env) |

#### Callback Functions

| Setting | Type | Default Value | Description |
|---------|------|---------------|-------------|
| `page_change_callback` | Function | `function(title, parameters) {}` | Callback executed when page/route changes |

### Configuration Examples

#### Minimal Required Configuration

Use environment variables for configuration (recommended):

```bash
# .env file
API_URL=//your-api-domain.com/api/
API_KEY=your-api-key-here
COOKIE_DOMAIN=.your-domain.com
```

Or edit `src/js/settings.js` directly (not recommended for domains):

```javascript
// src/js/settings.js
App.Settings = {
    Api: {
        url: process.env.API_URL || '//your-api-domain.com/api/',
        key: process.env.API_KEY || 'your-api-key-here'
    },
    Cookies: {
        cookie_options: {
            domain: process.env.COOKIE_DOMAIN || '.your-domain.com'
        }
    }
}
```

#### Development vs Production

Use separate `.env` files for different environments:

```bash
# .env.development
API_URL=//dev.vifi.ee/api/
API_KEY=dev-api-key
MAIN_DOMAIN=dev.vifi.ee
GOOGLE_ANALYTICS_CODE=

# .env.production
API_URL=//api.vifi.ee/api/
API_KEY=prod-api-key
MAIN_DOMAIN=vifi.ee
GOOGLE_ANALYTICS_CODE=UA-12345678-1
```

Then copy the appropriate file before building:

```bash
# For development
cp .env.development .env
npm run build:dev

# For production
cp .env.production .env
npm run build
```

#### Customizing Video Player

Configure media URLs via environment variables:

```bash
# .env file
HLS_URL=https://your-cdn.com/vod
MP4_URL=//your-cdn.com/videos/
SUBTITLES_URL=//your-cdn.com/subs/
```

The settings.js file now uses these environment variables automatically.

## Building for Production

### Standard Build

```bash
npm run build
```

This creates optimized bundles in the `dist/` directory.

### Build Output

After building, the `dist/` directory will contain:

```
dist/
├── app.bundle.min.js         # Main application bundle
├── vendors.bundle.min.js     # Vendor libraries bundle
├── index.html                # Main HTML file
├── channel.html              # Channel page
├── style/                    # CSS files
├── tpl/                      # Mustache templates
├── inc/                      # Include files
├── swf/                      # Flash files (legacy)
└── favicon.ico               # Favicon
```

### Deployment

To deploy the application:

1. Build the production bundle:
   ```bash
   npm run build
   ```

2. Copy the entire `dist/` directory to your web server

3. Configure your web server to:
   - Serve `index.html` as the default document
   - Enable gzip compression for JavaScript and CSS files
   - Set appropriate cache headers for static assets
   - Redirect all routes to `index.html` (for client-side routing)

**Example Nginx configuration**:

```nginx
server {
    listen 80;
    server_name vifi.ee;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/css application/javascript application/json;
}
```

## Testing

The project includes a comprehensive test suite using Jest.

### Run Tests

```bash
npm test
```

### Run Tests in Watch Mode

For continuous testing during development:

```bash
npm run test:watch
```

### Generate Coverage Report

```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory and include:
- HTML report: Open `coverage/index.html` in your browser
- LCOV format for CI/CD integration

### Test Structure

Tests are located in the `tests/` directory:

```
tests/
├── utils.test.js              # Utility function tests (time conversion, date handling)
├── utils-additional.test.js   # Additional utility tests (ticket validation, etc.)
├── user.test.js               # User/cookie function tests
├── facebook.test.js           # Facebook integration tests
├── iteration.test.js          # Safe property iteration tests
├── jquery.test.js             # jQuery helper function tests
├── session.test.js            # Session management and refresh tests (NEW)
├── forms.test.js              # Form validation and view tests (NEW)
├── models.test.js             # Base model and API functionality tests (NEW)
├── platform.test.js           # Platform detection and initialization tests (NEW)
└── README.md                  # Test documentation
```

**Recent Test Additions:**
- Added **session.test.js** with 56 tests covering FilmSession model functionality
- Added **forms.test.js** with 30 tests for form validation and password handling
- Added **models.test.js** with 52 tests for ApiModel, CookieModel, Film, and Event models
- Added **platform.test.js** with 45 tests for platform detection and helper functions
- **Total: 183 tests** covering critical application functionality

See [tests/README.md](tests/README.md) for more details about the test suite.

## Development

### Code Linting

Check code style and potential errors:

```bash
npm run lint
```

Auto-fix linting issues:

```bash
npm run lint:fix
```

### Development Workflow

1. **Start watch mode**:
   ```bash
   npm run watch
   ```

2. **Make changes** to files in the `src/` directory

3. **Webpack automatically rebuilds** the application

4. **Refresh your browser** to see changes

5. **Run tests** to ensure nothing broke:
   ```bash
   npm test
   ```

6. **Lint your code** before committing:
   ```bash
   npm run lint:fix
   ```

### Webpack Configuration

The build process is configured in `webpack.config.js`:

- **Entry point**: `src/js/init.js`
- **Output**: `dist/` directory
- **Babel transpilation**: Converts modern JavaScript to ES5
- **Code splitting**: Separates vendor libraries for better caching
- **Asset copying**: Copies HTML, CSS, templates, and static files
- **Source maps**: Generated for debugging

### Browser Compatibility

The application supports:

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome for Android)

Legacy browsers (IE11 and below) may require additional polyfills.

## Project Structure

```
Vifi.ee-frontend/
├── .github/              # GitHub Actions workflows
├── src/                  # Source files
│   ├── js/              # JavaScript source
│   │   ├── collections/ # Backbone collections
│   │   ├── models/      # Backbone models
│   │   ├── views/       # Backbone views
│   │   ├── platforms/   # Platform-specific code
│   │   ├── vendor/      # Third-party libraries
│   │   ├── init.js      # Application entry point
│   │   ├── router.js    # URL routing
│   │   └── settings.js  # Configuration
│   ├── style/           # CSS files
│   ├── tpl/             # Mustache templates
│   ├── inc/             # Include files
│   ├── swf/             # Flash files (legacy)
│   ├── index.html       # Main HTML file
│   └── channel.html     # Channel page
├── tests/               # Test files
├── dist/                # Build output (generated)
├── coverage/            # Test coverage (generated)
├── package.json         # NPM dependencies
├── webpack.config.js    # Webpack configuration
├── babel.config.js      # Babel configuration
├── eslint.config.js     # ESLint configuration
├── docs/                # Documentation
│   ├── API_DOCUMENTATION.md # API documentation
│   ├── DOCKER.md        # Docker deployment guide
│   ├── ENVIRONMENT_VARIABLES.md # Environment configuration
│   └── apiary.apib      # API Blueprint specification
├── docker/              # Docker configuration
│   ├── Dockerfile       # Production Docker image
│   ├── Dockerfile.build # Multi-stage build Docker image
│   ├── docker-compose.yml       # Production compose
│   ├── docker-compose.simple.yml # Simple serve compose
│   ├── docker-compose.dev.yml   # Development compose
│   ├── nginx.conf       # Nginx configuration
│   └── .dockerignore    # Docker ignore file
├── scripts/             # Build and utility scripts
│   ├── build-vendors.sh # Build vendor bundles
│   └── pack.sh          # Packaging script
└── README.md           # This file
```

### Key Files

- **src/js/init.js**: Application initialization and setup
- **src/js/router.js**: URL routing and navigation
- **src/js/settings.js**: Application configuration
- **webpack.config.js**: Build configuration
- **package.json**: Dependencies and scripts

## Supported Technologies

### Frontend Framework

- **Backbone.js**: MVC framework for application structure
- **jQuery**: DOM manipulation and AJAX
- **Underscore.js/Lodash**: Utility functions
- **ICanHaz.js**: Mustache templating

### Video Player

- **Flowplayer 6/7**: HTML5 video player
- **HLS**: Adaptive streaming for modern browsers
- **MP4**: Progressive download fallback
- **Subtitles**: VTT and SRT format support

### Build Tools

- **Webpack 5**: Module bundler
- **Babel**: JavaScript transpiler
- **Terser**: JavaScript minifier

### Testing

- **Jest**: Testing framework
- **jsdom**: DOM environment for tests
- **Babel Jest**: Transpile tests with Babel

### Code Quality

- **ESLint**: JavaScript linting
- **Prettier**: Code formatting (via ESLint plugins)

### Authentication

- **Session-based**: Cookie-based authentication
- **Facebook Login**: OAuth integration
- **Multi-device**: Session pairing support

### Payment Methods

- **Code-based**: Voucher/code redemption
- **Mobile**: SMS premium payment
- **Card**: Credit/debit card payment

### Analytics & Monitoring

- **Google Analytics**: Usage tracking
- **Sentry**: Error monitoring
- **Custom events**: User interaction tracking

## Documentation

- **[API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)**: Complete API reference, data flows, and integration guide
- **[tests/README.md](tests/README.md)**: Test suite documentation
- **[apiary.apib](docs/apiary.apib)**: Full API specification in API Blueprint format

### 📋 Code Quality and Optimization Documentation

> **New!** Comprehensive analysis of areas needing improvement:

- **[OPTIMIZATION_SUMMARY.md](OPTIMIZATION_SUMMARY.md)**: Quick reference guide for critical issues and immediate action items
- **[OPTIMIZATION_REFACTORING_LIST.md](OPTIMIZATION_REFACTORING_LIST.md)**: Detailed analysis of 15 major categories of improvements needed
- **[ISSUES_VISUALIZATION.md](ISSUES_VISUALIZATION.md)**: Visual diagrams and charts showing issue distribution and priorities

**Key findings:**
- 655 linting issues identified (186 errors, 469 warnings)
- 0% test coverage for most source files
- Multiple security concerns (XSS, hardcoded secrets, insecure cookies)
- Performance optimization opportunities (bundle size, code splitting)
- Estimated 12-16 weeks for full remediation

Start with [OPTIMIZATION_SUMMARY.md](OPTIMIZATION_SUMMARY.md) for the quick overview and immediate action items.

## Troubleshooting

### Build Errors

**Problem**: `npm install` fails with permission errors

**Solution**: Use `npm install --no-optional` or run with `sudo` (not recommended), or fix npm permissions:
```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

**Problem**: Webpack build fails with memory errors

**Solution**: Increase Node.js memory limit:
```bash
NODE_OPTIONS=--max_old_space_size=4096 npm run build
```

### Runtime Errors

**Problem**: API requests fail with CORS errors

**Solution**: Ensure the API server has proper CORS headers configured, or use a development proxy.

**Problem**: Video player doesn't load

**Solution**: 
- Check that Flowplayer license token is valid
- Verify video URLs are accessible
- Check browser console for errors
- Ensure HLS is supported or MP4 fallback is available

**Problem**: Facebook login doesn't work

**Solution**: 
- Set `facebook_app_id` in `settings.js`
- Ensure your domain is whitelisted in Facebook app settings
- Check browser console for Facebook SDK errors

### Configuration Issues

**Problem**: Application shows "API key required" error

**Solution**: Set `Api.key` in `src/js/settings.js`:
```javascript
Api: {
    url: '//dev.vifi.ee/api/',
    key: 'your-api-key-here'
}
```

**Problem**: Cookies not persisting

**Solution**: Update `cookie_options.domain` in `settings.js` to match your domain:
```javascript
Cookies: {
    cookie_name: 'vifi_session',
    cookie_options: {
        path: '/',
        domain: '.yourdomain.com'  // Update this
    }
}
```

### Testing Issues

**Problem**: Tests fail with "Cannot find module" errors

**Solution**: Ensure all dependencies are installed:
```bash
rm -rf node_modules package-lock.json
npm install
```

**Problem**: Tests timeout

**Solution**: Increase Jest timeout in `package.json`:
```json
"jest": {
    "testTimeout": 10000
}
```

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `npm test`
5. Run linter: `npm run lint:fix`
6. Commit your changes: `git commit -am 'Add my feature'`
7. Push to the branch: `git push origin feature/my-feature`
8. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For questions or issues:
- Open an issue on [GitHub](https://github.com/janiluuk/Vifi.ee-frontend/issues)
- Check existing [API documentation](docs/API_DOCUMENTATION.md)
- Review [test documentation](tests/README.md)

## Author

**Jani Luukkanen**

---

**Version**: 2020.5.2  
**Last Updated**: December 10, 2024
