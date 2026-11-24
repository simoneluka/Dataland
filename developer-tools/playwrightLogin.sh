#!/usr/bin/env bash
set +x
set -euo pipefail
umask 077

if [[ -z ${KEYCLOAK_READER_PASSWORD:-} ]]; then
  >&2 printf '%s\n' 'Set KEYCLOAK_READER_PASSWORD in your environment first.'
  exit 1
fi

# Reuse the same locally cached Playwright version as opencode.jsonc.
playwright_cli=$(env -u KEYCLOAK_READER_PASSWORD npm exec --offline --yes --package=@playwright/mcp@0.0.86 -- sh -c 'command -v playwright')
unset DEBUG PWDEBUG

node - "$playwright_cli" <<'JS'
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require(path.dirname(require('node:fs').realpathSync(process.argv[2])));

const origin = 'https://local-dev.dataland.com';
const directory = path.join(process.env.HOME, '.cache', 'dataland-playwright');
const state = path.join(directory, 'reader.json');

async function main() {
  await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  const info = await fs.lstat(directory);
  if (!info.isDirectory() || info.uid !== process.getuid() || (info.mode & 0o077) !== 0) {
    throw new Error('Session directory must be private and owned by the current user.');
  }

  const { KEYCLOAK_READER_PASSWORD: password, ...browserEnvironment } = process.env;
  let phase = 'launching Chromium';
  let temporary;
  const browser = await chromium.launch({ channel: 'chrome', env: browserEnvironment });
  try {
    phase = 'opening the local login';
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await context.newPage();
    await page.goto(`${origin}/companies`, { waitUntil: 'domcontentloaded' });
    const login = page.locator('#kc-login');
    const loginLink = page.locator('[data-test="login-dataland-button"]');
    await login.or(loginLink).first().waitFor();
    if (await loginLink.isVisible()) await loginLink.click();
    await login.waitFor();
    const loginUrl = new URL(page.url());
    if (loginUrl.origin !== origin || !loginUrl.pathname.startsWith('/keycloak/realms/datalandsecurity/')) {
      throw new Error('Unexpected Keycloak login location.');
    }

    phase = 'signing in as data_reader';
    await page.locator('#username').fill('data_reader');
    await page.locator('#password').fill(password);
    await login.click();
    await page.waitForURL(url => url.origin === origin && !url.pathname.startsWith('/keycloak/'));
    await page.waitForFunction(() => localStorage.getItem('dataland_authenticated') === 'true');

    phase = 'restoring the session in a fresh browser context';
    const storageState = await context.storageState();
    for (const entry of storageState.origins) {
      entry.localStorage = entry.localStorage.filter(({ name }) => name !== 'dataland_authenticated');
    }
    const restored = await browser.newContext({ ignoreHTTPSErrors: true, storageState });
    const restoredPage = await restored.newPage();
    await restoredPage.goto(`${origin}/companies`, { waitUntil: 'domcontentloaded' });
    await restoredPage.waitForFunction(() => localStorage.getItem('dataland_authenticated') === 'true');

    phase = 'saving the private session';
    temporary = await fs.mkdtemp(path.join(directory, 'session-'));
    const file = path.join(temporary, 'reader.json');
    await fs.writeFile(file, JSON.stringify(storageState), { mode: 0o600, flag: 'wx' });
    await fs.rename(file, state);
    console.log('Local Playwright reader session saved and verified.');
  } catch {
    console.error(`Could not prepare the local Playwright session while ${phase}.`);
    process.exitCode = 1;
  } finally {
    if (temporary) await fs.rm(temporary, { recursive: true, force: true });
    await browser.close();
  }
}

main().catch(() => {
  console.error('Local Playwright session setup failed. Check the local stack, reader login and cached Chromium.');
  process.exitCode = 1;
});
JS
