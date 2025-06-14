module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  modulePaths: ["."],
  clearMocks: true,
  restoreMocks: true,
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tests/tsconfig.json',
      },
    ],
  },
};
