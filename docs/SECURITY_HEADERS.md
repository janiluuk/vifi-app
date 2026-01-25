# Security Headers Configuration

This document provides recommended security headers for the Vifi.ee application.

## Content Security Policy (CSP)

Add the following CSP header to your web server configuration:

```
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' *.google-analytics.com *.facebook.net *.disqus.com;
  style-src 'self' 'unsafe-inline' *.googleapis.com;
  img-src 'self' data: https: http:;
  media-src 'self' *.example.com blob:;
  connect-src 'self' *.example.com *.google-analytics.com wss:;
  font-src 'self' *.googleapis.com *.gstatic.com;
  frame-src 'self' *.facebook.com *.disqus.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
```

## Additional Security Headers

### X-Content-Type-Options
Prevents MIME type sniffing:
```
X-Content-Type-Options: nosniff
```

### X-Frame-Options
Prevents clickjacking:
```
X-Frame-Options: DENY
```

### X-XSS-Protection
Enables XSS protection (legacy browsers):
```
X-XSS-Protection: 1; mode=block
```

### Strict-Transport-Security (HSTS)
Forces HTTPS connections:
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

### Referrer-Policy
Controls referrer information:
```
Referrer-Policy: strict-origin-when-cross-origin
```

### Permissions-Policy
Controls browser features:
```
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

## Nginx Configuration Example

**Note:** Replace `www.example.com` and `*.example.com` with your actual domain names.

```nginx
server {
    listen 443 ssl http2;
    server_name www.example.com;  # Replace with your actual domain
    
    # Security Headers
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' *.google-analytics.com *.facebook.net *.disqus.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: http:; media-src 'self' *.example.com blob:; connect-src 'self' *.example.com *.google-analytics.com wss:; font-src 'self' *.googleapis.com *.gstatic.com; frame-src 'self' *.facebook.com *.disqus.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests;" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
    
    # SSL Configuration
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # ... rest of configuration
}
```

## Apache Configuration Example

```apache
<IfModule mod_headers.c>
    Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' *.google-analytics.com *.facebook.net *.disqus.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: http:; media-src 'self' *.example.com blob:; connect-src 'self' *.example.com *.google-analytics.com wss:; font-src 'self' *.googleapis.com *.gstatic.com; frame-src 'self' *.facebook.com *.disqus.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests;"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "DENY"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Permissions-Policy "geolocation=(), microphone=(), camera=()"
</IfModule>
```

## Testing Security Headers

Test your security headers using:
- [Mozilla Observatory](https://observatory.mozilla.org/)
- [SecurityHeaders.com](https://securityheaders.com/)
- [SSL Labs](https://www.ssllabs.com/ssltest/)

Target: A+ rating on all security testing tools.

## Notes

1. Update the CSP policy domains to match your actual domains
2. Test thoroughly after implementing CSP to ensure functionality isn't broken
3. Start with a report-only mode if needed: `Content-Security-Policy-Report-Only`
4. Monitor CSP violation reports to fine-tune the policy
5. Review and update security headers regularly as requirements change
