module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  testMatch: ["**/?(*.)+(spec|test).[t]s?(x)"],
  moduleFileExtensions: ["ts", "tsx", "js", "json", "node"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "/examples/"],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "/examples/",
    "<rootDir>/src/FireblocksXrpSdk.ts",
  ],
  roots: ["<rootDir>/src", "<rootDir>/tests"],
  bail: 1,
};
