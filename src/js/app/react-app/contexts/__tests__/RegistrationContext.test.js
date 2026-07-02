import { render, screen } from "@testing-library/react";
import { useRegistration } from "../../hooks/useContexts";
import { RegistrationProvider } from "../RegistrationContext";

// Mock the endpoints module
jest.mock("../../../util/endpoints", () => ({
  apiUrl: "http://localhost/api/",
}));

describe("RegistrationContext", () => {
  const TestComponent = () => {
    const { registering, error, register, clearError } = useRegistration();
    return (
      <div>
        <div data-testid="status">{registering ? "Registering" : "Ready"}</div>
        {error && <div data-testid="error">{error}</div>}
        <button
          data-testid="register-btn"
          onClick={() =>
            register("testuser", "test@example.com", "password123")
          }
        >
          Register
        </button>
        <button data-testid="clear-error-btn" onClick={clearError}>
          Clear Error
        </button>
      </div>
    );
  };

  it("provides registration context with initial state", () => {
    render(
      <RegistrationProvider>
        <TestComponent />
      </RegistrationProvider>,
    );
    expect(screen.getByTestId("status")).toHaveTextContent("Ready");
    expect(screen.queryByTestId("error")).not.toBeInTheDocument();
  });
});
