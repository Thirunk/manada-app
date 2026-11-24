import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SITE, getCopyrightYear } from "../config/site";
import { renderAt } from "../test/renderApp";

describe("skip to content", () => {
  it("is the first focusable element and moves focus to the main landmark", async () => {
    const user = userEvent.setup();
    renderAt("/");
    await screen.findByRole("heading", { level: 1 });

    const skipLink = screen.getByRole("link", {
      name: "Skip to main content",
    });
    expect(skipLink).toHaveAttribute("href", "#main-content");

    await user.tab();
    expect(skipLink).toHaveFocus();

    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "main-content");
    expect(main).toHaveAttribute("tabindex", "-1");
  });
});

describe("landmarks and navigation", () => {
  it("exposes banner, main, contentinfo and labelled navigation landmarks", async () => {
    renderAt("/");
    await screen.findByRole("heading", { level: 1 });

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Primary" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Footer" }),
    ).toBeInTheDocument();
  });

  it("desktop navigation routes to the chosen page and marks it as the current page", async () => {
    const user = userEvent.setup();
    const { router } = renderAt("/");
    await screen.findByRole("heading", { level: 1 });

    const primary = screen.getByRole("navigation", { name: "Primary" });
    await user.click(within(primary).getByRole("link", { name: "Services" }));

    expect(router.state.location.pathname).toBe("/services");
    expect(
      await screen.findByRole("heading", { level: 1, name: "Services" }),
    ).toBeInTheDocument();
    expect(
      within(primary).getByRole("link", { name: "Services" }),
    ).toHaveAttribute("aria-current", "page");
  });

  it("logo link points to the homepage and navigates there", async () => {
    const user = userEvent.setup();
    const { router } = renderAt("/about");
    await screen.findByRole("heading", { level: 1, name: "About Us" });

    const logo = within(screen.getByRole("banner")).getByRole("link", {
      name: SITE.name,
    });
    expect(logo).toHaveAttribute("href", "/");

    await user.click(logo);
    expect(router.state.location.pathname).toBe("/");
    expect(
      await screen.findByRole("heading", { level: 1, name: SITE.name }),
    ).toBeInTheDocument();
  });

  it("does not render the removed login navigation", async () => {
    renderAt("/");
    await screen.findByRole("heading", { level: 1 });
    expect(screen.queryByText(/log in/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /login/i }),
    ).not.toBeInTheDocument();
  });
});

describe("accessible names and footer", () => {
  it("gives every button in the layout an accessible name", async () => {
    renderAt("/");
    await screen.findByRole("heading", { level: 1 });

    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
    buttons.forEach((button) => {
      expect(button).toHaveAccessibleName();
    });
  });

  it("uses the current year for the copyright notice", async () => {
    renderAt("/");
    await screen.findByRole("heading", { level: 1 });

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveTextContent(
      `© ${getCopyrightYear()} ${SITE.name}. All Rights Reserved.`,
    );
  });

  it("computes the copyright year from the supplied date", () => {
    expect(getCopyrightYear(new Date(2031, 5, 1))).toBe(2031);
  });

  it("preserves the existing company website reference", async () => {
    renderAt("/");
    await screen.findByRole("heading", { level: 1 });

    const footer = screen.getByRole("contentinfo");
    expect(
      within(footer).getByRole("link", { name: SITE.name }),
    ).toHaveAttribute("href", "https://manadaembroidery.com");
  });

  it("links the footer to the real pages instead of placeholders", async () => {
    renderAt("/");
    await screen.findByRole("heading", { level: 1 });

    const footer = screen.getByRole("contentinfo");
    expect(
      within(footer).getByRole("link", { name: "About Us" }),
    ).toHaveAttribute("href", "/about");
    expect(
      within(footer).getByRole("link", { name: "Privacy Policy" }),
    ).toHaveAttribute("href", "/privacy-policy");
    expect(within(footer).getByRole("link", { name: "Terms" })).toHaveAttribute(
      "href",
      "/terms",
    );
  });
});

describe("business information", () => {
  it("publishes the existing phone numbers on the contact page", async () => {
    renderAt("/contact");
    await screen.findByRole("heading", { level: 1, name: "Contact Us" });

    SITE.phones.forEach((phone) => {
      expect(screen.getByRole("link", { name: phone.display })).toHaveAttribute(
        "href",
        phone.href,
      );
    });
  });

  it("does not render images that load from third-party hosts", async () => {
    const { container } = renderAt("/");
    await screen.findByRole("heading", { level: 1 });

    const images = Array.from(container.querySelectorAll("img"));
    expect(images.length).toBeGreaterThan(0);
    images.forEach((img) => {
      expect(img.getAttribute("src")).not.toMatch(/^https?:\/\//);
    });
  });
});
