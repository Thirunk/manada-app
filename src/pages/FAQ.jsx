import { FAQ_ITEMS } from "../config/faq";
import { usePageMeta } from "../hooks/usePageMeta";
import ContentPage from "../ui/ContentPage";

function FAQ() {
  usePageMeta({
    title: "FAQ",
    description:
      "Answers to common questions about Manada's machines, services and training.",
    path: "/faq",
  });

  return (
    <ContentPage
      title="Frequently asked questions"
      eyebrow="FAQ"
      intro="Answers below are taken from our current information. If your question is not here, contact us."
    >
      <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {FAQ_ITEMS.map((item) => (
          <li key={item.question}>
            <details className="group p-5">
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-semibold text-navy">
                {item.question}
                <span
                  aria-hidden="true"
                  className="text-teal transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-6 text-body">{item.answer}</p>
            </details>
          </li>
        ))}
      </ul>
    </ContentPage>
  );
}

export default FAQ;
