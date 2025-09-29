// Jest setup for e2e tests

// Set global test timeout
jest.setTimeout(30000);

// Clean up any hanging processes
process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.log('Uncaught Exception:', error);
});

// Force exit after tests complete
afterAll(async () => {
  // Give a small delay for cleanup
  await new Promise((resolve) => setTimeout(resolve, 100));
});