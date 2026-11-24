import { createBrowserRouter, Navigate, redirect } from "react-router-dom";
import AppLayout from "./ui/AppLayout";
import RouteError, { RootError } from "./ui/Error";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import { productLoader } from "./pages/productLoader";
import Services from "./pages/Services";
import Training from "./pages/Training";
import About from "./pages/About";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";

/**
 * Route table. Kept separate from the router instance so tests can build a
 * memory router from the same definitions.
 */
export const routes = [
  {
    element: <AppLayout />,
    errorElement: <RootError />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/products", element: <Products /> },
      {
        path: "/products/:slug",
        element: <ProductDetail />,
        loader: productLoader,
        errorElement: <RouteError />,
      },
      // Legacy URLs kept working after the routing foundation change.
      { path: "/product", element: <Navigate to="/products" replace /> },
      {
        path: "/product/:slug",
        loader: ({ params }) => redirect(`/products/${params.slug}`),
      },
      { path: "/services", element: <Services /> },
      { path: "/training", element: <Training /> },
      { path: "/about", element: <About /> },
      { path: "/contact", element: <Contact /> },
      { path: "/privacy-policy", element: <PrivacyPolicy /> },
      { path: "/terms", element: <Terms /> },
      { path: "*", element: <NotFound /> },
    ],
  },
];

export function createAppRouter() {
  return createBrowserRouter(routes);
}
