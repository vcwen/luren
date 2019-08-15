module.exports = {
  roots: ['<rootDir>/src/', '<rootDir>/test/'],
  automock: false,
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  testRegex: 'test/.*\\.(test|spec)\\.(tsx?)$',
  testEnvironment: 'node',
  collectCoverage: true,
  coveragePathIgnorePatterns: ['/node_modules/', '/test/'],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json']
}
