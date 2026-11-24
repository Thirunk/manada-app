import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import { SITE } from "./config/site";
import { renderAt } from "./test/renderApp";

describe("homepage", () => {
  it("renders the branding, service content and business contact details", async () => {
    renderAt("/");

    expect(
      await screen.findByRole("heading", { level: 1, name: SITE.name }),
    ).toBeInTheDocument();
    expect(document.title).toBe(SITE.name);

    expect(
      screen.getByRole("heading", { level: 2, name: "Machine gallery" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Featured embroidery machines",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Request a quotation" }),
    ).toBeInTheDocument();

    const banners = screen.getByRole("region", { name: "Promotional banners" });
    expect(within(banners).getAllByRole("img")).toHaveLength(3);

    const phoneLink = screen.getByRole("link", {
      name: /Reach us for Sales\/Services @ 91-9608134164/,
    });
    expect(phoneLink).toHaveAttribute("href", "tel:+919608134164");
  });

  it("shows the machine gallery only on the homepage", async () => {
    renderAt("/products");
    await screen.findByRole("heading", {
      level: 1,
      name: "Machines we sell and service",
    });
    expect(
      screen.queryByRole("heading", { name: "Machine gallery" }),
    ).not.toBeInTheDocument();
  });
});

describe("valid route rendering", () => {
  it.each([
    ["/products", "Machines we sell and service"],
    ["/products/unik-gold", "Unik Gold embroidery machines"],
    ["/brands", "Brands"],
    ["/services", "Services"],
    ["/services/repair-maintenance", "Repair and maintenance"],
    ["/training", "Training"],
    ["/about", "About Us"],
    ["/contact", "Contact Us"],
    ["/faq", "Frequently asked questions"],
    ["/privacy-policy", "Privacy Policy"],
    ["/terms", "Terms of Use"],
    ["/login", "Sign in"],
  ])("renders %s with a single page heading", async (path, heading) => {
    renderAt(path);

    expect(
      await screen.findByRole("heading", { level: 1, name: heading }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
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
      await screen.findByRole("heading", {
        level: 1,
        name: "Machines we sell and service",
      }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/products");
  });

  it("redirects /product/:slug to /products/:slug", async () => {
    const { router } = renderAt("/product/brother");
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Brother machines",
      }),
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
    expect(screen.getByRole("link", { name: "Homepage" })).toHaveAttribute(
      "href",
      "/",
    );
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

  it("shows a controlled not-found message for an unknown service slug", async () => {
    renderAt("/services/not-a-service");
    expect(
      await screen.findByRole("heading", { level: 1, name: "Page not found" }),
    ).toBeInTheDocument();
  });
});

describe("design preview routes", () => {
  it("renders the portal overview with sample-data labelling", async () => {
    renderAt("/preview/superadmin");
    expect(
      await screen.findByRole("heading", { level: 1, name: "System overview" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Design preview · Sample data · No sign-in/),
    ).toBeInTheDocument();
  });

  it("returns not found for an unknown portal role", async () => {
    renderAt("/preview/not-a-role");
    expect(
      await screen.findByRole("heading", { level: 1, name: "Page not found" }),
    ).toBeInTheDocument();
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
