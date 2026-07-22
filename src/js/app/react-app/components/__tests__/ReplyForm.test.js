import { render } from "@testing-library/react";
import { FormContext } from "../../contexts/FormContext";
import { UserContext } from "../../contexts/UserContext";
import ReplyForm from "../ReplyForm";

// Parity target: legacy baseMsgView.render() (`this.$('.mini-form')
// .html(this.formView.render().el)`) + msgView-t.html (`<div class="mini-form">`),
// i.e. formView's own root — className "formulario" — mounts *inside* a
// separate ".mini-form" wrapper, not merged onto the same element.
describe("ReplyForm", () => {
  const renderForm = () =>
    render(
      <UserContext.Provider
        value={{ user: { uid: "u1", ID: "1", INDICE: "ciudadanos" } }}
      >
        <FormContext.Provider value={{ submitMessage: () => Promise.resolve({}) }}>
          <ReplyForm
            parent={{ ID: "1", INDICE: "gritos/foroscomun" }}
            onPosted={() => {}}
          />
        </FormContext.Provider>
      </UserContext.Provider>,
    );

  // Regression: putting both classes on one <div> means main.less's
  // `.mini-form .formulario { padding: 0; .form-submit{display:none}; ... }`
  // block — which strips the 960px composer's 20px padding and repositions
  // the icons for a reply — never matches (it's a descendant selector). The
  // reply composer rendered with the full-size composer's padding, wrong
  // icon offsets, and a visible "Grita" button legacy hides here.
  it("nests .formulario inside .mini-form rather than merging the classes", () => {
    const { container } = renderForm();
    const miniForm = container.querySelector(".mini-form");
    expect(miniForm).not.toHaveClass("formulario");
    expect(miniForm.querySelector(":scope > .formulario")).toBeInTheDocument();
  });
});
