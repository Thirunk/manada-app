import {
  LifebuoyIcon,
  NewspaperIcon,
  PhoneIcon,
} from "@heroicons/react/20/solid";

const cards = [
  {
    name: "Sales",
    description:
      "All kinds of embroidery machines: UNIK GOLD HIGH QUALITY, BROTHER, BERNINA & USHA etc.",
    icon: PhoneIcon,
  },
  {
    name: "Services",
    description:
      "We offer repair, maintenance, and support services for a wide variety of embroidery machines, regardless of brand, model, or type, including single-head, multi-head, industrial, and computerized embroidery machines.",
    icon: LifebuoyIcon,
  },
  {
    name: "Trainings",
    description:
      "We will provide Embroidery Training and Embroidery Design Training",
    icon: NewspaperIcon,
  },
];

/**
 * Homepage support summary. The decorative background is CSS only, so the
 * section makes no third-party image requests.
 */
export default function SupportCenter() {
  return (
    <section
      aria-labelledby="support-center-heading"
      className="relative isolate overflow-hidden bg-gray-900 py-24 sm:py-32"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-br from-stone-900 via-gray-900 to-stone-800 opacity-90"
      />
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:mx-0">
          <h2
            id="support-center-heading"
            className="text-4xl font-bold tracking-tight text-white sm:text-6xl"
          >
            Support center
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-300">
            We provide sales and services for all kinds of sewing machines and
            embroidery machines.
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-8">
          {cards.map((card) => (
            <div
              key={card.name}
              className="flex gap-x-4 rounded-xl bg-white/5 p-6 ring-1 ring-inset ring-white/10"
            >
              <card.icon
                aria-hidden="true"
                className="h-7 w-5 flex-none text-yellow-400"
              />
              <div className="text-base leading-7">
                <h3 className="font-semibold text-white">{card.name}</h3>
                <p className="mt-2 text-gray-300">{card.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
