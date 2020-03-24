module.exports = {
  roots: ["<rootDir>/src"],
  transform: {
    "^.+\\.tsx?$": "ts-jest"
  },
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  snapshotSerializers: ["enzyme-to-json/serializer"]
};
// module.exports = {
//   // The root of your source code, typically /src
//   // `<rootDir>` is a token Jest substitutes
//   // roots: ["<rootDir>"],

//   // Jest transformations -- this adds support for TypeScript
//   // using ts-jest
//   transform: {
//     "^.+\\.tsx?$": "ts-jest",
//     // "^.+\\.(js|jsx|ts|tsx)$": "<rootDir>/node_modules/ts-jest/jestpreprocessor.js"
//   },

//   // Runs special logic, such as cleaning up components
//   // when using React Testing Library and adds special
//   // extended assertions to Jest
//   setupFilesAfterEnv: [
//     "<rootDir>/node_modules/@testing-library/react/dont-cleanup-after-each",
//     "<rootDir>/node_modules/@testing-library/jest-dom/extend-expect"
//   ],

//   // Test spec file resolution pattern
//   // Matches parent folder `__tests__` and filename
//   // should contain `test` or `spec`.
//   // testRegex: "(*|(\\.|/)(test|spec))\\.tsx?$",

//   // Module file extensions for importing
//   moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
//   modulePathIgnorePatterns: ["packages/" /*, "/node_modules/" */],
//   // transformIgnorePatterns: ["/node_modules/"]
//   "testPathIgnorePatterns": [
//     "<rootDir>/(build|docs|node_modules)/"
//   ],
// };
