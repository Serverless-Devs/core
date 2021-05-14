/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/en/configuration.html
 */

export default {
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/test/loadComponent.test.ts'],
  testPathIgnorePatterns: ['./test/fixtures'],
  setupFilesAfterEnv: ['./jest.setup.ts'],
};
