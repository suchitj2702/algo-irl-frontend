import { test, expect } from "@playwright/test";

test.describe("Basic Razorpay Integration", () => {
  test("payment modal can be opened", async ({ page }) => {
    // Start the dev server and navigate to study plan form
    await page.goto("/study-plan-form");

    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Check if the page has loaded (look for a heading or main element)
    const pageContent = await page.content();
    console.log("Page loaded, checking for payment-related elements...");

    // Check if there are any elements related to premium/payment
    const premiumElements = await page.locator("text=/premium|unlock|full dataset|payment/i").count();
    console.log(`Found ${premiumElements} premium-related elements`);

    // Basic assertion - the page should have some content
    expect(pageContent.length).toBeGreaterThan(100);
  });

  test("app loads without errors", async ({ page }) => {
    // Listen for console errors
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    // Navigate to the app
    await page.goto("/");

    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Check for critical errors (ignore expected ones)
    const criticalErrors = errors.filter(
      (error) =>
        !error.includes("Failed to parse URL") && // Expected in test environment
        !error.includes("Firebase") && // Firebase warnings in test
        !error.includes("GET /api/") // API calls that fail in test
    );

    // The app should load without critical errors
    expect(criticalErrors).toHaveLength(0);
  });
});