import "@testing-library/jest-dom";
import { server } from "./src/mocks/server";
import { afterAll, afterEach, beforeAll } from "vitest";

process.env.TEST_PASSWORD = "Str0ng!Pass";
process.env.TEST_PASSWORD_RESET = "N3wP@ssword!";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
