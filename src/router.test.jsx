import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import { SITE } from "./config/site";
import { renderAt } from "./test/renderApp";

describe("homepage", () => {
  it("renders the branding, banners, support section and business contact details", async () => {
    renderAt("/");

    expect(
      await screen.findByRole("heading", { level: 1, name: SITE.name }),
    ).toBeInTheDocument();
    expect(document.title).toBe(SITE.name);

    expect(
      screen.getByRole("heading", { level: 2, name: "Machine gallery" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Support center" }),
    ).toBeInTheDocument();

    const banners = screen.getByRole("region", {
      name: "Promotional banners",
    });
    expect(within(banners).getAllByRole("img")).toHaveLength(3);

    const phoneLink = screen.getByRole("link", {
      name: /Reach us for Sales\/Services @ 91-9608134164/,
    });
    expect(phoneLink).toHaveAttribute("href", "tel:+919608134164");
  });

  it("shows the machine slider on the homepage", async () => {
    renderAt("/");
    expect(
      await screen.findByRole("heading", { name: "Machine gallery" }),
    ).toBeInTheDocument();
  });

  it("does not show the machine slider on other pages", async () => {
    renderAt("/products");
    await screen.findByRole("heading", { level: 1, name: "Products" });
    expect(
      screen.queryByRole("heading", { name: "Machine gallery" }),
    ).not.toBeInTheDocument();
  });
});

describe("valid route rendering", () => {
  it.each([
    ["/products", "Products", "Products"],
    ["/products/unik-gold", "Unik Gold", "Unik Gold"],
    ["/services", "Services", "Services"],
    ["/training", "Training", "Training"],
    ["/about", "About Us", "About Us"],
    ["/contact", "Contact Us", "Contact Us"],
    ["/privacy-policy", "Privacy Policy", "Privacy Policy"],
    ["/terms", "Terms of Use", "Terms of Use"],
  ])("renders %s with a single page heading", async (path, heading, name) => {
    renderAt(path);

    expect(
      await screen.findByRole("heading", { level: 1, name: heading }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toContain(name);
    expect(document.title).toContain(SITE.name);
  });

  it("sets a page-specific meta description", async () => {
    renderAt("/about");
    await screen.findByRole("heading", { level: 1, name: "About Us" });
    expect(document.querySelector('meta[name="description"]')).toHaveAttribute(
      "content",
      expect.stringContaining("sales and services"),
    );
  });
});

describe("legacy product URL redirects", () => {
  it("redirects /product to /products", async () => {
    const { router } = renderAt("/product");
    expect(
      await screen.findByRole("heading", { level: 1, name: "Products" }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/products");
  });

  it("redirects /product/:slug to /products/:slug", async () => {
    const { router } = renderAt("/product/brother");
    expect(
      await screen.findByRole("heading", { level: 1, name: "Brother" }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/products/brother");
  });
});

describe("unknown routes and controlled errors", () => {
  it("shows a not-found page inside the site layout for unknown URLs", async () => {
    renderAt("/does-not-exist");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Page not found" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Return to the homepage" }),
    ).toHaveAttribute("href", "/");
  });

  it("shows a controlled not-found message for an unknown product slug", async () => {
    renderAt("/products/not-a-real-product");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Page not found" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Response|stack|at \w+\(/),
    ).not.toBeInTheDocument();
  });
});

describe("placeholder navigation", () => {
  it.each(["/", "/about", "/contact"])(
    'contains no href="#" placeholder links on %s',
    async (path) => {
      const { container } = renderAt(path);
      await screen.findByRole("heading", { level: 1 });

      const placeholders = Array.from(container.querySelectorAll("a")).filter(
        (link) => link.getAttribute("href") === "#",
      );
      expect(placeholders).toHaveLength(0);
    },
  );
});
