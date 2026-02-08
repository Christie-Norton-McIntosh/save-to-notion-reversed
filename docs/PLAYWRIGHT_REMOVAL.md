# Playwright E2E harness removed

What changed
- Playwright end-to-end tests and associated dev dependency were removed from this repository.
- Removed files: `Web-2-Notion/test/e2e/*` and the Playwright entry in the JS toolchain.
- The `Web-2-Notion/package-lock.json` was removed so the lockfile can be regenerated without Playwright.

Why
- The Playwright-based MCP/E2E harness depended on local browser profiles and produced large binary artifacts. The test harness is being archived to simplify the repository and avoid shipping local browser artifacts.

If you need the E2E harness back
- Restore from a branch or an earlier commit that contains `Web-2-Notion/test/e2e/` and add `playwright` back to `package.json`, then run `npm install`.

Notes for maintainers
- After merging, run `npm install` in `Web-2-Notion/` to regenerate `package-lock.json` without Playwright.
- CI that relied on the Playwright tests should be updated to remove those jobs.
