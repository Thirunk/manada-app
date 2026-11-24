import ContentPage from "../ui/ContentPage";

function Terms() {
  return (
    <ContentPage
      title="Terms of Use"
      path="/terms"
      intro="This page is a placeholder. The terms of use text is pending owner and legal review."
    >
      <p className="text-stone-700">
        No terms of use have been published yet. Until approved text is added
        here, do not treat this page as binding terms.
      </p>
    </ContentPage>
  );
}

export default Terms;
