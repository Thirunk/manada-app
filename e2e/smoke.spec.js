import { expect, test } from "@playwright/test";

const PUBLIC_ROUTES = [
  "/",
  "/products",
  "/products/unik-gold",
  "/brands",
  "/services",
  "/services/repair-maintenance",
  "/faq",
  "/login",
  "/register",
  "/training",
  "/about",
  "/contact",
  "/privacy-policy",
  "/terms",
];

function collectErrors(page) {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

function collectExternalRequests(page, baseURL) {
  const { hostname } = new URL(baseURL);
  const external = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.protocol.startsWith("http") && url.hostname !== hostname) {
      external.push(request.url());
    }
  });
  return external;
}

test.describe("homepage", () => {
  test("loads with business branding and no application errors", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.goto("/");

    await expect(page).toHaveTitle("Manada Embroidery Machine Solution");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Manada Embroidery Machine Solution",
      }),
    ).toBeAttached();
    await expect(
      page
        .getByRole("banner")
        .getByRole("link", { name: "Manada Embroidery Machine Solution" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Reach us for Sales\/Services/ }),
    ).toHaveAttribute("href", "tel:+919608134164");

    expect(errors).toEqual([]);
  });

  test("loads no third-party resources", async ({ page, baseURL }) => {
    const external = collectExternalRequests(page, baseURL);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    expect(external).toEqual([]);
  });

  test("renders every image with a non-zero natural size (no broken assets)", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Scroll through the page so lazy-loaded banners request their files.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 60));
      }
    });
    await page.waitForLoadState("networkidle");

    await page.waitForFunction(
      () => Array.from(document.images).every((img) => img.complete),
      null,
      { timeout: 15000 },
    );
    const images = page.locator("img");
    const count = await images.count();
    expect(count).toBeGreaterThan(0);
    const brokenImages = await images.evaluateAll((elements) =>
      elements
        .filter((img) => !img.complete || img.naturalWidth === 0)
        .map((img) => img.getAttribute("src")),
    );
    expect(brokenImages).toEqual([]);
  });
});

test.describe("desktop navigation", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("primary links route to the destination page", async ({ page }) => {
    await page.goto("/");
    const primary = page.getByRole("navigation", { name: "Primary" });

    await primary.getByRole("link", { name: "Services" }).click();
    await expect(page).toHaveURL(/\/services$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Services" }),
    ).toBeVisible();
    await expect(
      primary.getByRole("link", { name: "Services" }),
    ).toHaveAttribute("aria-current", "page");
  });

  test("logo navigates back to the homepage", async ({ page }) => {
    await page.goto("/about");
    await page
      .getByRole("banner")
      .getByRole("link", { name: "Manada Embroidery Machine Solution" })
      .click();
    await expect(page).toHaveURL(/\/$/);
  });
});

test.describe("mobile navigation", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("menu opens, navigates, and closes", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open main menu" }).click();

    // Headless UI gives role="dialog" to a zero-size wrapper, so assert on the
    // visible navigation inside the panel instead.
    const mobileNav = page.getByRole("navigation", { name: "Mobile" });
    await expect(mobileNav).toBeVisible();
    await mobileNav.getByRole("link", { name: "Training" }).click();

    await expect(page).toHaveURL(/\/training$/);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(
      page.getByRole("heading", { level: 1, name: "Training" }),
    ).toBeVisible();
  });

  test("Escape closes the menu and returns focus to its button", async ({
    page,
  }) => {
    await page.goto("/");
    const openButton = page.getByRole("button", { name: "Open main menu" });
    await openButton.click();
    await expect(
      page.getByRole("navigation", { name: "Mobile" }),
    ).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(openButton).toBeFocused();
  });
});

