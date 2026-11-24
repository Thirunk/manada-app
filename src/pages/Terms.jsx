import { usePageMeta } from "../hooks/usePageMeta";
import ContentPage from "../ui/ContentPage";
import StatePanel from "../ui/StatePanel";

function Terms() {
  usePageMeta({
    title: "Terms of Use",
    description: "Terms of use for the Manada website.",
    path: "/terms",
  });

  return (
    <ContentPage
      title="Terms of Use"
      eyebrow="Legal"
      intro="Terms of use for this website."
    >
      <StatePanel
        variant="error"
        title="Draft placeholder, not an approved legal document"
      >
        The terms of use have not been written or approved yet. They are not
        binding in their current form. They will be replaced once the owner and
        legal review have approved the text.
      </StatePanel>
    </ContentPage>
  );
}

export default Terms;
