module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/test/utils/'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
}; 