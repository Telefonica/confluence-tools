// SPDX-FileCopyrightText: 2024 Telefónica Innovación Digital
// SPDX-License-Identifier: MIT

module.exports = {
  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // An array of glob patterns indicating a set of files for which coverage information should be collected
  collectCoverageFrom: ["src/**/*.ts", "!src/index.ts"],

  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",

  // An object that configures minimum threshold enforcement for coverage results
  coverageThreshold: {
    global: {
      //branches: 100,
      //functions: 100,
      //lines: 100,
      //statements: 100,
    },
  },

  // The glob patterns Jest uses to detect test files
  testMatch: [
    "<rootDir>/test/unit/specs/*.spec.ts",
    "<rootDir>/test/unit/specs/**/*.test.ts",
  ],

  // The test environment that will be used for testing
  testEnvironment: "node",

  reporters: [
    "default",
    [
      "jest-sonar",
      { outputDirectory: "coverage", outputName: "TEST-junit-report.xml" },
    ],
  ],
};
