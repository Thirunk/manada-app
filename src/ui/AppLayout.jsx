import { Outlet } from "react-router-dom";
import Footer from "./Footer";
import Header from "./Header";
import SkipLink from "./SkipLink";

/**
 * Application shell: skip link, header landmark, main content landmark and
 * footer landmark. Route content renders through <Outlet />.
 */
function AppLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <Header />
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 focus:outline-none"
      >
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default AppLayout;
