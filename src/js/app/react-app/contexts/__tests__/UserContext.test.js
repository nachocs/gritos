import { act, renderHook, waitFor } from "@testing-library/react";
import { useUser } from "../../hooks/useContexts";
import { UserProvider } from "../UserContext";

describe("UserContext", () => {
  it("should provide user context", () => {
    const wrapper = ({ children }) => <UserProvider>{children}</UserProvider>;
    const { result } = renderHook(() => useUser(), { wrapper });

    expect(result.current).toHaveProperty("user");
    expect(result.current).toHaveProperty("login");
    expect(result.current).toHaveProperty("logout");
    expect(result.current).toHaveProperty("updateUser");
  });

  it("should settle with no user when no login cookie exists", async () => {
    const wrapper = ({ children }) => <UserProvider>{children}</UserProvider>;
    const { result } = renderHook(() => useUser(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.user).toBeNull();
  });

  it("should clear user when logout is called", () => {
    const wrapper = ({ children }) => <UserProvider>{children}</UserProvider>;
    const { result } = renderHook(() => useUser(), { wrapper });

    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
  });

  it("should update user data", () => {
    const wrapper = ({ children }) => <UserProvider>{children}</UserProvider>;
    const { result } = renderHook(() => useUser(), { wrapper });

    act(() => {
      result.current.updateUser({ alias_principal: "testuser" });
    });

    // After updateUser, the user should have the new data
    expect(result.current.user?.alias_principal).toBe("testuser");
  });

  // Legacy `userModel.save(key, value)` is a Backbone set-then-PUT: it sends
  // the *whole* model (uid included) to index.cgi?<INDICE>/<ID>. `updateUser`
  // alone only touched local state, so a chosen dreamy reverted on reload.
  describe("saveUser", () => {
    const originalFetch = global.fetch;
    const wrapper = ({ children }) => <UserProvider>{children}</UserProvider>;

    const okResponse = () => ({
      ok: true,
      headers: { get: () => "application/json; charset=utf-8" },
      arrayBuffer: async () =>
        new TextEncoder().encode(JSON.stringify({ status: "ok" })).buffer,
    });

    const seedUser = (result) =>
      act(() => {
        result.current.updateUser({
          INDICE: "ciudadanos",
          ID: "1",
          uid: "test-uid",
          alias_principal: "Nacho",
          dreamy_principal: "/old.gif",
        });
      });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it("PUTs the whole merged model to index.cgi", async () => {
      global.fetch = jest.fn(() => Promise.resolve(okResponse()));
      const { result } = renderHook(() => useUser(), { wrapper });
      seedUser(result);

      await act(async () => {
        await result.current.saveUser({ dreamy_principal: "/new.gif" });
      });

      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toContain("index.cgi?ciudadanos/1");
      expect(options.method).toBe("PUT");

      const body = JSON.parse(options.body);
      expect(body.dreamy_principal).toBe("/new.gif");
      // The rest of the model rides along, as Backbone's toJSON() did.
      expect(body.uid).toBe("test-uid");
      expect(body.alias_principal).toBe("Nacho");
      expect(result.current.user.dreamy_principal).toBe("/new.gif");
    });

    it("rolls back the optimistic update when the server rejects", async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          headers: { get: () => "application/json" },
          arrayBuffer: async () => new ArrayBuffer(0),
        }),
      );
      const { result } = renderHook(() => useUser(), { wrapper });
      seedUser(result);

      await act(async () => {
        await expect(
          result.current.saveUser({ dreamy_principal: "/new.gif" }),
        ).rejects.toThrow();
      });

      expect(result.current.user.dreamy_principal).toBe("/old.gif");
    });

    it("refuses to save when there is no logged-in user", async () => {
      global.fetch = jest.fn();
      const { result } = renderHook(() => useUser(), { wrapper });

      await act(async () => {
        await expect(
          result.current.saveUser({ dreamy_principal: "/new.gif" }),
        ).rejects.toThrow(/logged-in/);
      });
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