test.describe("routing", () => {
  test("legacy /product redirects to /products", async ({ page }) => {
    await page.goto("/product");
    await expect(page).toHaveURL(/\/products$/);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Machines we sell and service",
      }),
    ).toBeVisible();
  });

  test("legacy /product/:slug redirects to /products/:slug", async ({
    page,
  }) => {
    await page.goto("/product/bernina");
    await expect(page).toHaveURL(/\/products\/bernina$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Bernina" }),
    ).toBeVisible();
  });

  test("unknown routes show the controlled not-found page", async ({
    page,
  }) => {
    await page.goto("/no-such-page");
    await expect(
      page.getByRole("heading", { level: 1, name: "Page not found" }),
    ).toBeVisible();
    await expect(page.getByRole("banner")).toBeVisible();
  });

  test("the image slider appears only on the homepage", async ({ page }) => {
    await page.goto("/services");
    await expect(
      page.getByRole("heading", { name: "Machine gallery" }),
    ).toHaveCount(0);
  });
});

test.describe("image slider", () => {
  test("next, previous and wrapping work in the browser", async ({ page }) => {
    await page.goto("/");
    const gallery = page.getByRole("region", { name: "Machine gallery" });
    const image = gallery.getByRole("img");
    const position = gallery.getByText(/Image \d of 2/);
    const next = page.getByRole("button", { name: "Next machine image" });
    const previous = page.getByRole("button", {
      name: "Previous machine image",
    });

    await expect(position).toHaveText("Image 1 of 2");
    const firstSource = await image.getAttribute("alt");

    await next.click();
    await expect(position).toHaveText("Image 2 of 2");
    await expect(image).not.toHaveAttribute("alt", firstSource);

    await previous.click();
    await expect(position).toHaveText("Image 1 of 2");

    await previous.click();
    await expect(position).toHaveText("Image 2 of 2");

    await next.click();
    await expect(position).toHaveText("Image 1 of 2");
  });
});

test.describe("keyboard and skip link", () => {
  test("skip link is the first tab stop and moves focus to main content", async ({
    page,
  }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to main content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();

    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();
  });
});

test.describe("responsive layout", () => {
  for (const width of [320, 640]) {
    test(`no horizontal scrolling at ${width}px (reflow proxy for 400% and 200% zoom)`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 800 });
      for (const route of PUBLIC_ROUTES) {
        await page.goto(route);
        await page.getByRole("heading", { level: 1 }).first().waitFor();
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        expect(overflow, `horizontal overflow on ${route}`).toBeLessThanOrEqual(
          0,
        );
      }
    });
  }
});

test.describe("public routes", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route} renders without application errors`, async ({ page }) => {
      const errors = collectErrors(page);
      await page.goto(route);
      await expect(
        page.getByRole("heading", { level: 1 }).first(),
      ).toBeVisible();
      expect(errors).toEqual([]);
    });
  }
});

test.describe("design additions", () => {
  test("design-preview portals are not served in the production build", async ({
    page,
  }) => {
    await page.goto("/preview/superadmin");
    await expect(
      page.getByRole("heading", { level: 1, name: "Page not found" }),
    ).toBeVisible();
  });

  test("catalogue brand filter updates the result count", async ({ page }) => {
    await page.goto("/products");
    await page.getByLabel("Brand").selectOption("Usha");
    await expect(
      page.getByRole("status").filter({ hasText: "Showing" }),
    ).toHaveText("Showing 1 of 4 product lines");
    await expect(page).toHaveURL(/brand=Usha/);
  });

  test("product gallery thumbnails change the main image", async ({ page }) => {
    await page.goto("/products/unik-gold");
    await page.getByRole("button", { name: "Show image 2 of 2" }).click();
    await expect(
      page.getByRole("img", { name: /DAHAO control touchscreen/ }).first(),
    ).toBeVisible();
  });

  test("the product page shows pending video and brochure states without autoplay", async ({
    page,
  }) => {
    await page.goto("/products/unik-gold");
    await expect(page.getByText("Demonstration video pending")).toBeVisible();
    await expect(page.locator("video")).toHaveCount(0);
  });

  test("enquiry validation shows errors and never claims the enquiry was sent", async ({
    page,
  }) => {
    await page.goto("/contact#enquiry");
    await page.getByRole("button", { name: "Send enquiry" }).click();
    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: "Please correct the following" }),
    ).toBeVisible();
    await expect(page.getByText("was not sent")).toHaveCount(0);
  });
});
