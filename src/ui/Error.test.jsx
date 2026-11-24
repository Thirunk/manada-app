import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import RouteError from "./Error";

const SECRET_DETAIL =
  "internal-db-password=hunter2 at /srv/private/handler.js:42";

function renderErrorRoute(loaderOrElementThrow) {
  const router = createMemoryRouter(
    [
      {
        path: "/",
        element: <p>home</p>,
      },
      {
        path: "/broken",
        loader: loaderOrElementThrow,
        element: <p>should not render</p>,
        errorElement: <RouteError />,
      },
    ],
    { initialEntries: ["/broken"] },
  );
  return render(<RouterProvider router={router} />);
}

describe("controlled error rendering", () => {
  it("shows a safe message and never the raw internal error detail", async () => {
    renderErrorRoute(() => {
      throw new Error(SECRET_DETAIL);
    });

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Something went wrong",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/hunter2/)).not.toBeInTheDocument();
    expect(screen.queryByText(/handler\.js/)).not.toBeInTheDocument();
    expect(document.body.textContent).not.toContain(SECRET_DETAIL);
  });

  it("offers safe navigation back to the homepage", async () => {
    renderErrorRoute(() => {
      throw new Error("boom");
    });

    expect(
      await screen.findByRole("link", { name: "Return to the homepage" }),
    ).toHaveAttribute("href", "/");
  });

  it("renders a not-found message for 404 responses", async () => {
    renderErrorRoute(() => {
      throw new Response("Not Found", { status: 404 });
    });

    expect(
      await screen.findByRole("heading", { level: 1, name: "Page not found" }),
    ).toBeInTheDocument();
  });
});
