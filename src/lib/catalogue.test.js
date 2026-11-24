import { describe, expect, it } from "vitest";
import { PRODUCT_LINES } from "../config/products";
import { filterProducts, hasActiveFilters } from "./catalogue";
import { validateEnquiry } from "./validation";

describe("catalogue filtering", () => {
  it("returns every product line with no filters", () => {
    expect(filterProducts(PRODUCT_LINES)).toHaveLength(PRODUCT_LINES.length);
  });

  it("filters by brand", () => {
    const results = filterProducts(PRODUCT_LINES, { brand: "Usha" });
    expect(results.map((product) => product.slug)).toEqual(["usha"]);
  });

  it("filters by category", () => {
    const results = filterProducts(PRODUCT_LINES, {
      category: "Embroidery machines",
    });
    expect(results.map((product) => product.slug)).toEqual(["unik-gold"]);
  });

  it("searches names, brands and summaries case-insensitively", () => {
    expect(
      filterProducts(PRODUCT_LINES, { query: "BERNINA" }).map((p) => p.slug),
    ).toEqual(["bernina"]);
    expect(
      filterProducts(PRODUCT_LINES, { query: "  sewing  " }).length,
    ).toBeGreaterThan(0);
  });

  it("combines search, category and brand", () => {
    const results = filterProducts(PRODUCT_LINES, {
      query: "machines",
      category: "Embroidery and sewing machines",
      brand: "Brother",
    });
    expect(results.map((product) => product.slug)).toEqual(["brother"]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(filterProducts(PRODUCT_LINES, { query: "no-such-machine" })).toEqual(
      [],
    );
  });

  it("reports whether any filter is active", () => {
    expect(hasActiveFilters({})).toBe(false);
    expect(hasActiveFilters({ query: "  " })).toBe(false);
    expect(hasActiveFilters({ brand: "Usha" })).toBe(true);
  });
});

describe("enquiry validation", () => {
  const valid = {
    name: "Sample Customer",
    phone: "9608134164",
    message: "Please quote a machine.",
  };

  it("accepts a complete enquiry with a phone number", () => {
    expect(validateEnquiry(valid)).toEqual({});
  });

  it("requires a name", () => {
    expect(validateEnquiry({ ...valid, name: "  " })).toHaveProperty("name");
  });

  it("requires a phone number or an email address", () => {
    expect(validateEnquiry({ ...valid, phone: "" })).toHaveProperty("contact");
  });

  it("rejects malformed phone and email values", () => {
    expect(validateEnquiry({ ...valid, phone: "abc" })).toHaveProperty("phone");
    expect(validateEnquiry({ ...valid, email: "not-an-email" })).toHaveProperty(
      "email",
    );
  });

  it("requires a message of at least ten characters", () => {
    expect(validateEnquiry({ ...valid, message: "short" })).toHaveProperty(
      "message",
    );
  });
});
