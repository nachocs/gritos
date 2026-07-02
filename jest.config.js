module.exports = {
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.js", "**/?(*.)+(spec|test).js"],
  moduleNameMapper: {
    "\\.(css|less)$": "identity-obj-proxy",
    "\\.(gif|ttf|eot|svg|png|jpg|jpeg)$": "<rootDir>/src/__mocks__/fileMock.js",
  },
  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },
  collectCoverageFrom: [
    "src/js/app/react-app/**/*.{js,jsx}",
    "!src/js/app/react-app/**/*.test.{js,jsx}",
    "!src/js/app/react-app/index.js",
  ],
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.js"],
  moduleDirectories: ["node_modules", "src"],
};
