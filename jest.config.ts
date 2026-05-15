import type { Config } from "jest";

const config: Config = {
  preset: "jest-preset-angular",
  setupFilesAfterEnv: ["<rootDir>/setup-jest.ts"],
  testMatch: ["**/src/**/*.spec.ts"],
  collectCoverageFrom: ["src/app/**/*.ts"],
  coverageReporters: ["text", "lcov"],
};

export default config;