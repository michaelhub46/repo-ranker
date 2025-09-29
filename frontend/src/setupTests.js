// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.alert
global.alert = jest.fn();

// Mock console.error to reduce noise in tests
const originalError = console.error;
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation((message) => {
    // Only suppress expected errors, let real errors through
    if (
      message.includes('Warning: ReactDOM.render is deprecated') ||
      message.includes('Warning: An invalid form control') ||
      message.includes('API Error:') ||
      message.includes('Health Check Error:')
    ) {
      return;
    }
    originalError(message);
  });
});

afterEach(() => {
  console.error.mockRestore();
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  
  disconnect() {
    return null;
  }
  
  observe() {
    return null;
  }
  
  unobserve() {
    return null;
  }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  
  disconnect() {
    return null;
  }
  
  observe() {
    return null;
  }
  
  unobserve() {
    return null;
  }
};

// Global test timeout
jest.setTimeout(10000);
