import { test, expect } from "./fixtures";

test("should navigate to the home page and welcome component should be visible", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByTestId("welcome-component")).toBeInViewport();
});
