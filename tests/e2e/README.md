# End-to-End (E2E) Tests

This directory contains end-to-end tests for the Vifi.ee application using Playwright.

## Setup

E2E tests are already set up with:
- Playwright Test framework
- Configuration in `playwright.config.js`
- Critical flow tests in `tests/e2e/critical-flows.spec.js`

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed
```

## Test Coverage

Currently implemented critical flows:
- ✅ Video browsing and search
- ✅ User authentication
- ✅ Video player navigation
- ✅ Responsive design (mobile/tablet)

## To Do

Additional critical flows to implement:
- [ ] Complete video playback flow (Browse → Select → Purchase → Watch)
- [ ] Full authentication flow (Register, Login, Logout, Password Recovery)
- [ ] Payment flows (Code, card, mobile payments)
- [ ] Device pairing flow

## Writing Tests

Tests follow Playwright's best practices:
- Use descriptive test names
- Group related tests in `test.describe()` blocks
- Use proper selectors (prefer data-testid, role-based selectors)
- Wait for elements properly (avoid hard timeouts)

Example:
```javascript
test('should display video player', async ({ page }) => {
  await page.goto('/');
  const player = page.locator('[data-testid="video-player"]');
  await expect(player).toBeVisible();
});
```

## CI/CD Integration

The tests are configured to run in CI environments with:
- Retries on failure (2 retries in CI)
- HTML report generation
- Single worker in CI for stability

## References

- [Playwright Documentation](https://playwright.dev)
- [IMPLEMENTATION_SUMMARY.md](../../IMPLEMENTATION_SUMMARY.md) for implementation details and E2E testing status
