import SupportCenter from "./SupportCenter";
function Home() {
  let arr_of_imgs = ["baner1.png", "baner2.png", "baner3.png"];

  return (
    <>
      {/* <div className="mt-10 text-center">
        <h1 className="text-center text-xl font-semibold text-yellow-500">
          Manada Embroidery Solution
        </h1>
      </div> */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="w-full px-4 py-5 sm:p-6">
          <img src={arr_of_imgs[0]} className="w-full"></img>
        </div>
        <div className="object-cover px-4 py-5 sm:p-6">
          <img src={arr_of_imgs[1]} className="w-full"></img>
        </div>
        <div className="w-full px-4 py-5 sm:p-6">
          <img src={arr_of_imgs[2]}></img>
        </div>
      </div>
      <div>
        <SupportCenter />
      </div>
    </>
  );
}

export default Home;
