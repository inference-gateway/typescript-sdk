/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest'],
  },
  testMatch: ['**/tests/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js'],
  roots: ['<rootDir>/tests'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Coverage configuration: report a baseline (text, lcov, json-summary, html) on
  // `npm run test:coverage`. No threshold is enforced yet — see issue #30.
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'json-summary', 'html'],
  collectCoverageFrom: ['src/**/*.ts', '!src/types/generated/**'],
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/', '/src/types/generated/'],
};
