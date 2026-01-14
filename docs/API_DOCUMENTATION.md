# API Documentation and Data Flows

This document describes the API interfaces and data flows in the Vifi.ee frontend application.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [API Endpoints](#api-endpoints)
3. [Data Models](#data-models)
4. [Data Flow Patterns](#data-flow-patterns)
5. [Authentication Flow](#authentication-flow)
6. [Video Playback Flow](#video-playback-flow)
7. [Purchase Flow](#purchase-flow)
8. [Session Management](#session-management)

## Architecture Overview

The Vifi.ee frontend is built using:
- **Framework**: Backbone.js (MVC pattern)
- **Template Engine**: ICanHaz.js (Mustache-based)
- **HTTP Library**: jQuery Ajax
- **Video Player**: Flowplayer 6/7
- **State Management**: Backbone Router with history

### Application Structure

```
/js
├── /models          - Data models (User, Film, Event, Purchase, etc.)
├── /views           - UI views for rendering
├── /collections     - Model collections
├── /platforms       - Platform-specific code
├── init.js          - Application initialization
├── router.js        - URL routing
└── settings.js      - Configuration
```

## API Endpoints

### Base Configuration

```javascript
Api: {
    url: '//dev.vifi.ee/api/',
    key: '' // API key for authentication
}
```

### Core Endpoints

#### Search & Discovery

**Search Films**
```
GET /api/search
Parameters:
  - api_key: string (required)
  - q: string (search query)
  - genres: string (comma-separated)
  - periods: string (comma-separated)
  - durations: string (comma-separated)
  - limit: number (default: 400)
  - sortKey: string (default: 'updated_at')
  - order: number (0=desc, 1=asc)
```

**Get Film Details**
```
GET /api/films/{film_id}
Parameters:
  - api_key: string
  - language: string (default: 'est')
```

**Featured Content**
```
GET /api/featured
Parameters:
  - api_key: string
  - limit: number (default: 8)
  - randomize: boolean
```

#### User Management

**User Registration**
```
POST /api/users/register
Body:
  - email: string
  - password: string
  - username: string
  - device_id: string (optional)
```

**User Login**
```
POST /api/users/login
Body:
  - email: string
  - password: string
  - device_id: string (optional)
```

**User Session**
```
GET /api/users/session
Headers:
  - Cookie: vifi_session
Parameters:
  - api_key: string
```

**Facebook Login**
```
POST /api/users/facebook
Body:
  - access_token: string
  - device_id: string (optional)
```

#### Purchase & Payment

**Create Purchase**
```
POST /api/purchases
Body:
  - film_id: string
  - payment_method: string ('code', 'mobile', 'card')
  - device_id: string (optional)
```

**Verify Purchase Code**
```
POST /api/purchases/verify
Body:
  - code: string
  - film_id: string
```

**Get User Purchases**
```
GET /api/users/{user_id}/purchases
Parameters:
  - api_key: string
```

#### Video Streaming

**Get Video Sources**
```
GET /api/films/{film_id}/sources
Parameters:
  - api_key: string
  - quality: string ('hd', 'sd', 'auto')
Returns:
  - hls_url: string
  - mp4_url: string
  - rtmp_url: string
  - subtitles: array
```

**Update Playhead**
```
POST /api/playhead
Body:
  - film_id: string
  - position: number (seconds)
  - duration: number (seconds)
```

## Data Models

### Film Model

```javascript
App.Models.Film = Backbone.Model.extend({
    defaults: {
        id: null,
        title: '',
        description: '',
        genres: [],
        duration: 0,
        year: null,
        rating: 0,
        poster_url: '',
        backdrop_url: '',
        trailer_url: '',
        available: true,
        price: 0,
        purchased: false
    },
    
    // API endpoint
    urlRoot: App.Settings.Api.url + 'films',
    
    // Methods
    purchase: function() { /* ... */ },
    play: function() { /* ... */ },
    isPurchased: function() { /* ... */ }
});
```

### User Model

```javascript
App.Models.User = Backbone.Model.extend({
    defaults: {
        id: null,
        username: '',
        email: '',
        authenticated: false,
        purchases: [],
        watchlist: [],
        preferences: {}
    },
    
    urlRoot: App.Settings.Api.url + 'users',
    
    // Methods
    login: function(credentials) { /* ... */ },
    logout: function() { /* ... */ },
    register: function(data) { /* ... */ },
    hasPurchased: function(film_id) { /* ... */ }
});
```

### Purchase Model

```javascript
App.Models.Purchase = Backbone.Model.extend({
    defaults: {
        id: null,
        film_id: null,
        user_id: null,
        purchase_date: null,
        expiration_date: null,
        payment_method: 'code',
        status: 'pending'
    },
    
    urlRoot: App.Settings.Api.url + 'purchases'
});
```

## Data Flow Patterns

### 1. Request/Response Flow

```
┌─────────┐      ┌──────────┐      ┌─────────┐      ┌──────────┐
│  View   │─────▶│  Model   │─────▶│ API     │─────▶│ Backend  │
└─────────┘      └──────────┘      └─────────┘      └──────────┘
     ▲                 │                 │                 │
     │                 │                 │                 │
     └─────────────────┴─────────────────┴─────────────────┘
              Event triggers view update
```

**Example: Loading a Film**

```javascript
// 1. User navigates to film page
app.router.navigate('film/123', {trigger: true});

// 2. Router calls controller
filmController: function(filmId) {
    var film = new App.Models.Film({id: filmId});
    
    // 3. Model fetches from API
    film.fetch({
        success: function(model) {
            // 4. View renders with data
            var view = new App.Views.FilmView({model: model});
            view.render();
        }
    });
}
```

### 2. Event-Driven Updates

```javascript
// Model changes trigger view updates
film.on('change', function() {
    this.render();
}, this);

// User action triggers model update
this.$('.purchase-btn').on('click', function() {
    film.purchase().then(function() {
        // Model updated, view re-renders automatically
    });
});
```

### 3. Collection Synchronization

```javascript
// Collections manage multiple models
var films = new App.Collections.Films();

// Fetch and auto-update
films.fetch({
    data: {
        q: 'action',
        limit: 20
    },
    success: function(collection) {
        // Collection view renders all models
        collectionView.render();
    }
});
```

## Authentication Flow

### Standard Login Flow

```
1. User enters credentials
   ├─▶ View captures form data
   └─▶ Calls User.login(email, password)

2. Model sends POST /api/users/login
   ├─▶ Backend validates credentials
   └─▶ Returns session token + user data

3. Session token stored in cookie
   ├─▶ Cookie: vifi_session
   └─▶ Domain: .vifi.ee

4. User model updated with data
   ├─▶ authenticated: true
   └─▶ Triggers 'login' event

5. View updates UI
   ├─▶ Show user menu
   └─▶ Redirect to dashboard
```

### Facebook Login Flow

```
1. User clicks "Login with Facebook"
   └─▶ Calls FB.login()

2. Facebook SDK authenticates
   ├─▶ User approves app
   └─▶ Returns access_token

3. Send token to backend
   └─▶ POST /api/users/facebook

4. Backend validates with Facebook
   ├─▶ Retrieves user profile
   └─▶ Creates/updates local user

5. Session established
   └─▶ Same as standard login (step 3-5)
```

### Session Validation

```javascript
// On app initialization
App.init = function() {
    // Check for existing session
    var session = App.Models.Session.check();
    
    if (session.isValid()) {
        // Restore user state
        app.user.set(session.get('user'));
        app.user.set('authenticated', true);
    } else {
        // Show login form
        app.router.navigate('login', {trigger: true});
    }
};
```

## Video Playback Flow

### Playback Initialization

```
1. User clicks play button
   ├─▶ Check if purchased
   │   ├─▶ If yes: continue
   │   └─▶ If no: show purchase flow
   │
2. Request video sources
   └─▶ GET /api/films/{id}/sources
       ├─▶ HLS URL (adaptive streaming)
       ├─▶ MP4 URL (progressive download)
       └─▶ Subtitles (if available)

3. Initialize Flowplayer
   ├─▶ Configure sources
   ├─▶ Set quality options
   └─▶ Load subtitles

4. Start playback
   └─▶ HLS for modern browsers
       └─▶ Fallback to MP4 for older browsers

5. Track playhead
   └─▶ POST /api/playhead every 30 seconds
       └─▶ Save resume position
```

### Quality Selection

```javascript
Player: {
    defaultMediaPlayer: 'fp7',
    hls_url: 'https://media.vifi.ee/vod/vod',
    mp4_url: '//gonzales.vifi.ee/zsf/',
    rtmp_url: 'rtmp://media.vifi.ee/vod',
    
    // Quality levels
    qualities: ['auto', 'hd', 'sd', 'low']
}
```

### Playhead Tracking

```javascript
// Track viewing progress
setInterval(function() {
    if (player.playing) {
        var position = player.currentTime;
        var duration = player.duration;
        
        App.Models.Playhead.update({
            film_id: film.id,
            position: position,
            duration: duration
        });
    }
}, 30000); // Every 30 seconds
```

## Purchase Flow

### Code-Based Purchase

```
1. User selects film
   └─▶ Check authentication
       ├─▶ If not logged in: redirect to login
       └─▶ If logged in: continue

2. Show purchase modal
   ├─▶ Display price
   └─▶ Show payment options

3. User enters purchase code
   └─▶ POST /api/purchases/verify
       └─▶ code: "XXXX-XXXX-XXXX"

4. Backend validates code
   ├─▶ Check if code exists
   ├─▶ Check if code is unused
   └─▶ Check if code is valid

5. If valid:
   ├─▶ Create purchase record
   ├─▶ Associate with user
   └─▶ Return success

6. Update UI
   ├─▶ Show success message
   ├─▶ Enable playback
   └─▶ Refresh user purchases
```

### Mobile Payment Flow

```
1. User selects mobile payment
   └─▶ Enter phone number

2. Send SMS request
   └─▶ POST /api/purchases/mobile
       └─▶ phone: "+372XXXXXXXX"

3. Backend initiates SMS flow
   ├─▶ Send premium SMS instructions
   └─▶ Return transaction ID

4. User completes SMS payment
   └─▶ Sends premium SMS

5. Backend receives payment callback
   ├─▶ Validates payment
   └─▶ Creates purchase

6. Frontend polls for status
   └─▶ GET /api/purchases/{transaction_id}/status
       └─▶ Every 3 seconds until complete

7. Purchase confirmed
   └─▶ Same as code-based (step 6)
```

## Session Management

### Cookie Configuration

```javascript
Cookies: {
    cookie_name: 'vifi_session',
    cookie_options: {
        path: '/',
        domain: '.vifi.ee'
    },
    purchase_cookie_name: 'film'
}
```

### Session Pairing (Multi-Device)

```
1. User logs in on Device A
   └─▶ Session created with device_id_a

2. User logs in on Device B
   └─▶ Sends device_id_b + session_token

3. Backend pairs devices
   ├─▶ Links device_id_b to same session
   └─▶ Returns confirmation

4. Purchases sync across devices
   └─▶ User can watch on either device
```

### Session Expiration

```javascript
// Check session validity
Session.isValid = function() {
    var expiration = this.get('expires_at');
    var now = Date.now();
    
    return expiration > now;
};

// Refresh session before expiration
if (session.expiresIn() < 3600000) { // 1 hour
    session.refresh();
}
```

## Error Handling

### API Error Responses

```javascript
{
    "error": {
        "code": 401,
        "message": "Unauthorized",
        "details": "Invalid session token"
    }
}
```

### Error Handling Pattern

```javascript
film.fetch({
    success: function(model, response) {
        // Handle success
    },
    error: function(model, response) {
        var error = response.responseJSON.error;
        
        switch(error.code) {
            case 401:
                // Session expired
                app.user.logout();
                app.router.navigate('login', {trigger: true});
                break;
            case 404:
                // Film not found
                app.router.navigate('404', {trigger: true});
                break;
            default:
                // Show error message
                App.Utils.showError(error.message);
        }
    }
});
```

## Rate Limiting

The API enforces rate limits:
- **30 requests per 10 seconds** per IP
- **Maximum 20 simultaneous connections** per IP

### Handling Rate Limits

```javascript
// Queue requests to avoid rate limiting
var requestQueue = [];
var processing = false;

function queueRequest(request) {
    requestQueue.push(request);
    processQueue();
}

function processQueue() {
    if (processing || requestQueue.length === 0) return;
    
    processing = true;
    var request = requestQueue.shift();
    
    $.ajax(request).always(function() {
        processing = false;
        setTimeout(processQueue, 350); // ~3 req/sec
    });
}
```

## Performance Considerations

### Caching Strategy

```javascript
// Cache configuration data
var configCache = localStorage.getItem('api_config');
if (configCache && !isExpired(configCache)) {
    useCache(configCache);
} else {
    fetchConfig().then(cache);
}

// Cache film lists
var filmCache = new LRU({
    max: 500,
    maxAge: 1000 * 60 * 15 // 15 minutes
});
```

### Lazy Loading

```javascript
// Load images on scroll
$('.film-grid').on('scroll', function() {
    $('.film-poster[data-src]').each(function() {
        if (isInViewport(this)) {
            this.src = this.dataset.src;
            this.removeAttribute('data-src');
        }
    });
});
```

## Security Considerations

### API Key Protection

```javascript
// Never expose API key in client code
// Proxy requests through backend
$.ajax({
    url: '/api-proxy/search',
    // Backend adds API key server-side
});
```

### XSS Prevention

```javascript
// Escape user input
var safeTitle = _.escape(film.get('title'));
$('.film-title').text(safeTitle); // Use .text() not .html()
```

### CSRF Protection

```javascript
// Include CSRF token in POST requests
$.ajaxSetup({
    headers: {
        'X-CSRF-Token': $('meta[name="csrf-token"]').attr('content')
    }
});
```

## Monitoring & Analytics

### Google Analytics

```javascript
// Track page views
App.Settings.page_change_callback = function(title, parameters) {
    if (window.ga) {
        ga('send', 'pageview', {
            page: window.location.pathname,
            title: title
        });
    }
};
```

### Sentry Error Tracking

```javascript
if (App.Settings.sentry_enabled) {
    Sentry.init({
        dsn: App.Settings.sentry_dsn,
        environment: App.Settings.debug ? 'development' : 'production'
    });
}
```

## Testing API Endpoints

### Using curl

```bash
# Search films
curl "https://dev.vifi.ee/api/search?api_key=YOUR_KEY&q=action"

# Get film details
curl "https://dev.vifi.ee/api/films/123?api_key=YOUR_KEY"

# Login
curl -X POST "https://dev.vifi.ee/api/users/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret"}'
```

## Related Documentation

- [DEPENDENCIES.md](DEPENDENCIES.md) - Third-party libraries
- [CODE_REVIEW_GUIDELINES.md](CODE_REVIEW_GUIDELINES.md) - Code review process
- [BUGFIXES.md](BUGFIXES.md) - Bug fix changelog
- [apiary.apib](apiary.apib) - Full API specification

---

**Last Updated**: December 2025
**Maintainer**: Vifi.ee Development Team
