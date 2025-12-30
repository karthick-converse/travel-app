import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",

  testMatch: ["**/src/tests/unit/**/*.spec.ts"],

  clearMocks: true,

  // ✅ Coverage config (UNIT ONLY)
  collectCoverage: true,
  collectCoverageFrom: ["src/services/**/*.ts", "src/controllers/**/*.ts"],
  coverageDirectory: "coverage/unit",
  coverageReporters: ["text", "lcov"],
};

export default config;
