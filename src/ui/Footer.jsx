function Footer() {
  return (
    // <div className="bg-stone-800 p-4 text-center text-stone-200">
    //   <footer>
    //     Copyright @2025 Manada Embroidery Machine Solution | All Rights Reserved
    //   </footer>
    // </div>

    <footer className="left-0 z-20 w-full border-t border-gray-200 bg-stone-800 p-4 shadow md:flex md:items-center md:justify-between md:p-6 dark:border-stone-600 dark:bg-stone-800">
      <span className="text-sm text-stone-200 sm:text-center dark:text-stone-400">
        © 2025
        <a href="https://manadaembroidery.com" className="ml-2 hover:underline">
          Manada Embroidery Machine Solution
        </a>
        . All Rights Reserved.
      </span>
      <ul className="mt-3 flex flex-wrap items-center text-sm font-medium text-stone-200 sm:mt-0 dark:text-stone-400">
        <li>
          <a href="#" className="me-4 hover:underline md:me-6">
            About US
          </a>
        </li>
        <li>
          <a href="#" className="me-4 hover:underline md:me-6">
            Privacy Policy
          </a>
        </li>
        <li>
          <a href="#" className="me-4 hover:underline md:me-6">
            Licensing
          </a>
        </li>
        <li>
          <a href="#" className="hover:underline">
            Contact US
          </a>
        </li>
      </ul>
    </footer>
  );
}

export default Footer;
