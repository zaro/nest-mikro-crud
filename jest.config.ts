
import type {Config} from 'jest';
import { createJsWithTsPreset } from 'ts-jest'
const config : Config ={
  preset: "ts-jest",
  modulePaths: ["."],
  testEnvironment: "node",
  clearMocks: true,
  restoreMocks: true,
  ...createJsWithTsPreset({
    tsconfig: 'tests/tsconfig.json',
  }),
};
export default config;
