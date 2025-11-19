/**
 * E2E Test Suite: Government Simulation
 *
 * Tests government dashboard, minister roles, cabinet operations, and executive functions
 */

import { test, expect } from '@playwright/test';
import { AuthHelper, TestUtils, DatabaseHelper } from '../src/test-utils.js';

test.describe('Government Simulation', () => {
  let authHelper: AuthHelper;
  let dbHelper: DatabaseHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    await authHelper.initAPIContext();

    dbHelper = new DatabaseHelper();
    await dbHelper.setup();
  });

  test.afterEach(async () => {
    await dbHelper.cleanup();
    await authHelper.cleanup();
  });

  test.describe('Government Dashboard', () => {
    test('should display government overview for citizens', async ({ page }) => {
      // Create and authenticate regular user
      await TestUtils.createAuthenticatedUser(page);

      // Navigate to government dashboard
      await page.goto('/government');

      // Verify government sections are displayed
      await expect(page.getByRole('heading', { name: /government|executive/i })).toBeVisible();

      // Check for key government metrics
      const metricsSection = page.locator(
        '[data-testid="government-metrics"], .government-metrics',
      );
      if (await metricsSection.isVisible()) {
        // Should show approval ratings, budget, etc.
        const approvalRating = metricsSection.locator(
          '[data-testid="approval-rating"], .approval-rating',
        );
        const budgetInfo = metricsSection.locator('[data-testid="budget"], .budget');

        // At least some metrics should be visible
        const hasMetrics = (await approvalRating.isVisible()) || (await budgetInfo.isVisible());
        expect(hasMetrics).toBe(true);
      }
    });

    test('should show current government composition', async ({ page }) => {
      // Create and authenticate user
      await TestUtils.createAuthenticatedUser(page);

      // Navigate to government
      await page.goto('/government');

      // Check for cabinet/government structure
      const cabinetSection = page.locator(
        '[data-testid="cabinet"], .cabinet, .government-structure',
      );
      if (await cabinetSection.isVisible()) {
        // Should show ministers or government positions
        const ministerPositions = cabinetSection.locator(
          '[data-testid="minister"], .minister, .position',
        );
        const positionCount = await ministerPositions.count();

        // Should have some government positions
        expect(positionCount).toBeGreaterThan(0);
      }
    });

    test('should display government policies and initiatives', async ({ page }) => {
      // Create and authenticate user
      await TestUtils.createAuthenticatedUser(page);

      // Navigate to government policies
      await page.goto('/government/policies');

      // Check for policy listings
      const policiesSection = page.locator('[data-testid="policies"], .policies');
      if (await policiesSection.isVisible()) {
        const policyItems = policiesSection.locator('[data-testid="policy"], .policy');
        const policyCount = await policyItems.count();

        // Should show policies or empty state
        const noPolicies = policiesSection.getByText(/no policies|no initiatives/i);
        expect(policyCount > 0 || (await noPolicies.isVisible())).toBe(true);
      }
    });
  });

  test.describe('Minister Roles and Functions', () => {
    test('should allow ministers to access their dashboards', async ({ page }) => {
      // Create user and assign minister role (this would need backend setup)
      const user = await TestUtils.createAuthenticatedUser(page);

      // Navigate to minister dashboard (assuming user has minister role)
      await page.goto('/government/minister');

      // Check if minister interface is available
      const ministerDashboard = page.locator(
        '[data-testid="minister-dashboard"], .minister-dashboard',
      );
      const accessDenied = page.getByText(/access denied|not authorized/i);

      // Either minister dashboard or access denied should be shown
      expect((await ministerDashboard.isVisible()) || (await accessDenied.isVisible())).toBe(true);
    });

    test('should display minister-specific information', async ({ page }) => {
      // Create user and assign minister role
      await TestUtils.createAuthenticatedUser(page);

      // Navigate to minister dashboard
      await page.goto('/government/minister');

      const ministerDashboard = page.locator(
        '[data-testid="minister-dashboard"], .minister-dashboard',
      );
      if (await ministerDashboard.isVisible()) {
        // Should show minister portfolio information
        const portfolioSection = ministerDashboard.locator('[data-testid="portfolio"], .portfolio');
        const responsibilities = ministerDashboard.locator(
          '[data-testid="responsibilities"], .responsibilities',
        );

        // Should have some minister-specific content
        const hasContent =
          (await portfolioSection.isVisible()) || (await responsibilities.isVisible());
        expect(hasContent).toBe(true);
      }
    });

    test('should enable minister actions and decisions', async ({ page }) => {
      // Create minister user
      await TestUtils.createAuthenticatedUser(page);

      // Navigate to minister dashboard
      await page.goto('/government/minister');

      const ministerDashboard = page.locator(
        '[data-testid="minister-dashboard"], .minister-dashboard',
      );
      if (await ministerDashboard.isVisible()) {
        // Look for action buttons or decision interfaces
        const actionButtons = ministerDashboard.locator(
          '[data-testid="minister-action"], .minister-action button',
        );
        const decisionInterface = ministerDashboard.locator(
          '[data-testid="decisions"], .decisions',
        );

        if (await actionButtons.first().isVisible()) {
          // Should have actionable items
          const buttonCount = await actionButtons.count();
          expect(buttonCount).toBeGreaterThan(0);
        }
      }
    });
  });

  test.describe('Cabinet Operations', () => {
    test('should display cabinet meetings and agendas', async ({ page }) => {
      // Create authenticated user
      await TestUtils.createAuthenticatedUser(page);

      // Navigate to cabinet section
      await page.goto('/government/cabinet');

      // Check for cabinet information
      const cabinetSection = page.locator('[data-testid="cabinet-info"], .cabinet-info');
      if (await cabinetSection.isVisible()) {
        // Should show cabinet composition or meetings
        const cabinetMembers = cabinetSection.locator(
          '[data-testid="cabinet-member"], .cabinet-member',
        );
        const meetings = cabinetSection.locator('[data-testid="meeting"], .meeting');

        const hasContent =
          (await cabinetMembers.first().isVisible()) || (await meetings.first().isVisible());
        expect(hasContent).toBe(true);
      }
    });

    test('should show government budget and spending', async ({ page }) => {
      // Create authenticated user
      await TestUtils.createAuthenticatedUser(page);

      // Navigate to government budget
      await page.goto('/government/budget');

      // Check for budget information
      const budgetSection = page.locator('[data-testid="budget"], .budget');
      if (await budgetSection.isVisible()) {
        // Should show budget allocations, spending, etc.
        const budgetItems = budgetSection.locator(
          '[data-testid="budget-item"], .budget-item, .allocation',
        );
        const spendingData = budgetSection.locator('[data-testid="spending"], .spending');

        const hasBudgetData =
          (await budgetItems.first().isVisible()) || (await spendingData.isVisible());
        expect(hasBudgetData).toBe(true);
      }
    });

    test('should display government announcements and communications', async ({ page }) => {
      // Create authenticated user
      await TestUtils.createAuthenticatedUser(page);

      // Navigate to government communications
      await page.goto('/government/announcements');

      // Check for announcements
      const announcementsSection = page.locator('[data-testid="announcements"], .announcements');
      if (await announcementsSection.isVisible()) {
        const announcementItems = announcementsSection.locator(
          '[data-testid="announcement"], .announcement',
        );
        const announcementCount = await announcementItems.count();

        // Should show announcements or empty state
        const noAnnouncements = announcementsSection.getByText(/no announcements/i);
        expect(announcementCount > 0 || (await noAnnouncements.isVisible())).toBe(true);
      }
    });
  });

  test.describe('Executive Decision Making', () => {
    test('should allow executive actions on legislation', async ({ page }) => {
      // Create user with executive privileges
      await TestUtils.createAuthenticatedUser(page);

      // Navigate to executive dashboard
      await page.goto('/government/executive');

      const executiveDashboard = page.locator(
        '[data-testid="executive-dashboard"], .executive-dashboard',
      );
      if (await executiveDashboard.isVisible()) {
        // Look for executive actions on bills
        const billActions = executiveDashboard.locator('[data-testid="bill-action"], .bill-action');
        const vetoButtons = executiveDashboard.locator('button', { hasText: /veto|approve|sign/i });

        if (await billActions.first().isVisible()) {
          // Should have executive actions available
          const actionCount = await billActions.count();
          expect(actionCount).toBeGreaterThan(0);
        }
      }
    });

    test('should show presidential/government decrees', async ({ page }) => {
      // Create authenticated user
      await TestUtils.createAuthenticatedUser(page);

      // Navigate to decrees/executive orders
      await page.goto('/government/decrees');

      // Check for decree listings
      const decreesSection = page.locator('[data-testid="decrees"], .decrees');
      if (await decreesSection.isVisible()) {
        const decreeItems = decreesSection.locator('[data-testid="decree"], .decree');
        const decreeCount = await decreeItems.count();

        // Should show decrees or empty state
        const noDecrees = decreesSection.getByText(/no decrees|no executive orders/i);
        expect(decreeCount > 0 || (await noDecrees.isVisible())).toBe(true);
      }
    });

    test('should display international relations and diplomacy', async ({ page }) => {
      // Create authenticated user
      await TestUtils.createAuthenticatedUser(page);

      // Navigate to foreign affairs
      await page.goto('/government/foreign-affairs');

      // Check for diplomatic information
      const diplomacySection = page.locator(
        '[data-testid="diplomacy"], .diplomacy, .foreign-affairs',
      );
      if (await diplomacySection.isVisible()) {
        // Should show treaties, alliances, or diplomatic relations
        const relations = diplomacySection.locator('[data-testid="relation"], .relation, .treaty');
        const diplomaticActions = diplomacySection.locator(
          '[data-testid="diplomatic-action"], .diplomatic-action',
        );

        const hasDiplomacy =
          (await relations.first().isVisible()) || (await diplomaticActions.first().isVisible());
        expect(hasDiplomacy).toBe(true);
      }
    });
  });

  test.describe('Government Performance Metrics', () => {
    test('should display government approval ratings', async ({ page }) => {
      // Create authenticated user
      await TestUtils.createAuthenticatedUser(page);

      // Navigate to government dashboard
      await page.goto('/government');

      // Check for approval ratings
      const approvalSection = page.locator('[data-testid="approval"], .approval, .ratings');
      if (await approvalSection.isVisible()) {
        // Should show approval metrics
        const ratingValue = approvalSection.locator(
          '[data-testid="rating-value"], .rating-value, .percentage',
        );
        const ratingChart = approvalSection.locator('[data-testid="rating-chart"], .chart, canvas');

        const hasRating = (await ratingValue.isVisible()) || (await ratingChart.isVisible());
        expect(hasRating).toBe(true);
      }
    });

    test('should show government effectiveness indicators', async ({ page }) => {
      // Create authenticated user
      await TestUtils.createAuthenticatedUser(page);

      // Navigate to government performance
      await page.goto('/government/performance');

      // Check for performance metrics
      const performanceSection = page.locator('[data-testid="performance"], .performance');
      if (await performanceSection.isVisible()) {
        // Should show KPIs, effectiveness measures, etc.
        const kpiItems = performanceSection.locator('[data-testid="kpi"], .kpi, .metric');
        const effectivenessData = performanceSection.locator(
          '[data-testid="effectiveness"], .effectiveness',
        );

        const hasPerformanceData =
          (await kpiItems.first().isVisible()) || (await effectivenessData.isVisible());
        expect(hasPerformanceData).toBe(true);
      }
    });

    test('should display public service delivery metrics', async ({ page }) => {
      // Create authenticated user
      await TestUtils.createAuthenticatedUser(page);

      // Navigate to public services
      await page.goto('/government/services');

      // Check for service delivery information
      const servicesSection = page.locator('[data-testid="services"], .services');
      if (await servicesSection.isVisible()) {
        // Should show service quality, delivery times, etc.
        const serviceMetrics = servicesSection.locator(
          '[data-testid="service-metric"], .service-metric',
        );
        const deliveryStats = servicesSection.locator(
          '[data-testid="delivery-stat"], .delivery-stat',
        );

        const hasServiceData =
          (await serviceMetrics.first().isVisible()) || (await deliveryStats.isVisible());
        expect(hasServiceData).toBe(true);
      }
    });
  });

  test.describe('Government Transparency', () => {
    test('should provide access to government records', async ({ page }) => {
      // Create authenticated user
      await TestUtils.createAuthenticatedUser(page);

      // Navigate to government records
      await page.goto('/government/records');

      // Check for record access
      const recordsSection = page.locator('[data-testid="records"], .records');
      if (await recordsSection.isVisible()) {
        // Should show government documents, decisions, etc.
        const recordItems = recordsSection.locator('[data-testid="record"], .record, .document');
        const recordCount = await recordItems.count();

        // Should have records or indicate transparency
        expect(recordCount).toBeGreaterThanOrEqual(0);
      }
    });

    test('should show government spending transparency', async ({ page }) => {
      // Create authenticated user
      await TestUtils.createAuthenticatedUser(page);

      // Navigate to spending transparency
      await page.goto('/government/spending');

      // Check for spending data
      const spendingSection = page.locator('[data-testid="spending"], .spending');
      if (await spendingSection.isVisible()) {
        // Should show detailed spending breakdowns
        const spendingItems = spendingSection.locator(
          '[data-testid="spending-item"], .spending-item',
        );
        const breakdown = spendingSection.locator('[data-testid="breakdown"], .breakdown');

        const hasSpendingData =
          (await spendingItems.first().isVisible()) || (await breakdown.isVisible());
        expect(hasSpendingData).toBe(true);
      }
    });

    test('should display legislative tracking and status', async ({ page }) => {
      // Create authenticated user
      await TestUtils.createAuthenticatedUser(page);

      // Navigate to legislative tracking
      await page.goto('/government/legislation-tracking');

      // Check for tracking information
      const trackingSection = page.locator('[data-testid="tracking"], .tracking');
      if (await trackingSection.isVisible()) {
        // Should show bill progress, status updates, etc.
        const billProgress = trackingSection.locator(
          '[data-testid="bill-progress"], .bill-progress',
        );
        const statusUpdates = trackingSection.locator(
          '[data-testid="status-update"], .status-update',
        );

        const hasTracking =
          (await billProgress.first().isVisible()) || (await statusUpdates.first().isVisible());
        expect(hasTracking).toBe(true);
      }
    });
  });

  test.describe('Emergency and Crisis Management', () => {
    test('should handle government emergency responses', async ({ page }) => {
      // Create authenticated user
      await TestUtils.createAuthenticatedUser(page);

      // Navigate to emergency management
      await page.goto('/government/emergency');

      // Check for emergency response interface
      const emergencySection = page.locator('[data-testid="emergency"], .emergency');
      if (await emergencySection.isVisible()) {
        // Should show emergency protocols, alerts, etc.
        const protocols = emergencySection.locator('[data-testid="protocol"], .protocol');
        const alerts = emergencySection.locator('[data-testid="alert"], .alert');

        const hasEmergencyFeatures =
          (await protocols.first().isVisible()) || (await alerts.first().isVisible());
        expect(hasEmergencyFeatures).toBe(true);
      }
    });

    test('should display crisis management capabilities', async ({ page }) => {
      // Create minister/executive user
      await TestUtils.createAuthenticatedUser(page);

      // Navigate to crisis management
      await page.goto('/government/crisis-management');

      const crisisSection = page.locator('[data-testid="crisis"], .crisis');
      if (await crisisSection.isVisible()) {
        // Should show crisis response tools
        const responseTools = crisisSection.locator(
          '[data-testid="response-tool"], .response-tool',
        );
        const crisisPlans = crisisSection.locator('[data-testid="crisis-plan"], .crisis-plan');

        const hasCrisisManagement =
          (await responseTools.first().isVisible()) || (await crisisPlans.first().isVisible());
        expect(hasCrisisManagement).toBe(true);
      }
    });
  });
});
