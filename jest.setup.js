// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock browser APIs for jsdom (not implemented in jsdom)
// Guard for tests running in node environment (e.g., API route tests)
if (typeof window !== 'undefined') {
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
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

  // Mock IntersectionObserver
  class MockIntersectionObserver {
    constructor(callback) {
      this.callback = callback;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    value: MockIntersectionObserver,
  });

  // Also set on global for direct references
  if (typeof global.IntersectionObserver === 'undefined') {
    global.IntersectionObserver = MockIntersectionObserver;
  }
}
