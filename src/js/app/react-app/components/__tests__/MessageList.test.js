import { render } from "@testing-library/react";
import MessageList from "../MessageList";

// Legacy shows nothing at all for an empty foro/wall — no placeholder text.
describe("MessageList — empty state", () => {
  it("renders nothing when there are no messages", () => {
    const { container } = render(
      <MessageList messages={[]} currentForo="foroscomun" head={null} />,
    );
    expect(container).toBeEmptyDOMElement();
    expect(container.textContent).not.toMatch(/no hay mensajes/i);
  });
});
