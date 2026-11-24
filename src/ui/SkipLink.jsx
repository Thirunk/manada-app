/**
 * First focusable element on every page. Hidden until it receives keyboard
 * focus, then shown on top of the header.
 */
function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only z-50 rounded-md bg-white px-4 py-2 text-sm font-semibold text-stone-900 shadow-lg focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400"
    >
      Skip to main content
    </a>
  );
}

export default SkipLink;
