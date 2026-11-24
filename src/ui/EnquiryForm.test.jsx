import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import EnquiryForm from "./EnquiryForm";

function renderForm(props = {}) {
  return render(
    <MemoryRouter>
      <EnquiryForm {...props} />
    </MemoryRouter>,
  );
}

describe("enquiry form", () => {
  it("shows text errors and focuses the error summary when the form is invalid", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: "Send enquiry" }));

    const summary = await screen.findByRole("alert");
    await waitFor(() => expect(summary).toHaveFocus());
    expect(summary).toHaveTextContent("Enter your name.");
    expect(screen.getByLabelText(/Full name/)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("does not claim the enquiry was sent when the form is valid", async () => {
    const user = userEvent.setup();
    renderForm({ initialMachine: "Usha", productName: "Usha machines" });

    expect(screen.getByText(/Enquiring about/)).toHaveTextContent(
      "Usha machines",
    );
    await user.type(screen.getByLabelText(/Full name/), "Sample Customer");
    await user.type(screen.getByLabelText(/Phone number/), "9608134164");
    await user.type(
      screen.getByLabelText(/What do you need/),
      "Please quote a machine.",
    );
    await user.click(screen.getByRole("button", { name: "Send enquiry" }));

    expect(
      await screen.findByText("Your enquiry was not sent"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/thank you|has been sent/i),
    ).not.toBeInTheDocument();
  });
});
