import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MediaLibrary from "./MediaLibrary";

function titlesInOrder() {
  return screen
    .getAllByRole("heading", { level: 3 })
    .map((heading) => heading.textContent);
}

describe("media library", () => {
  it("moves an item later using a button, the keyboard alternative to drag and drop", async () => {
    const user = userEvent.setup();
    render(<MediaLibrary />);

    const before = titlesInOrder();
    await user.click(
      screen.getByRole("button", { name: `Move ${before[0]} later` }),
    );

    const after = titlesInOrder();
    expect(after[0]).toBe(before[1]);
    expect(after[1]).toBe(before[0]);
  });

  it("allows only one cover image at a time", async () => {
    const user = userEvent.setup();
    render(<MediaLibrary />);

    const [first, second] = screen.getAllByRole("button", {
      name: "Set as cover",
    });
    await user.click(first);
    await user.click(second);

    expect(first).toHaveAttribute("aria-pressed", "false");
    expect(second).toHaveAttribute("aria-pressed", "true");
  });

  it("lists selected files as not uploaded instead of claiming storage", () => {
    const { container } = render(<MediaLibrary />);
    const input = container.querySelector('input[type="file"]');
    const file = new File(["sample"], "sample-brochure.pdf", {
      type: "application/pdf",
    });

    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText("sample-brochure.pdf")).toBeInTheDocument();
    expect(screen.getByText(/Not uploaded/)).toBeInTheDocument();
  });

  it("filters by search text and shows an empty state when nothing matches", async () => {
    const user = userEvent.setup();
    render(<MediaLibrary />);

    await user.type(
      screen.getByRole("searchbox", { name: "Search media" }),
      "zzz-no-match",
    );
    expect(
      screen.getByText("No media match these filters"),
    ).toBeInTheDocument();
  });

  it("gives each approval select a label that names its item", () => {
    render(<MediaLibrary />);
    expect(
      screen.getByLabelText("Approval for Unik Gold embroidery head"),
    ).toBeInTheDocument();
    expect(
      within(
        screen.getByRole("region", { name: "Media library" }),
      ).getAllByRole("list").length,
    ).toBeGreaterThan(0);
  });
});
