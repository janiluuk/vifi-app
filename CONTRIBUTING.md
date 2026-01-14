# Contributing to Vifi.ee Frontend

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the Vifi.ee frontend application.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Testing Guidelines](#testing-guidelines)
6. [Commit Message Guidelines](#commit-message-guidelines)
7. [Pull Request Process](#pull-request-process)
8. [Security](#security)

---

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Report security issues privately (see [Security](#security))

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- Git
- Text editor (VS Code recommended)

### Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/yourusername/vifi-app.git
   cd vifi-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Install pre-commit hooks** (optional but recommended)
   ```bash
   npm install -g pre-commit
   pre-commit install
   ```

5. **Run development build**
   ```bash
   npm run dev
   ```

6. **Run tests**
   ```bash
   npm test
   ```

---

## Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/[name]` - New features
- `bugfix/[name]` - Bug fixes
- `hotfix/[name]` - Urgent production fixes

### Creating a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### Keeping Your Branch Updated

```bash
git fetch origin
git rebase origin/main
```

### Running the Application

**Development mode (with hot reload):**
```bash
npm run dev
```

**Production build:**
```bash
npm run build
```

**Serve production build:**
```bash
npm run serve
```

---

## Coding Standards

### JavaScript Style Guide

We follow the **Airbnb JavaScript Style Guide** with some modifications:

#### General Rules

1. **Use strict equality**
   ```javascript
   // Good
   if (value === 1)
   
   // Bad
   if (value == 1)
   ```

2. **Always use radix with parseInt()**
   ```javascript
   // Good
   parseInt(value, 10)
   
   // Bad
   parseInt(value)
   ```

3. **Guard for...in loops**
   ```javascript
   // Good
   for (var key in obj) {
       if (obj.hasOwnProperty(key)) {
           // ...
       }
   }
   
   // Bad
   for (var key in obj) {
       // ...
   }
   ```

4. **No hardcoded secrets**
   ```javascript
   // Good
   apiKey: process.env.API_KEY
   
   // Bad
   apiKey: 'sk_live_abc123'
   ```

5. **Use meaningful variable names**
   ```javascript
   // Good
   const userCount = users.length;
   
   // Bad
   const uc = users.length;
   ```

#### Backbone.js Conventions

- Models extend `Backbone.Model`
- Collections extend `Backbone.Collection`
- Views extend `Backbone.View` or `App.Views.Page`
- Use `listenTo` for event bindings
- Clean up in `remove()` method

#### File Organization

```
src/js/
├── models/         # Data models
├── collections/    # Data collections
├── views/          # UI components
├── platforms/      # Media player implementations
├── vendor/         # Third-party libraries
├── settings.js     # Configuration
├── router.js       # URL routing
└── init.js         # Application initialization
```

### Linting

Run ESLint before committing:

```bash
npm run lint
```

Auto-fix issues:

```bash
npm run lint:fix
```

### Code Comments

- Write self-documenting code when possible
- Add comments for complex logic
- Document public APIs with JSDoc
- Explain "why", not "what"

```javascript
/**
 * Calculate video playback quality based on bandwidth
 * 
 * @param {number} bandwidth - Current bandwidth in kbps
 * @param {Array} qualities - Available quality options
 * @return {Object} Selected quality object
 */
function selectQuality(bandwidth, qualities) {
    // Use 70% of bandwidth to account for fluctuations
    const targetBandwidth = bandwidth * 0.7;
    // ... implementation
}
```

---

## Testing Guidelines

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Writing Tests

1. **Test file naming:** `[module].test.js`
2. **Test structure:** Arrange-Act-Assert pattern
3. **Test coverage:** Aim for >70% coverage

**Example:**

```javascript
describe('UserModel', () => {
    let user;
    
    beforeEach(() => {
        user = new App.Models.User();
    });
    
    it('should validate email format', () => {
        user.set('email', 'invalid-email');
        expect(user.isValid()).toBe(false);
        
        user.set('email', 'valid@example.com');
        expect(user.isValid()).toBe(true);
    });
});
```

### E2E Testing (Future)

We plan to add Playwright for E2E testing. See `IMPROVEMENT_ROADMAP.md` for details.

---

## Commit Message Guidelines

We follow the **Conventional Commits** specification:

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `security`: Security fixes

### Examples

```
feat(auth): add Facebook OAuth login

Implement Facebook OAuth authentication flow with proper
session management and user profile integration.

Closes #123
```

```
fix(player): resolve subtitle sync issue

Subtitles were displaying 2 seconds late due to incorrect
timing calculation in SRT parser.

Fixes #456
```

```
security(settings): remove hardcoded API keys

Move all API keys and secrets to environment variables to
prevent exposure in source code.

BREAKING CHANGE: Requires FLOWPLAYER_FP7_TOKEN env var
```

### Commit Message Rules

- Use present tense ("add" not "added")
- Use imperative mood ("move" not "moves")
- First line max 72 characters
- Reference issues and PRs where applicable
- Explain "why" in body, "what" is in the diff

---

## Pull Request Process

### Before Submitting

1. ✅ Tests pass: `npm test`
2. ✅ Linting passes: `npm run lint`
3. ✅ No security issues: Check with pre-commit hooks
4. ✅ Documentation updated (if applicable)
5. ✅ CHANGELOG.md updated (for user-facing changes)

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested?

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No security issues
- [ ] Backward compatible (or documented)
```

### PR Title Format

Use conventional commit format:

```
feat(scope): add new feature
fix(scope): resolve bug
docs: update README
```

### Review Process

1. Automated checks must pass (tests, linting)
2. At least one approval required
3. Address review feedback
4. Squash commits before merge (if requested)

### After Merge

- Delete your feature branch
- Update your local repository:
  ```bash
  git checkout main
  git pull origin main
  ```

---

## Security

### Reporting Security Issues

**DO NOT** open public issues for security vulnerabilities.

Instead:
1. Email: security@vifi.ee
2. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if known)

### Response Time

- Critical: 24 hours
- High: 72 hours
- Medium: 1 week
- Low: 2 weeks

### Security Best Practices

1. **Never commit secrets**
   - Use environment variables
   - Check `.gitignore` includes `.env`
   - Use pre-commit hooks

2. **Validate user input**
   - Sanitize before storage
   - Escape before display
   - Use allowlists, not blocklists

3. **Keep dependencies updated**
   ```bash
   npm audit
   npm update
   ```

4. **Follow OWASP guidelines**
   - See `SECURITY.md` for details

---

## Code Review Guidelines

### As a Reviewer

- Be constructive and respectful
- Focus on code quality, not personal preferences
- Explain "why" when requesting changes
- Approve when ready, not perfect

### As an Author

- Respond to all comments
- Ask for clarification if needed
- Make requested changes or explain why not
- Keep PRs small and focused

---

## Additional Resources

- **[README.md](README.md)** - Project overview
- **[SECURITY.md](SECURITY.md)** - Security guidelines
- **[FEATURES.md](FEATURES.md)** - Feature documentation
- **[IMPROVEMENT_ROADMAP.md](IMPROVEMENT_ROADMAP.md)** - Technical roadmap
- **[API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)** - API reference

---

## Questions?

- Open a GitHub Issue for questions
- Join our discussion forum (if available)
- Contact maintainers directly

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

## Changelog

### Version 1.0 (January 14, 2026)
- Initial contributing guidelines
- Added code standards
- Added commit message conventions
- Added PR process
- Added security reporting

---

**Thank you for contributing to Vifi.ee!** 🎉

Your efforts help make this project better for everyone.
