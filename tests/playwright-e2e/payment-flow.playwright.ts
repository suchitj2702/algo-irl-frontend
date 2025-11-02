import { test, expect } from "@playwright/test";

test.describe("Razorpay Payment Flow E2E", () => {
  test("complete payment journey from landing to access", async ({ page }) => {
    // Mock authentication by setting localStorage
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "algoIRL.auth.user",
        JSON.stringify({ uid: "playwright-user", email: "e2e@example.com" }),
      );
    });

    // Navigate to the app
    await page.goto("/");

    // Click on unlock premium features
    await page.click("text=Unlock comprehensive plans");

    // Should navigate to study plan form
    await page.waitForURL("**/study-plan-form");

    // Click on full dataset option
    await page.click("text=Full Dataset");

    // Should show payment modal
    await expect(page.locator("text=/₹\\d+\\/month/")).toBeVisible();

    // Click proceed to payment
    await page.click("text=Proceed to Payment");

    // Simulate successful payment
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("payment-success", {
          detail: { paymentId: "pay_test_123" },
        }),
      );
    });

    // Verify premium access is granted
    await expect(page.locator("text=Full Dataset")).toBeVisible();
    await expect(page.locator("[data-premium-badge]")).toBeVisible();
  });

  test("handles payment failure and retry", async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "algoIRL.auth.user",
        JSON.stringify({ uid: "playwright-user", email: "e2e@example.com" }),
      );
    });

    // Mock API failure
    await page.route("**/api/billing/create-subscription", async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ error: "Payment failed" }),
      });
    });

    await page.goto("/study-plan-form");

    // Try to unlock full dataset
    await page.click("text=/Unlock full dataset/i");

    // Payment modal should appear
    await expect(page.locator("text=/₹\\d+\\/month/")).toBeVisible();

    // Click proceed to payment
    await page.click("text=Proceed to Payment");

    // Simulate payment failure
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("payment-failed", {
          detail: { error: "Card declined" },
        }),
      );
    });

    // Should show error message
    await expect(page.locator("text=Payment failed")).toBeVisible();

    // Retry button should be enabled
    await expect(page.getByRole("button", { name: "Proceed to Payment" })).toBeEnabled();
  });

  test("subscription upgrade flow", async ({ page }) => {
    // Mock authenticated user with expired subscription
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "algoIRL.auth.user",
        JSON.stringify({ uid: "test-user", email: "test@example.com" }),
      );
      window.localStorage.setItem(
        "algoIRL.subscription.status",
        JSON.stringify({ status: "past_due", hasActiveSubscription: false }),
      );
    });

    await page.goto("/my-study-plans");

    // Should show upgrade prompt for past due subscription
    await expect(page.locator("text=/subscription.*past due/i")).toBeVisible();

    // Click upgrade button
    await page.click("text=Renew Subscription");

    // Payment modal should appear with renewal context
    await expect(page.locator("text=Renew Your Subscription")).toBeVisible();

    // Proceed with payment
    await page.click("text=Proceed to Payment");

    // Simulate successful renewal
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("payment-success", {
          detail: { subscriptionId: "sub_renewed_123" },
        }),
      );
    });

    // Should show active subscription
    await expect(page.locator("text=/subscription.*active/i")).toBeVisible();
  });
});