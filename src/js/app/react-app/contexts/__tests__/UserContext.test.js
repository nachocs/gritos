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
});
