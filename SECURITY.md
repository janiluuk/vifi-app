# Security Configuration Guide

**Last Updated:** January 14, 2026  
**Version:** 1.0

This document outlines security best practices and required configurations for the Vifi.ee frontend application.

---

## Critical Security Updates (Phase 1 - COMPLETED)

### ✅ Fixed Issues

1. **Removed Hardcoded Secrets**
   - All Flowplayer license keys moved to environment variables
   - API keys no longer hardcoded in source code
   - **Action Required:** Set environment variables before deployment

2. **Enhanced Cookie Security**
   - Changed `sameSite` from `'Lax'` to `'Strict'` for authentication cookies
   - Prevents CSRF attacks more effectively
   - Maintains `secure: true` for HTTPS-only transmission

---

## Required Environment Variables

### Critical (Must Set Before Deployment)

```bash
# API Authentication
API_URL=//your-api-domain.com/api/
API_KEY=your-secure-api-key-here

# Flowplayer License Keys
FLOWPLAYER_FP6_KEY=your-fp6-license-key
FLOWPLAYER_HTML5_KEY=your-html5-license-key
FLOWPLAYER_FLASH_KEY=your-flash-license-key  # Legacy
FLOWPLAYER_FP7_TOKEN=your-jwt-token-here

# Cookie Domain
COOKIE_DOMAIN=.your-domain.com
```

### How to Obtain Flowplayer Keys

1. Visit https://flowplayer.com/
2. Create an account or log in
3. Generate license keys for your domain
4. Copy keys to your `.env` file

**Never commit `.env` files to version control!**

---

## Server-Side Security Headers

Add these headers to your web server configuration (nginx/apache):

### Nginx Configuration

```nginx
# Add to your server block or location
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.google-analytics.com https://connect.facebook.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; media-src 'self' https:; connect-src 'self' https:; font-src 'self' data:; frame-src https://www.facebook.com; object-src 'none'; base-uri 'self'; form-action 'self';" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
```

### Apache Configuration

```apache
# Add to .htaccess or virtual host configuration
Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.google-analytics.com https://connect.facebook.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; media-src 'self' https:; connect-src 'self' https:; font-src 'self' data:; frame-src https://www.facebook.com; object-src 'none'; base-uri 'self'; form-action 'self';"
Header always set X-Frame-Options "DENY"
Header always set X-Content-Type-Options "nosniff"
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header always set Permissions-Policy "geolocation=(), microphone=(), camera=()"
```

---

## Cookie Configuration Details

### Current Settings

```javascript
Cookies: {
    cookie_name: 'vifi_session',
    cookie_options: {
        path: '/',
        domain: process.env.COOKIE_DOMAIN || '.example.com',
        secure: true,      // HTTPS only
        sameSite: 'Strict' // Strong CSRF protection
    }
}
```

### Cookie Attributes Explained

- **`secure: true`**: Cookie only sent over HTTPS connections
- **`sameSite: 'Strict'`**: Cookie not sent on cross-site requests (strongest CSRF protection)
- **`path: '/'`**: Cookie available across entire domain
- **`domain`**: Allows cookie sharing across subdomains (e.g., www.example.com and api.example.com)

### Important Notes

- `sameSite: 'Strict'` may affect some OAuth flows if redirecting from external sites
- If you experience login issues after OAuth, you may need to use `sameSite: 'Lax'` as a fallback
- Consider implementing CSRF tokens for additional protection if using `'Lax'`

---

## API Security Best Practices

### Current Issues (To Be Addressed in Phase 1)

1. **API Key in Client Code**
   - **Problem:** API key visible in browser
   - **Status:** ⚠️ Partially mitigated (moved to env vars, but still client-exposed)
   - **Future Solution:** Implement server-side proxy or OAuth 2.0

### Recommended Improvements (Phase 2)

1. **Implement Rate Limiting**
   - Limit requests per user/IP
   - Prevent abuse and DoS attacks

2. **Server-Side API Proxy**
   - Hide API key from client
   - Add server-side authentication layer

