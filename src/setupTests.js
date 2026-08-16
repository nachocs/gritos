// Setup Jest for testing
import "@testing-library/jest-dom";
import { TextDecoder, TextEncoder } from "util";

// jsdom doesn't provide these; react-router-dom's dependency chain needs them.
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

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
