// Jest globals typed from @jest/globals, for tsconfig.jest.json only (GUARD-10, D-24).
import type {
  describe as d,
  it as i,
  test as t,
  expect as e,
  jest as j,
  beforeAll as ba,
  beforeEach as be,
  afterAll as aa,
  afterEach as ae,
} from '@jest/globals';
import type { ClassLike, FunctionLike, UnknownFunction } from 'jest-mock';
import '@testing-library/jest-dom/jest-globals'; // augments @jest/expect Matchers (jest-dom 7)

declare global {
  const describe: typeof d;
  const it: typeof i;
  const test: typeof t;
  const expect: typeof e;
  const jest: typeof j;
  // A types-only namespace merges with the const above, so `jest.Mock<...>` works in type positions.
  namespace jest {
    type Mock<T extends FunctionLike = UnknownFunction> = j.Mock<T>;
    type Mocked<T extends object> = j.Mocked<T>;
    type MockedFunction<T extends FunctionLike> = j.MockedFunction<T>;
    type Spied<T extends ClassLike | FunctionLike> = j.Spied<T>;
    type SpiedFunction<T extends FunctionLike> = j.SpiedFunction<T>;
  }
  const beforeAll: typeof ba;
  const beforeEach: typeof be;
  const afterAll: typeof aa;
  const afterEach: typeof ae;
}

export {};
