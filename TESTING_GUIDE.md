# Testing Guide for Gritos React App

This document provides guidelines for writing and running tests in the Gritos project.

## Setup

### Running Tests

```bash
# Run tests once
npm test

# Run tests in watch mode (re-run on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Testing Stack

- **Jest**: Test runner and assertion library
- **React Testing Library**: React component testing utilities
- **@testing-library/jest-dom**: Custom Jest matchers for DOM assertions

## File Structure

Tests should be colocated with the code they test:

```
src/js/app/react-app/
├── components/
│   ├── LoginStatus.jsx
│   ├── __tests__/
│   │   └── LoginStatus.test.js
│   ├── FormShell.jsx
│   └── __tests__/
│       └── FormShell.test.js
├── contexts/
│   ├── UserContext.jsx
│   └── __tests__/
│       └── UserContext.test.js
└── hooks/
    ├── useContexts.js
    └── __tests__/
        └── useContexts.test.js
```

## Testing Best Practices

### 1. Testing Components

Always render components with their required providers:

```javascript
import { render, screen } from "@testing-library/react";
import { UserProvider } from "../../contexts/UserContext";
import LoginStatus from "../LoginStatus";

describe("LoginStatus", () => {
  const renderWithProviders = (component) => {
    return render(<UserProvider>{component}</UserProvider>);
  };

  it("should render login button", () => {
    renderWithProviders(<LoginStatus />);
    expect(screen.getByText("Log In")).toBeInTheDocument();
  });
});
```

### 2. Testing Hooks

Use `renderHook` for testing custom hooks:

```javascript
import { renderHook, act } from "@testing-library/react";
import { useUser } from "../hooks/useContexts";
import { UserProvider } from "../contexts/UserContext";

describe("useUser Hook", () => {
  const wrapper = ({ children }) => <UserProvider>{children}</UserProvider>;

  it("should provide user context", () => {
    const { result } = renderHook(() => useUser(), { wrapper });

    expect(result.current).toHaveProperty("user");
    expect(result.current).toHaveProperty("login");
  });

  it("should update user when updateUser is called", () => {
    const { result } = renderHook(() => useUser(), { wrapper });

    act(() => {
      result.current.updateUser({ alias_principal: "newuser" });
    });

    expect(result.current.user?.alias_principal).toBe("newuser");
  });
});
```

### 3. Testing Context Providers

```javascript
import { renderHook } from "@testing-library/react";
import { GlobalProvider, GlobalContext } from "../contexts/GlobalContext";
import { useGlobal } from "../hooks/useContexts";

describe("GlobalContext", () => {
  const wrapper = ({ children }) => <GlobalProvider>{children}</GlobalProvider>;

  it("should provide initial state", () => {
    const { result } = renderHook(() => useGlobal(), { wrapper });

    expect(result.current.currentForo).toBe("foroscomun");
    expect(result.current.isGallery).toBe(false);
  });

  it("should update foro state", () => {
    const { result } = renderHook(() => useGlobal(), { wrapper });

    act(() => {
      result.current.changeForo("nuevoforo", null, false, false);
    });

    expect(result.current.currentForo).toBe("nuevoforo");
  });
});
```

### 4. Testing Form Interactions

```javascript
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import FormShell from "../FormShell";
import { BrowserRouter } from "react-router-dom";
import { UserProvider } from "../../contexts/UserContext";
import { FormProvider } from "../../contexts/FormContext";

