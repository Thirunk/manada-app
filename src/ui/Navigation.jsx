export default function Navigation() {
  return (
    <nav className="z-10 text-xl">
      <ul className="flex items-center gap-16">
        <li>
          <a
            href="/products"
            className="hover:text-accent-400 transition-colors"
          >
            Products
          </a>
        </li>
        <li>
          <a href="/about" className="hover:text-accent-400 transition-colors">
            About US
          </a>
        </li>
        <li>
          <a
            href="/contact"
            className="hover:text-accent-400 transition-colors"
          >
            Contact US
          </a>
        </li>
        <li>
          <a
            href="/account"
            className="hover:text-accent-400 transition-colors"
          >
            Login
          </a>
        </li>
      </ul>
    </nav>
  );
}
