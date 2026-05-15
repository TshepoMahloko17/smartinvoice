import type { Config } from "jest";

const config: Config = {
  preset: "jest-preset-angular",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/setup-jest.ts"],
  testMatch: ["**/src/**/*.spec.ts"],
  collectCoverageFrom: ["src/app/**/*.ts"],
  coverageReporters: ["text", "lcov"],
  transformIgnorePatterns: [
    "node_modules/(?!.*\\.mjs$|ng2-charts|chart\\.js|lodash-es|@angular|rxjs)",
  ],
};

export default config;
