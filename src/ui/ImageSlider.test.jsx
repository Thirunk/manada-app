import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MACHINE_SLIDES } from "../config/gallery";
import { renderAt } from "../test/renderApp";

async function renderSlider() {
  const utils = renderAt("/");
  await screen.findByRole("heading", { name: "Machine gallery" });
  return utils;
}

function currentSlideImage() {
  return within(
    screen.getByRole("region", { name: "Machine gallery" }),
  ).getByRole("img");
}

describe("image slider", () => {
  it("uses only unique photographs, so there are no duplicate slides", () => {
    expect(MACHINE_SLIDES).toHaveLength(2);
    expect(new Set(MACHINE_SLIDES.map((slide) => slide.src)).size).toBe(2);
  });

  it("starts on the first slide and exposes the position to assistive technology", async () => {
    await renderSlider();

    expect(currentSlideImage()).toHaveAttribute("alt", MACHINE_SLIDES[0].alt);
    expect(screen.getByText("Image 1 of 2")).toHaveAttribute(
      "aria-live",
      "polite",
    );
  });

  it("moves to the next slide", async () => {
    const user = userEvent.setup();
    await renderSlider();

    await user.click(
      screen.getByRole("button", { name: "Next machine image" }),
    );

    expect(currentSlideImage()).toHaveAttribute("alt", MACHINE_SLIDES[1].alt);
    expect(screen.getByText("Image 2 of 2")).toBeInTheDocument();
  });

  it("moves to the previous slide", async () => {
    const user = userEvent.setup();
    await renderSlider();

    await user.click(
      screen.getByRole("button", { name: "Next machine image" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Previous machine image" }),
    );

    expect(screen.getByText("Image 1 of 2")).toBeInTheDocument();
  });

  it("wraps from the last slide back to the first when moving next", async () => {
    const user = userEvent.setup();
    await renderSlider();

    const next = screen.getByRole("button", { name: "Next machine image" });
    await user.click(next);
    await user.click(next);

    expect(screen.getByText("Image 1 of 2")).toBeInTheDocument();
    expect(currentSlideImage()).toHaveAttribute("alt", MACHINE_SLIDES[0].alt);
  });

  it("wraps from the first slide to the last when moving previous", async () => {
    const user = userEvent.setup();
    await renderSlider();

    await user.click(
      screen.getByRole("button", { name: "Previous machine image" }),
    );

    expect(screen.getByText("Image 2 of 2")).toBeInTheDocument();
    expect(currentSlideImage()).toHaveAttribute("alt", MACHINE_SLIDES[1].alt);
  });

  it("gives both controls accessible names", async () => {
    await renderSlider();
    expect(
      screen.getByRole("button", { name: "Previous machine image" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Next machine image" }),
    ).toBeInTheDocument();
  });

  it("gives every slide descriptive alternative text", () => {
    MACHINE_SLIDES.forEach((slide) => {
      expect(slide.alt.length).toBeGreaterThan(20);
      expect(slide.alt).not.toMatch(/^image|photo of|picture of/i);
    });
  });
});
