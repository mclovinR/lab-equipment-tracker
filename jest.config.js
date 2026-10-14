/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  // Measure only application code; server.ts just starts the HTTP server.
  collectCoverageFrom: ["src/**/*.ts", "!src/server.ts"]
};
