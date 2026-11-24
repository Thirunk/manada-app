import { describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderAt } from "../test/renderApp";

async function openMobileMenu(user) {
  await user.click(screen.getByRole("button", { name: "Open main menu" }));
  return screen.findByRole("dialog");
}

describe("mobile menu", () => {
  it("opens a labelled dialog containing the shared navigation", async () => {
    const user = userEvent.setup();
    renderAt("/");
    await screen.findByRole("heading", { level: 1 });

    const dialog = await openMobileMenu(user);
    expect(dialog).toHaveAccessibleName("Site menu");
    expect(
      within(dialog).getByRole("navigation", { name: "Mobile" }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("link", { name: "Products" }),
    ).toHaveAttribute("href", "/products");
  });

  it("closes on Escape and restores focus to the menu button", async () => {
    const user = userEvent.setup();
    renderAt("/");
    await screen.findByRole("heading", { level: 1 });

    const openButton = screen.getByRole("button", { name: "Open main menu" });
    await openMobileMenu(user);

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(openButton).toHaveFocus();
  });

  it("restores focus to the menu button when closed with the close control", async () => {
    const user = userEvent.setup();
    renderAt("/");
    await screen.findByRole("heading", { level: 1 });

    const openButton = screen.getByRole("button", { name: "Open main menu" });
    const dialog = await openMobileMenu(user);
    await user.click(
      within(dialog).getByRole("button", { name: "Close menu" }),
    );

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(openButton).toHaveFocus();
  });

  it("keeps keyboard focus inside the open dialog", async () => {
    const user = userEvent.setup();
    renderAt("/");
    await screen.findByRole("heading", { level: 1 });

    const dialog = await openMobileMenu(user);
    for (let step = 0; step < 12; step += 1) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
  });

  it("closes after the user selects a page and navigates to it", async () => {
    const user = userEvent.setup();
    const { router } = renderAt("/");
    await screen.findByRole("heading", { level: 1 });

    const dialog = await openMobileMenu(user);
    await user.click(within(dialog).getByRole("link", { name: "Training" }));

    await waitFor(() =>
      expect(router.state.location.pathname).toBe("/training"),
    );
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(
      await screen.findByRole("heading", { level: 1, name: "Training" }),
    ).toBeInTheDocument();
  });

  it("uses the same route definitions as the desktop navigation", async () => {
    const user = userEvent.setup();
    renderAt("/");
    await screen.findByRole("heading", { level: 1 });

    const labels = (nav) =>
      within(nav)
        .getAllByRole("link")
        .map((link) => [link.textContent, link.getAttribute("href")]);

    // Read the desktop links before opening the dialog: while it is open the
    // page behind it is correctly removed from the accessibility tree.
    const desktopLinks = labels(
      screen.getByRole("navigation", { name: "Primary" }),
    );
    const dialog = await openMobileMenu(user);
    const mobileLinks = labels(
      within(dialog).getByRole("navigation", { name: "Mobile" }),
    );

    expect(mobileLinks).toEqual(desktopLinks);
    expect(desktopLinks).toHaveLength(6);
  });
});
