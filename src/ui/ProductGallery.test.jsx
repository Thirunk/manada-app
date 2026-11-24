import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MACHINE_PHOTOS } from "../config/gallery";
import ProductGallery from "./ProductGallery";

const photos = [
  MACHINE_PHOTOS["unik-gold-head"],
  MACHINE_PHOTOS["unik-gold-touchscreen"],
];

describe("product gallery", () => {
  it("shows a clear empty state when no photos exist", () => {
    render(<ProductGallery photos={[]} productName="Brother machines" />);
    expect(
      screen.getByText("Photos are not available yet"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("switches the main image when a thumbnail is chosen", async () => {
    const user = userEvent.setup();
    render(
      <ProductGallery
        photos={photos}
        productName="Unik Gold embroidery machines"
      />,
    );

    const thumbnails = screen.getByRole("list", {
      name: "Unik Gold embroidery machines thumbnails",
    });
    await user.click(
      within(thumbnails).getByRole("button", { name: "Show image 2 of 2" }),
    );

    expect(
      screen.getByRole("img", { name: /DAHAO control touchscreen/ }),
    ).toBeInTheDocument();
    expect(
      within(thumbnails).getByRole("button", { name: "Show image 2 of 2" }),
    ).toHaveAttribute("aria-current", "true");
  });

  it("toggles zoom with a labelled button that exposes its pressed state", async () => {
    const user = userEvent.setup();
    render(
      <ProductGallery
        photos={photos}
        productName="Unik Gold embroidery machines"
      />,
    );

    const zoom = screen.getByRole("button", { name: "Zoom in" });
    expect(zoom).toHaveAttribute("aria-pressed", "false");
    await user.click(zoom);
    expect(screen.getByRole("button", { name: "Reset zoom" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("opens a full-screen viewer and closes it with Escape", async () => {
    const user = userEvent.setup();
    render(
      <ProductGallery
        photos={photos}
        productName="Unik Gold embroidery machines"
      />,
    );

    await user.click(screen.getByRole("button", { name: "View full screen" }));
    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByRole("button", { name: "Next image" }),
    ).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
