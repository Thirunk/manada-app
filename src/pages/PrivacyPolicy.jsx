import { usePageMeta } from "../hooks/usePageMeta";
import ContentPage from "../ui/ContentPage";
import StatePanel from "../ui/StatePanel";

function PrivacyPolicy() {
  usePageMeta({
    title: "Privacy Policy",
    description: "Privacy policy for the Manada website.",
    path: "/privacy-policy",
  });

  return (
    <ContentPage
      title="Privacy Policy"
      eyebrow="Legal"
      intro="Privacy policy text for this website."
    >
      <StatePanel
        variant="error"
        title="Draft placeholder, not an approved legal document"
      >
        The privacy policy has not been written or approved yet. Do not rely on
        this page for how personal information is handled. It will be replaced
        once the owner and legal review have approved the text.
      </StatePanel>
    </ContentPage>
  );
}

export default PrivacyPolicy;
