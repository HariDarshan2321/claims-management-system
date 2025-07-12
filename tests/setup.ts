// Test setup and configuration

// Mock console methods to avoid noise in tests
const mockConsole = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};

// Setup test environment
beforeEach(() => {
  jest.clearAllMocks();
  // Reset console mocks
  Object.keys(mockConsole).forEach(key => {
    (mockConsole as any)[key].mockClear();
  });
});

// Export for use in tests
export { mockConsole };
