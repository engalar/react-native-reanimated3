import { AnimatedStyle, StyleProps } from 'react-native-reanimated';

type CallTrucker = {
  UICallsCount: number;
  JSCallsCount: number;
};

type ShadowNodeWrapper = {
  __hostObjectShadowNodeWrapper: never;
};

export type TrackerCallCount = {
  name: string;
  JS: number;
  UI: number;
};

export type TestCase = {
  name: string;
  testCase: () => void;
  componentsRefs: Record<string, React.MutableRefObject<any>>;
  callsRegistry: Record<string, CallTrucker>;
  errors: string[];
};

export type TestSuite = {
  name: string;
  buildSuite: () => void;
  testCases: TestCase[];
  beforeAll?: () => void;
  afterAll?: () => void;
  beforeEach?: () => void;
  afterEach?: () => void;
};

export enum ComparisonMode {
  STRING = 'STRING',
  DISTANCE = 'DISTANCE',
  NUMBER = 'NUMBER',
  COLOR = 'COLOR',
}

export type LockObject = { lock: boolean };

export interface Operation {
  tag?: number;
  shadowNodeWrapper?: ShadowNodeWrapper;
  name: string;
  updates: StyleProps | AnimatedStyle<any>;
}

export type TestValue =
  | TrackerCallCount
  | string
  | Array<unknown>
  | number
  | bigint
  | Record<string, unknown>;