3. **OAuth 2.0 / JWT Authentication**
   - Replace API key with user-specific tokens
   - Short-lived access tokens with refresh mechanism

---

## XSS Prevention

### Current Protections

1. **Mustache Templating**
   - Auto-escapes HTML by default
   - Use `{{variable}}` (escaped) instead of `{{{variable}}}` (unescaped)

2. **Content Security Policy**
   - Prevents inline script execution
   - Restricts script sources

### Code Review Checklist

When reviewing templates, ensure:
- [ ] No use of triple-mustache `{{{ }}}` for user content
- [ ] User input sanitized before rendering
- [ ] No `innerHTML` with unsanitized data
- [ ] No `eval()` or `Function()` with user input

---

## Input Validation

### Current State

- ✅ Client-side validation exists
- ⚠️ Server-side validation required

### Recommendations

1. **Always Validate Server-Side**
   - Client validation is for UX only
   - Server must validate all input

2. **Sanitize Before Storage**
   - Remove potentially dangerous characters
   - Use allowlists, not blocklists

3. **Validate Data Types**
   - Ensure integers are integers
   - Validate email formats
   - Check string lengths

---

## Dependency Security

### Regular Audits

```bash
# Check for known vulnerabilities
npm audit

# Update packages (carefully)
npm update

# Check outdated packages
npm outdated
```

### Current Status

- Last audit: January 14, 2026
- Known vulnerabilities: 0 (at time of check)
- Deprecated packages: Several (see npm warnings)

### Recommendations

1. Run `npm audit` weekly
2. Update dependencies monthly
3. Test thoroughly after updates
4. Pin critical dependency versions

---

## Secrets Management

### Do's ✅

- Store secrets in environment variables
- Use `.env` files locally (not committed)
- Use secret management services in production (AWS Secrets Manager, Azure Key Vault, etc.)
- Rotate secrets regularly
- Use different secrets for dev/staging/production

### Don'ts ❌

- Never commit secrets to git
- Don't log secrets
- Don't send secrets in URLs
- Don't store secrets in client-side code
- Don't share secrets via email or chat

### If a Secret is Exposed

1. **Immediately rotate the secret**
2. Audit logs for unauthorized access
3. Review git history (`git log -S "secret"`)
4. If committed, use `git-filter-branch` or BFG Repo-Cleaner
5. Notify security team/stakeholders

---

## Security Checklist

### Before Deployment

- [ ] All environment variables set correctly
- [ ] No secrets in source code (`grep -r "API_KEY\|TOKEN\|SECRET" src/`)
- [ ] Security headers configured on server
- [ ] HTTPS enabled and forced
- [ ] Cookie settings correct for domain
- [ ] CSP policy tested and working
- [ ] API rate limiting enabled
- [ ] Error messages don't leak sensitive info
- [ ] Admin/debug endpoints disabled in production

### Regular Maintenance

- [ ] Run `npm audit` weekly
- [ ] Review access logs for suspicious activity
- [ ] Update dependencies monthly
- [ ] Rotate API keys quarterly
- [ ] Review and update CSP policy
- [ ] Test authentication flows
- [ ] Verify cookie security settings

---

## Security Contacts

### Reporting Security Issues

If you discover a security vulnerability:

1. **Do NOT** open a public issue
2. Email: security@vifi.ee (or appropriate contact)
3. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if known)

### Response Time

- Critical: 24 hours
- High: 72 hours
- Medium: 1 week
- Low: 2 weeks

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Content Security Policy Reference](https://content-security-policy.com/)
- [Flowplayer Security Best Practices](https://flowplayer.com/docs/security)

---

## Changelog

### Version 1.0 (January 14, 2026)
- Initial security documentation
- Documented Phase 1 security fixes
- Removed hardcoded secrets
- Enhanced cookie security (sameSite: Strict)
- Added environment variable requirements
- Documented server security headers

---

**Document Owner:** Development Team  
**Review Frequency:** Quarterly or after security incidents  
**Next Review:** April 14, 2026
