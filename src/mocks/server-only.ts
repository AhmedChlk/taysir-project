// Mock for 'server-only' in Vitest test environment.
// The real package throws an error when imported in non-server contexts.
// This mock allows server action tests to run in jsdom environment.
export {};
