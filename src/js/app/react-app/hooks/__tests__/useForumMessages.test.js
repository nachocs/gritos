import { act, renderHook, waitFor } from "@testing-library/react";
import useForumMessages from "../useForumMessages";
import { fetchForumMessages } from "../../utils/foroApi";
import { publishNewMessage } from "../../utils/messageEvents";

jest.mock("../../utils/foroApi", () => ({
  ...jest.requireActual("../../utils/foroApi"),
  fetchForumMessages: jest.fn(),
}));

// The socket layer is irrelevant here and would open a real connection.
jest.mock("../useSocket", () => ({
  __esModule: true,
  default: () => {},
}));

describe("useForumMessages — locally posted messages", () => {
  beforeEach(() => {
    fetchForumMessages.mockResolvedValue([
      { ID: "1", INDICE: "ciudadanos/1", comments: "existing", num: "1" },
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const newMessage = { ID: "2", INDICE: "ciudadanos/1", comments: "nuevo" };

  // Regression: a ciudadanos wall is *fetched* as `ciudadanos/<id>/` — the
  // trailing slash is what makes index.cgi list children — but FormShell posts
  // to and publishes under `ciudadanos/<id>`. A strict !== between the two
  // silently dropped every grito posted on a wall, so it only appeared after a
  // manual reload. Caught by an end-to-end post against the live API; no unit
  // test covered the two spellings meeting.
  it("accepts a message published without the wall's trailing slash", async () => {
    const { result } = renderHook(() => useForumMessages("ciudadanos/1/"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => publishNewMessage("ciudadanos/1", newMessage));

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data[0].comments).toBe("nuevo");
  });

  it("still accepts an exactly matching foro", async () => {
    const { result } = renderHook(() => useForumMessages("kingcrimson"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() =>
      publishNewMessage("kingcrimson", {
        ID: "2",
        INDICE: "kingcrimson",
        comments: "nuevo",
      }),
    );

    expect(result.current.data).toHaveLength(2);
  });

  it("ignores a message published for a different foro", async () => {
    const { result } = renderHook(() => useForumMessages("ciudadanos/1/"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => publishNewMessage("ciudadanos/2", newMessage));

    expect(result.current.data).toHaveLength(1);
  });
});
