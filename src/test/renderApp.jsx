import { render } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { routes } from "../router";

/**
 * Renders the real application route table at the given URL using an
 * in-memory router, so tests exercise the same routes as the browser build.
 */
export function renderAt(path) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const utils = render(<RouterProvider router={router} />);
  return { router, ...utils };
}
