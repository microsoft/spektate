module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: ["/node_modules/", "/packages/"],
  transform: {
    "^.+\\.tsx?$": "babel-jest"
  }
};
