import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",

  testMatch: ["**/src/tests/e2e/**/*.spec.ts"],

  collectCoverage: true,
  collectCoverageFrom: [ "src/controllers/**/*.ts"],
  coverageDirectory: "coverage/e2e",

  clearMocks: true,
};

export default config;
