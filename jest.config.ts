
import type {Config} from 'jest';
import { createJsWithTsPreset } from 'ts-jest'
const config : Config ={
  preset: "ts-jest",
  modulePaths: ["."],
  testEnvironment: "node",
  clearMocks: true,
  restoreMocks: true,
  globalSetup: "<rootDir>/tests/jest-global-setup.ts",
  globalTeardown: "<rootDir>/tests/jest-global-teardown.ts",
  ...createJsWithTsPreset({
    tsconfig: 'tests/tsconfig.json',
  }),
};
export default config;
