import { Outlet } from "react-router-dom";
import Footer from "./Footer";
import Header from "./Header";
import ImageSlider from "./ImageSlider";

function AppLayout() {
  return (
    <>
      <Header />
      <div className="grid grid-rows-[auto_auto_auto]">
        <main className="mt-2">
          <div className="mt-24">
            <ImageSlider />
          </div>
          <Outlet />
        </main>

        <Footer />
      </div>
    </>
  );
}

export default AppLayout;
