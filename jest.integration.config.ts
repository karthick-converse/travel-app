import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",

  testMatch: ["**/src/tests/integration/**/*.spec.ts"],

  collectCoverage: true,
  coverageProvider: "v8",

  collectCoverageFrom: [
    "src/services/**/*.ts",
    "src/controllers/**/*.ts",
    "!src/**/index.ts"
  ],

  coverageDirectory: "coverage/integration",

  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/dist/"
  ],

  clearMocks: true
};

export default config;
