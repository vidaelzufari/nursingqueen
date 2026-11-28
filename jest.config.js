// Date fixtures use UTC; set this before Jest starts workers on any developer machine.
process.env.TZ = "UTC";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const expoPreset = require("jest-expo/jest-preset");
const expoTransform = expoPreset.transform["\\.[jt]sx?$"];

module.exports = {
  preset: "jest-expo",
  // Feature flags must remain runtime values in tests, rather than being
  // replaced with the shell environment before each scenario sets them.
  transform: {
    ...expoPreset.transform,
    "\\.[jt]sx?$": ["babel-jest", { ...expoTransform[1], caller: { ...expoTransform[1].caller, preserveEnvVars: true } }],
  },
  testPathIgnorePatterns: ["/node_modules/", "/content-studio/"],
  setupFiles: ["./jest.setup.ts"],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  collectCoverageFrom: [
    "src/domain/**/*.ts",
    "!src/domain/**/*.d.ts",
  ],
  coverageThreshold: {
    "src/domain/": {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90,
    },
  },
};
