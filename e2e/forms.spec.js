import { expect, test } from "@playwright/test";

// Targeted checks for the form input border and focus styling (M2 final verification).

function luminance(rgb) {
  const [r, g, b] = rgb.map((value) => {
    const s = value / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const parseColor = (value) => {
  const parts = value.match(/[\d.]+/g).map(Number);
  return { rgb: parts.slice(0, 3), alpha: parts.length > 3 ? parts[3] : 1 };
};

const VIEWPORTS = [
  { name: "desktop", viewport: { width: 1440, height: 900 } },
  { name: "mobile", viewport: { width: 390, height: 844 } },
];

for (const { name, viewport } of VIEWPORTS) {
  test.describe(`forms ${name} @forms`, () => {
    test.use({ viewport });

    for (const path of ["/contact#enquiry", "/login", "/register"]) {
      test(`${path}: input borders meet 3:1 and focus outline is visible @forms`, async ({
        page,
      }) => {
        await page.goto(path);
        const inputs = page.locator(
          "input.field-input, select.field-input, textarea.field-input",
        );
        await expect(inputs.first()).toBeVisible();
        const count = await inputs.count();
        expect(count).toBeGreaterThan(0);

        for (let index = 0; index < count; index += 1) {
          const input = inputs.nth(index);
          await expect(input).toBeVisible();
          const style = await input.evaluate((el) => {
            const cs = getComputedStyle(el);
            return {
              border: cs.borderTopColor,
              bg: cs.backgroundColor,
              height: el.getBoundingClientRect().height,
            };
          });
          const border = parseColor(style.border).rgb;
          const background = parseColor(style.bg).rgb;
          expect(
            contrast(border, background),
            `border contrast on input ${index}`,
          ).toBeGreaterThanOrEqual(3);
          expect(
            style.height,
            `target height on input ${index}`,
          ).toBeGreaterThanOrEqual(24);
        }

        await inputs.first().focus();
        const focus = await inputs.first().evaluate((el) => {
          const cs = getComputedStyle(el);
          return {
            style: cs.outlineStyle,
            width: cs.outlineWidth,
            color: cs.outlineColor,
            bg: cs.backgroundColor,
          };
        });
        expect(focus.style).not.toBe("none");
        expect(parseFloat(focus.width)).toBeGreaterThanOrEqual(2);
        const outline = parseColor(focus.color);
        expect(outline.alpha, "focus outline must be opaque").toBe(1);
        expect(
          contrast(outline.rgb, parseColor(focus.bg).rgb),
          "focus outline contrast",
        ).toBeGreaterThanOrEqual(3);
      });
    }

    test(`contact enquiry keeps the layout within the viewport @forms`, async ({
      page,
    }) => {
      await page.goto("/contact#enquiry");
      await page.getByRole("button", { name: "Send enquiry" }).click();
      await expect(
        page
          .getByRole("alert")
          .filter({ hasText: "Please correct the following" }),
      ).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  });
}
