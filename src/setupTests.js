// Setup Jest for testing
import "@testing-library/jest-dom";

// Mock window.FB (Facebook SDK)
global.FB = {
  init: jest.fn(),
  logout: jest.fn(),
  login: jest.fn(),
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock navigator.userAgent
Object.defineProperty(navigator, "userAgent", {
  value: "test-agent",
  writable: true,
});
