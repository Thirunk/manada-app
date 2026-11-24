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
  const gallery = screen.getByRole("region", { name: "Machine gallery" });
  return within(gallery).getByRole("img");
}

describe("image slider", () => {
  it("starts on the first slide and exposes the position to assistive technology", async () => {
    await renderSlider();

    expect(currentSlideImage()).toHaveAttribute("alt", MACHINE_SLIDES[0].alt);
    const position = screen.getByText(`Image 1 of ${MACHINE_SLIDES.length}`);
    expect(position).toHaveAttribute("aria-live", "polite");
  });

  it("moves to the next slide", async () => {
    const user = userEvent.setup();
    await renderSlider();

    await user.click(
      screen.getByRole("button", { name: "Next machine image" }),
    );

    expect(currentSlideImage()).toHaveAttribute("alt", MACHINE_SLIDES[1].alt);
    expect(screen.getByText("Image 2 of 4")).toBeInTheDocument();
  });

  it("moves to the previous slide", async () => {
    const user = userEvent.setup();
    await renderSlider();

    await user.click(
      screen.getByRole("button", { name: "Next machine image" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Next machine image" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Previous machine image" }),
    );

    expect(screen.getByText("Image 2 of 4")).toBeInTheDocument();
  });

  it("wraps from the last slide back to the first when moving next", async () => {
    const user = userEvent.setup();
    await renderSlider();

    const next = screen.getByRole("button", { name: "Next machine image" });
    for (let step = 0; step < MACHINE_SLIDES.length; step += 1) {
      await user.click(next);
    }

    expect(screen.getByText("Image 1 of 4")).toBeInTheDocument();
    expect(currentSlideImage()).toHaveAttribute("alt", MACHINE_SLIDES[0].alt);
  });

  it("wraps from the first slide to the last when moving previous", async () => {
    const user = userEvent.setup();
    await renderSlider();

    await user.click(
      screen.getByRole("button", { name: "Previous machine image" }),
    );

    expect(screen.getByText("Image 4 of 4")).toBeInTheDocument();
    expect(currentSlideImage()).toHaveAttribute(
      "alt",
      MACHINE_SLIDES[MACHINE_SLIDES.length - 1].alt,
    );
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
