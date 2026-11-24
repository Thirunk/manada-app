/**
 * Single source of route definitions for desktop navigation, mobile
 * navigation and the footer. Add a new public page here and in router.jsx.
 */
export const primaryNavigation = [
  { label: "Products", to: "/products" },
  { label: "Services", to: "/services" },
  { label: "Training", to: "/training" },
  { label: "About Us", to: "/about" },
  { label: "Contact Us", to: "/contact" },
];

export const footerNavigation = [
  { label: "About Us", to: "/about" },
  { label: "Privacy Policy", to: "/privacy-policy" },
  { label: "Terms", to: "/terms" },
  { label: "Contact Us", to: "/contact" },
];
