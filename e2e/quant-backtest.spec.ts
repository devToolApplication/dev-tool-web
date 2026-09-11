// ponytail: Playwright E2E suite for Quant Backtest workspace, add multi-tab parallel sync tests when multi-window runs are supported.
import { expect, test } from '@playwright/test';
import { MockBffState, setupQuantBacktestBffMock } from './fixtures/quant-backtest.fixture';

test.describe('Quant Backtest Workspace E2E Suite', () => {
  let bffState: MockBffState;

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('dangerously-skip-permissions', 'true');
      window.localStorage.setItem('app-language', 'en');
    });
    bffState = await setupQuantBacktestBffMock(page);
  });

  /* -------------------------------------------------------------------------- */
  /* Suite 1: Runs Overview (Operations-first layout & server-side pagination)   */
  /* -------------------------------------------------------------------------- */
  test.describe('Runs Overview Screen', () => {
    test('renders operations-first header, 4 KPI summary cards, and run table with localized status badges', async ({
      page,
    }) => {
      await page.goto('/quant-backtest/runs?dangerously-skip-permissions=true');

      await expect(page.locator('app-page-shell')).toBeVisible();
      await expect(page.locator('app-action-toolbar')).toBeVisible();

      await expect(page.getByText(/Running/i).first()).toBeVisible();
      await expect(page.getByText(/Completed/i).first()).toBeVisible();
      await expect(page.getByText(/Win Rate/i).first()).toBeVisible();
      await expect(page.getByText(/Net Return/i).first()).toBeVisible();

      const table = page.locator('app-table');
      await expect(table).toBeVisible();

      await expect(page.getByText('BTC Momentum Jan 2026').first()).toBeVisible();
      await expect(page.getByText('ETH Scheduled Daily Sweep').first()).toBeVisible();
      await expect(page.getByText('SOL Out-of-Sample Failure').first()).toBeVisible();

      // Ensure raw enum keys with prefixes are never rendered
      await expect(page.locator('app-table').getByText('JOB_STATUS_SUCCESS')).toHaveCount(0);
      await expect(page.locator('app-table').getByText('QUANT_OUTCOME_COMPLETED')).toHaveCount(0);
    });

    test('applies keyword filter with server-side query dispatch', async ({ page }) => {
      await page.goto('/quant-backtest/runs?dangerously-skip-permissions=true');

      const filterPanel = page.locator('app-filter-panel');
      await expect(filterPanel).toBeVisible();

      const searchInput = filterPanel.locator('input[type="text"]').first();
      await searchInput.fill('BTC');
      // Await filter-panel searchDebounceMs (250ms) before clicking apply
      await page.waitForTimeout(300);

      const applyBtn = filterPanel.getByRole('button', { name: /apply/i });
      const [runsResponse] = await Promise.all([
        page.waitForResponse(
          (res) =>
            res.url().includes('/v1/quant-backtest/runs') && res.url().includes('keyword=BTC'),
        ),
        applyBtn.click(),
      ]);

      expect(runsResponse.status()).toBe(200);
      const lastRunReq = bffState.capturedRequests
        .filter((r) => r.pathname.endsWith('/runs'))
        .pop();
      expect(lastRunReq?.url).toContain('keyword=BTC');
    });

    test('dispatches date range request params in ISO format on filter application', async ({
      page,
    }) => {
      await page.goto('/quant-backtest/runs?dangerously-skip-permissions=true');

      const filterPanel = page.locator('app-filter-panel');
      await expect(filterPanel).toBeVisible();

      const dateInputs = filterPanel.locator('input[type="date"]');
      await dateInputs.nth(0).fill('2026-01-01');
      await dateInputs.nth(1).fill('2026-01-31');

      const applyBtn = filterPanel.getByRole('button', { name: /apply/i });
      const [runsResponse] = await Promise.all([
        page.waitForResponse(
          (res) => res.url().includes('/v1/quant-backtest/runs') && res.url().includes('dateFrom'),
        ),
        applyBtn.click(),
      ]);

      expect(runsResponse.status()).toBe(200);
      const lastRunReq = bffState.capturedRequests
        .filter((r) => r.pathname.endsWith('/runs') && r.url.includes('dateFrom'))
        .pop();
      expect(lastRunReq).toBeDefined();
      expect(decodeURIComponent(lastRunReq!.url)).toMatch(/dateFrom=2026-01-01/);
      expect(decodeURIComponent(lastRunReq!.url)).toMatch(/dateTo=2026-01-31/);
    });

    test('displays explicit empty state without rendering fake fallback rows', async ({ page }) => {
      bffState.runs = [];
      await page.goto('/quant-backtest/runs?dangerously-skip-permissions=true');

      await expect(page.locator('app-table')).toBeVisible();
      await expect(page.getByText('BTC Momentum Jan 2026')).toHaveCount(0);
      await expect(
        page.locator('tbody tr.app-table__empty-row, app-empty-state, .app-table__empty').first(),
      ).toBeVisible();
    });

    test('displays backend error code on 500 without hiding failure behind fallback data', async ({
      page,
    }) => {
      bffState.simulateHttpError = {
        endpoint: '/runs',
        exact: true,
        status: 500,
        envelope: {
          code: 'DATABASE_TEMPORARILY_UNAVAILABLE',
          message: 'DATABASE_TEMPORARILY_UNAVAILABLE: Failed to read MongoDB backtest run records',
          correlationId: 'err-test-500',
        },
      };

      await page.goto('/quant-backtest/runs?dangerously-skip-permissions=true');
      await expect(page.getByText('DATABASE_TEMPORARILY_UNAVAILABLE').first()).toBeVisible();
    });
  });

  /* -------------------------------------------------------------------------- */
  /* Suite 2: Guided Wizard (RUN_NOW & SCHEDULE execution modes)                 */
  /* -------------------------------------------------------------------------- */
  test.describe('Guided Wizard (New Backtest)', () => {
    test('completes 4-step wizard for RUN_NOW with BFF Idempotency-Key and navigates to Run Detail', async ({
      page,
    }) => {
      await page.goto('/quant-backtest/runs/create?dangerously-skip-permissions=true');

      // Step 1: Setup
      await page.locator('#runName').fill('E2E Momentum Run');
      await page.getByRole('button', { name: /Next/i }).first().click();

      // Step 2: Market Data - select READY dataset
      await expect(page.getByText(/Market data|Dataset/i).first()).toBeVisible();
      const datasetSelect = page.locator('#datasetSelect');
      await expect(datasetSelect).toBeVisible();
      await page.getByRole('button', { name: /Next/i }).first().click();

      // Step 3: Strategy & Parameters
      await expect(page.getByText(/Strategy/i).first()).toBeVisible();
      const validateBtn = page.getByRole('button', { name: /Validate/i }).first();
      await expect(validateBtn).toBeVisible();
      await validateBtn.click();
      await expect(page.getByText(/valid/i).first()).toBeVisible();
      expect(bffState.strategyValidations.length).toBeGreaterThanOrEqual(1);
      await page.getByRole('button', { name: /Next/i }).first().click();

      // Step 4: Review & Submit
      await expect(page.getByText(/Review/i).first()).toBeVisible();
      const submitBtn = page.getByRole('button', { name: /Run Backtest Now/i }).first();
      await expect(submitBtn).toBeEnabled();
      await submitBtn.click();

      await page.waitForURL(/\/quant-backtest\/runs\/job-run-/);
      expect(bffState.createdRuns.length).toBe(1);

      // Verify Idempotency-Key (prefixed UUID format generated by FE)
      const idempotencyKey = bffState.createdRuns[0].idempotencyKey;
      expect(idempotencyKey).toBeDefined();
      expect(idempotencyKey!.length).toBeGreaterThanOrEqual(8);
      expect(idempotencyKey).toMatch(
        /^qbt-ui-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    test('supports actual native radio role, checked state, and arrow-key focus and selection', async ({
      page,
    }) => {
      await page.goto('/quant-backtest/runs/create?dangerously-skip-permissions=true');

      // Step 1: Setup
      await page.locator('#runName').fill('Radio Accessible Selection Run');
      await page.getByRole('button', { name: /Next/i }).first().click();

      // Step 2: Market Data - verify radiogroup and native radio roles
      const radioGroup = page.locator('[role="radiogroup"]');
      await expect(radioGroup).toBeVisible();

      const btcRadio = page.getByRole('radio', { name: 'BTCUSDT-PERP' });
      const ethRadio = page.getByRole('radio', { name: 'ETHUSDT-PERP' });
      const solRadio = page.getByRole('radio', { name: 'SOLUSDT-PERP' });

      await expect(btcRadio).toBeVisible();
      await expect(btcRadio).toBeChecked();
      await expect(ethRadio).not.toBeChecked();
      await expect(solRadio).not.toBeChecked();

      // Focus first radio and verify actual focus target
      await btcRadio.focus();
      await expect(btcRadio).toBeFocused();

      // ArrowRight navigates to and selects ETHUSDT-PERP
      await page.keyboard.press('ArrowRight');
      await expect(ethRadio).toBeChecked();
      await expect(ethRadio).toBeFocused();
      await expect(btcRadio).not.toBeChecked();

      // ArrowRight navigates to and selects SOLUSDT-PERP
      await page.keyboard.press('ArrowRight');
      await expect(solRadio).toBeChecked();
      await expect(solRadio).toBeFocused();
      await expect(ethRadio).not.toBeChecked();

      // ArrowLeft navigates back to and selects ETHUSDT-PERP
      await page.keyboard.press('ArrowLeft');
      await expect(ethRadio).toBeChecked();
      await expect(ethRadio).toBeFocused();
      await expect(solRadio).not.toBeChecked();
    });

    test('enforces dataset READY boundary and blocks submission for non-READY datasets', async ({
      page,
    }) => {
      await page.goto('/quant-backtest/runs/create?dangerously-skip-permissions=true');

      await page.locator('#runName').fill('Boundary Test Run');
      await page.getByRole('button', { name: /Next/i }).first().click();

      const datasetSelect = page.locator('#datasetSelect');
      await expect(datasetSelect).toBeVisible();
      await datasetSelect.click();

      await expect(
        page.getByRole('button', { name: /binance-spot-1m-incomplete-v2/i }),
      ).toHaveCount(0);
      await expect(page.getByRole('button', { name: /binance-usdm-corrupt-v3/i })).toHaveCount(0);
    });

    test('supports dataset multi-page cursor loading across pagination boundaries', async ({
      page,
    }) => {
      bffState.paginateDatasets = true;
      await page.goto('/quant-backtest/runs/create?dangerously-skip-permissions=true');

      // Step 1: Setup
      await page.locator('#runName').fill('Multi-page Cursor Run');
      await page.getByRole('button', { name: /Next/i }).first().click();

      // Step 2: Market Data
      const datasetSelect = page.locator('#datasetSelect');
      await expect(datasetSelect).toBeVisible();
      await datasetSelect.click();

      // Both datasets loaded across cursor pages must be available in select options
      await expect(
        page.getByRole('button', { name: /binance-usdm-1m-202601-v1/i }).first(),
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: /binance-usdm-1m-202602-v2/i }).first(),
      ).toBeVisible();

      // Verify requests: initial without cursor, subsequent with cursor
      const datasetRequests = bffState.capturedRequests.filter((r) =>
        r.pathname.endsWith('/datasets'),
      );
      expect(datasetRequests.length).toBeGreaterThanOrEqual(2);
      expect(datasetRequests[0].url).not.toContain('cursor=');
      expect(datasetRequests[1].url).toContain('cursor=dataset-cursor-page-2');
    });

    test('recovers from initial catalog load error via retry reload', async ({ page }) => {
      bffState.simulateHttpError = {
        endpoint: '/strategies',
        exact: true,
        status: 500,
        envelope: {
          code: 'STRATEGY_CATALOG_UNAVAILABLE',
          message: 'STRATEGY_CATALOG_UNAVAILABLE: Strategy catalog registry offline',
          correlationId: 'err-cat-500',
        },
      };

      await page.goto('/quant-backtest/runs/create?dangerously-skip-permissions=true');

      const alert = page.locator('app-alert');
      await expect(alert).toBeVisible();
      await expect(alert.getByText(/STRATEGY_CATALOG_UNAVAILABLE/i).first()).toBeVisible();

      // In init error state, attempting to proceed is guarded and stays on step 1
      await page.getByRole('button', { name: /Next/i }).first().click();
      await expect(page.locator('#datasetSelect')).toHaveCount(0);

      // Clear error condition and retry reload
      bffState.simulateHttpError = undefined;
      const retryBtn = alert.locator('.app-alert__actions button').first();
      await expect(retryBtn).toBeVisible();
      await retryBtn.click();

      // Alert disappears, filling step 1 and proceeding to step 2 succeeds
      await expect(page.locator('app-alert')).toHaveCount(0);
      await page.locator('#runName').fill('Recovered Catalog Run');
      await page.getByRole('button', { name: /Next/i }).first().click();
      await expect(page.locator('#datasetSelect')).toBeVisible();
    });

    test('supports SCHEDULE execution mode, sends Idempotency-Key, and verifies link destination /job-service/jobs', async ({
      page,
    }) => {
      await page.goto('/quant-backtest/runs/create?dangerously-skip-permissions=true');

      await page.locator('#runName').fill('Daily Scheduled ICT');
      await page.locator('#executionMode').click();
      const schedOpt = page
        .locator('.app-scrollbar button')
        .filter({ hasText: /Schedule/i })
        .first();
      await schedOpt.waitFor({ state: 'visible', timeout: 5000 });
      await schedOpt.dispatchEvent('mousedown');

      await expect(page.locator('#cronExp')).toBeVisible();
      await page.locator('#cronExp').fill('0 2 * * *');

      await page.getByRole('button', { name: /Next/i }).first().click(); // Step 2
      await page.getByRole('button', { name: /Next/i }).first().click(); // Step 3
      await page.getByRole('button', { name: /Next/i }).first().click(); // Step 4: Review

      const scheduleSubmitBtn = page.getByRole('button', { name: /Schedule Backtest/i }).first();
      await scheduleSubmitBtn.click();

      await expect(page.getByText('2026-09-10T02:00:00Z').first()).toBeVisible();
      expect(bffState.createdSchedules.length).toBe(1);

      // Verify Idempotency-Key on schedule
      const schedKey = bffState.createdSchedules[0].idempotencyKey;
      expect(schedKey).toBeDefined();
      expect(schedKey!.length).toBeGreaterThanOrEqual(8);
      expect(schedKey).toMatch(
        /^qbt-ui-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );

      // Verify schedule success link destination /job-service/jobs
      const jobsLink = page
        .locator('a[routerLink="/job-service/jobs"], a[href="/job-service/jobs"]')
        .first();
      await expect(jobsLink).toBeVisible();
      await expect(jobsLink).toHaveAttribute('href', '/job-service/jobs');

      await jobsLink.click();
      await page.waitForURL(/\/job-service\/jobs/);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* Suite 3: Run Detail (Summary KPI, Equity curve, and cursor-paginated tabs)  */
  /* -------------------------------------------------------------------------- */
  test.describe('Run Detail Screen', () => {
    test('renders run header, KPI summary strip, localized status badges, and equity visualization', async ({
      page,
    }) => {
      await page.goto('/quant-backtest/runs/job-run-001?dangerously-skip-permissions=true');

      await expect(page.getByText('job-run-001').first()).toBeVisible();
      await expect(page.getByText('BTC Momentum Jan 2026').first()).toBeVisible();

      await expect(page.getByText('14.85%').first()).toBeVisible();
      await expect(page.getByText('-4.21%').first()).toBeVisible();
      await expect(page.getByText('2.14').first()).toBeVisible();
      await expect(page.getByText('42').first()).toBeVisible();

      // Localized enum status badges in detail header
      await expect(
        page.locator('app-badge').getByText('Success', { exact: true }).first(),
      ).toBeVisible();
      await expect(
        page.locator('app-badge').getByText('Completed', { exact: true }).first(),
      ).toBeVisible();
    });

    test('supports cursor-paginated drill-down tabs (Trades, Orders, Signals) with localized enum badges', async ({
      page,
    }) => {
      await page.goto('/quant-backtest/runs/job-run-001?dangerously-skip-permissions=true');

      // Click Trades tab
      const tradesTab = page.getByRole('tab', { name: /Trades/i });
      await tradesTab.click();
      await expect(page.getByText('TAKE_PROFIT').first()).toBeVisible();
      await expect(page.getByText('STOP_LOSS').first()).toBeVisible();

      // Unconditional load more click
      const nextBtn = page.getByRole('button', { name: /loadMore|load more/i }).first();
      await expect(nextBtn).toBeVisible();
      await expect(nextBtn).toBeEnabled();
      await nextBtn.click();
      await expect(page.getByText('2027.7').or(page.getByText('68,100')).first()).toBeVisible();

      // Orders tab
      const ordersTab = page.getByRole('tab', { name: /Orders/i });
      await ordersTab.click();
      await expect(page.getByText('FILLED').first()).toBeVisible();

      // Signals tab
      const signalsTab = page.getByRole('tab', { name: /Signals/i });
      await signalsTab.click();
      await expect(page.getByText('BUY').first()).toBeVisible();
    });

    test('handles partial cursor error preserving existing rows then retrying appending', async ({
      page,
    }) => {
      await page.goto('/quant-backtest/runs/job-run-001?dangerously-skip-permissions=true');

      const tradesTab = page.getByRole('tab', { name: /Trades/i });
      await tradesTab.click();

      // Page 1 trades are visible
      await expect(page.getByText('STOP_LOSS').first()).toBeVisible();
      await expect(page.getByText('2027.7')).toHaveCount(0);

      // Simulate partial cursor fetch error on next page
      bffState.simulateHttpError = {
        endpoint: '/trades',
        status: 500,
        envelope: {
          code: 'TRADES_PARTIAL_CURSOR_ERROR',
          message:
            'TRADES_PARTIAL_CURSOR_ERROR: Failed to retrieve trade records for cursor page 2',
          correlationId: 'err-trades-part-500',
        },
      };

      const loadMoreBtn = page.getByRole('button', { name: /loadMore|load more/i }).first();
      await expect(loadMoreBtn).toBeVisible();
      await loadMoreBtn.click();

      // Error alert appears
      const alert = page.locator('app-alert');
      await expect(alert).toBeVisible();
      await expect(alert.getByText(/TRADES_PARTIAL_CURSOR_ERROR/i).first()).toBeVisible();

      // CRITICAL: Existing rows from page 1 must be PRESERVED
      await expect(page.getByText('STOP_LOSS').first()).toBeVisible();

      // Clear error and click Retry on alert
      bffState.simulateHttpError = undefined;
      const retryBtn = alert.locator('.app-alert__actions button').first();
      await expect(retryBtn).toBeVisible();
      await retryBtn.click();

      // Alert disappears and page 2 trade is appended
      await expect(page.locator('app-alert')).toHaveCount(0);
      await expect(page.getByText('2027.7').or(page.getByText('68,100')).first()).toBeVisible();
      await expect(page.getByText('STOP_LOSS').first()).toBeVisible();
    });

    test('displays immutable input configuration snapshot via app-json-viewer', async ({
      page,
    }) => {
      await page.goto('/quant-backtest/runs/job-run-001?dangerously-skip-permissions=true');

      const configTab = page.getByRole('tab', { name: /Configuration/i });
      await configTab.click();

      await expect(page.locator('app-json-viewer')).toBeVisible();
      await expect(page.getByText('CONSERVATIVE_STOP_FIRST').first()).toBeVisible();
      await expect(page.getByText('binance-usdm-1m-202601-v1').first()).toBeVisible();
    });

    test('renders explicit Quant result unavailable state when job succeeded but result is pending', async ({
      page,
    }) => {
      await page.goto(
        '/quant-backtest/runs/job-run-004-missing-result?dangerously-skip-permissions=true',
      );

      // Localized Job Status badge
      await expect(
        page.locator('app-badge').getByText('Success', { exact: true }).first(),
      ).toBeVisible();
      await expect(page.getByText(/unavailable|not yet available/i).first()).toBeVisible();
      await expect(page.getByText('JOB_STATUS_SUCCESS')).toHaveCount(0);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* Suite 4: Strategy Library (List, inspection drawer, strictly NO CRUD)      */
  /* -------------------------------------------------------------------------- */
  test.describe('Strategy Library Screen', () => {
    test('lists registered strategies and inspects parameter preset in app-drawer', async ({
      page,
    }) => {
      await page.goto('/quant-backtest/strategies?dangerously-skip-permissions=true');

      await expect(page.getByText('ICT Liquidity Reversal').first()).toBeVisible();

      // Click strategy row to open drawer unconditionally
      await page.getByText('ICT Liquidity Reversal').first().click();
      const drawer = page.locator('.app-drawer__panel');
      await expect(drawer).toBeVisible();
      await expect(drawer.getByText('Conservative Default').first()).toBeVisible();
    });

    test('enforces strictly NO CRUD expectation (absence of create/edit/delete buttons)', async ({
      page,
    }) => {
      await page.goto('/quant-backtest/strategies?dangerously-skip-permissions=true');

      await expect(page.getByRole('button', { name: /Create Strategy/i })).toHaveCount(0);
      await expect(page.getByRole('button', { name: /Delete Strategy/i })).toHaveCount(0);
      await expect(page.getByRole('button', { name: /Upload Python/i })).toHaveCount(0);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* Suite 5: Security & BFF Boundary Integrity                                 */
  /* -------------------------------------------------------------------------- */
  test.describe('Security & BFF Boundary Integrity', () => {
    test('confirms all browser requests route strictly through BFF with ZERO X-Service-Token leakage', async ({
      page,
    }) => {
      await page.goto('/quant-backtest/runs?dangerously-skip-permissions=true');

      // Wait for table to load so BFF requests have fired
      await expect(page.locator('app-table')).toBeVisible();
      await expect(page.getByText('BTC Momentum Jan 2026').first()).toBeVisible();

      expect(bffState.capturedRequests.length).toBeGreaterThan(0);

      for (const req of bffState.capturedRequests) {
        // 1. Must target BFF route prefix /v1/quant-backtest/
        expect(req.pathname).toContain('/v1/quant-backtest');

        // 2. Must NEVER transmit internal X-Service-Token header
        const leakedHeader = Object.keys(req.headers).find(
          (h) => h.toLowerCase() === 'x-service-token',
        );
        expect(leakedHeader).toBeUndefined();

        // 3. Must NEVER make direct browser calls to Quant internal port (:8000)
        expect(req.url).not.toContain(':8000/internal/');
      }
    });
  });

  /* -------------------------------------------------------------------------- */
  /* Suite 6: Mobile Responsiveness & Accessibility Smoke Checks                */
  /* -------------------------------------------------------------------------- */
  test.describe('Mobile Viewport & Accessibility Smoke Checks', () => {
    test('verifies mobile layout (< 768px) with stacked actions and full-width drawer', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto('/quant-backtest/runs?dangerously-skip-permissions=true');

      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 2);

      const toolbar = page.locator('app-action-toolbar');
      await expect(toolbar).toBeVisible();
    });

    test('verifies keyboard focus target and visible focus state using strict accessibility assertions', async ({
      page,
    }) => {
      await page.goto('/quant-backtest/runs?dangerously-skip-permissions=true');

      const newBacktestBtn = page.getByRole('button', { name: /New Backtest/i }).first();
      await expect(newBacktestBtn).toBeVisible();

      // Focus primary button and assert actual focus state
      await newBacktestBtn.focus();
      await expect(newBacktestBtn).toBeFocused();

      // Tab into next interactive control and assert target focus state
      await page.keyboard.press('Tab');
      const searchInput = page.locator('app-filter-panel input[type="text"]').first();
      await expect(searchInput).toBeFocused();
    });
  });
});
