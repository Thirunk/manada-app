import ContentPage from "../ui/ContentPage";

function PrivacyPolicy() {
  return (
    <ContentPage
      title="Privacy Policy"
      path="/privacy-policy"
      intro="This page is a placeholder. The privacy policy text is pending owner and legal review."
    >
      <p className="text-stone-700">
        No privacy policy has been published yet. Until approved text is added
        here, do not treat this page as a statement of how personal information
        is handled.
      </p>
    </ContentPage>
  );
}

export default PrivacyPolicy;