describe("FormShell", () => {
  const renderWithProviders = (component) => {
    return render(
      <BrowserRouter>
        <UserProvider>
          <FormProvider>{component}</FormProvider>
        </UserProvider>
      </BrowserRouter>,
    );
  };

  it("should submit form with valid data", async () => {
    renderWithProviders(<FormShell />);

    const textarea = screen.getByPlaceholderText(/Escribe tu mensaje/i);
    fireEvent.change(textarea, { target: { value: "Test message" } });

    const submitButton = screen.getByRole("button", { name: /Grita/i });
    fireEvent.click(submitButton);

    // Wait for submission to complete
    await waitFor(() => {
      expect(screen.queryByText(/Enviando/i)).not.toBeInTheDocument();
    });
  });

  it("should show error when textarea is empty", () => {
    renderWithProviders(<FormShell />);

    const submitButton = screen.getByRole("button", { name: /Grita/i });
    fireEvent.click(submitButton);

    // Button should be disabled if form is empty
    expect(submitButton).toBeDisabled();
  });
});
```

### 5. Testing API Calls

Use `jest.mock()` to mock API calls:

```javascript
import { renderHook, act } from "@testing-library/react";
import { useUser } from "../hooks/useContexts";
import { UserProvider } from "../contexts/UserContext";

jest.mock("../../util/endpoints", () => ({
  apiUrl: "http://test-api.com/",
}));

describe("useUser Hook - API Calls", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const wrapper = ({ children }) => <UserProvider>{children}</UserProvider>;

  it("should fetch user on login", async () => {
    global.fetch.mockResolvedValueOnce({
      json: async () => ({
        status: "ok",
        uid: "123",
        user: { id: "123", alias_principal: "testuser" },
      }),
    });

    const { result } = renderHook(() => useUser(), { wrapper });

    act(() => {
      result.current.login("123");
    });

    await waitFor(() => {
      expect(result.current.user?.id).toBe("123");
    });
  });
});
```

## Common Test Utilities

### screen queries

- `screen.getByText()` - Find element by text content
- `screen.getByLabelText()` - Find input by label
- `screen.getByRole()` - Find element by role (button, link, etc)
- `screen.getByPlaceholderText()` - Find input by placeholder
- `screen.queryBy*()` - Like getBy but returns null instead of throwing
- `screen.findBy*()` - Async version, waits for element to appear

### fireEvent vs userEvent

```javascript
import { fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// fireEvent - simulates low-level events
fireEvent.click(button);
fireEvent.change(input, { target: { value: "test" } });

// userEvent - simulates user interactions (more realistic)
await userEvent.click(button);
await userEvent.type(input, "test");
```

### waitFor

```javascript
import { waitFor } from "@testing-library/react";

await waitFor(() => {
  expect(screen.getByText("Success!")).toBeInTheDocument();
});
```

## Debugging Tests

### Using screen.debug()

```javascript
import { render, screen } from "@testing-library/react";

it("should render", () => {
  render(<Component />);
  screen.debug(); // Prints the current DOM
});
```

### Using screen.logTestingPlaygroundURL()

```javascript
it("should render", () => {
  render(<Component />);
  screen.logTestingPlaygroundURL(); // Prints a URL to debug in Testing Playground
});
```

## Running Specific Tests

```bash
# Run tests matching a pattern
npm test -- LoginStatus

# Run only a specific test file
npm test -- src/js/app/react-app/components/__tests__/LoginStatus.test.js

# Run tests for a specific component
npm test -- contexts/UserContext
```

## Coverage Reports

```bash
npm run test:coverage
```

This generates a coverage report showing:

- Line coverage
- Branch coverage
- Function coverage
- Statement coverage

Coverage reports are generated in the `coverage/` directory.

## Continuous Integration

Add to your CI pipeline:

```bash
npm run test:coverage
```

This ensures all tests pass and coverage thresholds are met before deployment.

## Tips & Tricks

1. **Test behavior, not implementation**: Test what the component does, not how it does it
2. **Use meaningful test names**: Describe what the test verifies
3. **Keep tests focused**: Each test should verify one thing
4. **Mock external dependencies**: Mock API calls, local storage, etc.
5. **Test user interactions**: Use `userEvent` for realistic interactions
6. **Avoid testing implementation details**: Don't rely on internal state or methods

## Resources

- [React Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Docs](https://jestjs.io/docs/getting-started)
- [Testing Playground](https://testing-playground.com/) - Interactive testing sandbox
