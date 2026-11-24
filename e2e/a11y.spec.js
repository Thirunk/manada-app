import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Automated checks only. Passing these does not certify WCAG 2.2 AA
// conformance; manual keyboard and screen-reader testing is still required.
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const BLOCKING_IMPACTS = ["serious", "critical"];

const ROUTES = [
  "/",
  "/products",
  "/products/unik-gold",
  "/brands",
  "/services/repair-maintenance",
  "/faq",
  "/login",
  "/register",
  "/services",
  "/training",
  "/about",
  "/contact",
  "/privacy-policy",
  "/terms",
  "/no-such-page",
];

function summarize(violations) {
  return violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    nodes: violation.nodes.map((node) => node.target.join(" ")),
  }));
}

async function scan(page) {
  return new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
}

test.describe("automated accessibility checks @a11y", () => {
  for (const route of ROUTES) {
    test(`${route} has no serious or critical axe violations @a11y`, async ({
      page,
    }) => {
      await page.goto(route);
      await page.getByRole("heading", { level: 1 }).first().waitFor();

      const results = await scan(page);
      const blocking = results.violations.filter((violation) =>
        BLOCKING_IMPACTS.includes(violation.impact),
      );
      expect(summarize(blocking)).toEqual([]);
    });
  }

  test("mobile menu dialog has no serious or critical axe violations @a11y", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: "Open main menu" }).click();
    await expect(
      page.getByRole("navigation", { name: "Mobile" }),
    ).toBeVisible();

    const results = await scan(page);
    const blocking = results.violations.filter((violation) =>
      BLOCKING_IMPACTS.includes(violation.impact),
    );
    expect(summarize(blocking)).toEqual([]);
  });
});
