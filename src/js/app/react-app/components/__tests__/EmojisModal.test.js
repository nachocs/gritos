import { fireEvent, render, screen } from "@testing-library/react";
import EmojisModal from "../EmojisModal";

const emojiPicks = (container) => container.querySelectorAll(".emoji-pick");

describe("EmojisModal", () => {
  it("renders category tabs and emojis from the emoji dataset", () => {
    const { container } = render(<EmojisModal onSelect={() => {}} />);

    // "people" is the default category; hidden categories must not appear.
    expect(screen.getByTitle("people")).toBeInTheDocument();
    expect(screen.queryByTitle("modifier")).not.toBeInTheDocument();
    expect(screen.queryByTitle("regional")).not.toBeInTheDocument();

    // Emoji buttons render for the active category (proves the JSON loaded).
    expect(emojiPicks(container).length).toBeGreaterThan(0);
  });

  it("calls onSelect with the chosen emoji", () => {
    const onSelect = jest.fn();
    const { container } = render(<EmojisModal onSelect={onSelect} />);

    fireEvent.click(emojiPicks(container)[0]);

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0]).toHaveProperty("unicode");
  });

  it("switches the visible emojis when a different category tab is clicked", () => {
    const { container } = render(<EmojisModal onSelect={() => {}} />);

    const before = emojiPicks(container).length;
    fireEvent.click(screen.getByTitle("symbols"));
    const after = emojiPicks(container).length;

    // The grid re-renders for the new category (counts differ between them).
    expect(after).toBeGreaterThan(0);
    expect(after).not.toBe(before);
  });
});
