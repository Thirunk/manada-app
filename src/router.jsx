import { createBrowserRouter, Navigate, redirect } from "react-router-dom";
import AppLayout from "./ui/AppLayout";
import RouteError, { RootError } from "./ui/Error";
import Home from "./pages/Home";
import { productLoader } from "./pages/productLoader";

/**
 * Design-preview routes (role portals and the media library) show sample data
 * and have no authentication. They exist only in development builds, or when
 * VITE_ENABLE_DESIGN_PREVIEW=true is set at build time. Production builds
 * without that flag do not include them.
 */
export const PREVIEW_ENABLED = __DESIGN_PREVIEW__;

/** Route-level code splitting: each page loads when its route is visited. */
const page = (load) => ({
  lazy: async () => {
    const mod = await load();
    return { Component: mod.default };
  },
});

const named = (load, exportName) => ({
  lazy: async () => {
    const mod = await load();
    return { Component: mod[exportName] };
  },
});

const publicRoutes = [
  { path: "/", element: <Home /> },
  { path: "/products", ...page(() => import("./pages/Products")) },
  {
    path: "/products/:slug",
    errorElement: <RouteError />,
    lazy: async () => {
      const mod = await import("./pages/ProductDetail");
      return { Component: mod.default, loader: productLoader };
    },
  },
  // Legacy URLs kept working after the routing foundation change.
  { path: "/product", element: <Navigate to="/products" replace /> },
  {
    path: "/product/:slug",
    loader: ({ params }) => redirect(`/products/${params.slug}`),
  },
  { path: "/brands", ...page(() => import("./pages/Brands")) },
  { path: "/services", ...page(() => import("./pages/Services")) },
  {
    path: "/services/:slug",
    errorElement: <RouteError />,
    lazy: async () => {
      const mod = await import("./pages/ServiceDetail");
      const { serviceLoader } = await import("./pages/serviceLoader");
      return { Component: mod.default, loader: serviceLoader };
    },
  },
  { path: "/training", ...page(() => import("./pages/Training")) },
  { path: "/about", ...page(() => import("./pages/About")) },
  { path: "/contact", ...page(() => import("./pages/Contact")) },
  { path: "/faq", ...page(() => import("./pages/FAQ")) },
  { path: "/privacy-policy", ...page(() => import("./pages/PrivacyPolicy")) },
  { path: "/terms", ...page(() => import("./pages/Terms")) },
  {
    path: "/login",
    ...named(() => import("./pages/auth/AuthScreens"), "LoginPage"),
  },
  {
    path: "/register",
    ...named(() => import("./pages/auth/AuthScreens"), "RegisterPage"),
  },
  {
    path: "/forgot-password",
    ...named(() => import("./pages/auth/AuthScreens"), "ForgotPasswordPage"),
  },
  {
    path: "/verify-email",
    ...named(() => import("./pages/auth/AuthScreens"), "VerifyEmailPage"),
  },
  {
    path: "/reset-password",
    ...named(() => import("./pages/auth/AuthScreens"), "ResetPasswordPage"),
  },
  {
    path: "/mfa",
    ...named(() => import("./pages/auth/AuthScreens"), "MfaPage"),
  },
  {
    path: "/session-expired",
    ...named(() => import("./pages/auth/AuthScreens"), "SessionExpiredPage"),
  },
  {
    path: "/access-denied",
    ...named(() => import("./pages/auth/AuthScreens"), "AccessDeniedPage"),
  },
  {
    path: "/portal/superadmin",
    ...named(() => import("./portal/superadmin/SuperAdminPortal"), "default"),
    children: [
      { index: true, ...page(() => import("./portal/superadmin/Overview")) },
      { path: "administrators", ...page(() => import("./portal/superadmin/Administrators")) },
      { path: "roles", ...page(() => import("./portal/superadmin/Roles")) },
      { path: "organization", ...page(() => import("./portal/superadmin/Organization")) },
      { path: "audit", ...page(() => import("./portal/superadmin/AuditLog")) },
      { path: "profile", ...page(() => import("./portal/superadmin/Profile")) },
    ],
  },
  { path: "*", ...page(() => import("./pages/NotFound")) },
];

/**
 * Built only when the preview is enabled. Keeping it inside a function lets
 * the bundler drop the preview modules from production builds entirely.
 */
function buildPreviewRoutes() {
  const portalRoute = {
    errorElement: <RouteError />,
    lazy: async () => {
      const mod = await import("./pages/preview/PortalPage");
      const { portalLoader } = await import("./pages/preview/portalLoader");
      return { Component: mod.default, loader: portalLoader };
    },
  };

  return [
    {
      path: "/preview",
      errorElement: <RouteError />,
      children: [
        { index: true, ...page(() => import("./pages/preview/PreviewIndex")) },
        { path: "media", ...page(() => import("./pages/preview/MediaPage")) },
        { path: ":role", ...portalRoute },
        { path: ":role/:section", ...portalRoute },
      ],
    },
  ];
}

/**
 * Route table. Kept separate from the router instance so tests can build a
 * memory router from the same definitions.
 */
export const routes = [
  {
    element: <AppLayout />,
    errorElement: <RootError />,
    children: publicRoutes,
  },
  ...(PREVIEW_ENABLED ? buildPreviewRoutes() : []),
];

export function createAppRouter() {
  return createBrowserRouter(routes);
}
