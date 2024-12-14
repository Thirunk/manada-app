// import Navigation from "./Navigation";
// import Logo from "./Logo";
import Menu from "./Menu";
function Header() {
  return (
    // <header className="flex border-b border-stone-500 bg-yellow-500 px-4 py-3 uppercase sm:px-6">
    //   <img height="40px" width="40px" src={logo} alt="logo" className="mr-4" />
    //   <Link to="/">Manada Embroidery Machine Solution</Link>
    // </header>
    // <header className="w-full border-b bg-yellow-500 px-4 py-2">
    <header className="fixed left-0 top-0 z-20 w-full border-b border-t border-gray-200 bg-yellow-500 px-4 py-2">
      <div className="text-right font-bold text-stone-900">
        <span className="w-10 rounded-md bg-yellow-100 p-1">
          Reach us for Sales/Services @ 91-9608134164
        </span>
      </div>
      <Menu />
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* <Logo /> */}
        {/* <Navigation /> */}
      </div>
    </header>
  );
}

export default Header;
