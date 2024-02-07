import { useRef } from 'react';
import {
  LockObject,
  Operation,
  TestCase,
  TestSuite,
  TestValue,
  TrackerCallCount,
} from './types';
import { TestComponent } from './TestComponent';
import {
  render,
  stopRecordingAnimationUpdates,
  unmockAnimationTimer,
} from './RuntimeTestsApi';
import {
  makeMutable,
  runOnUI,
  runOnJS,
  SharedValue,
} from 'react-native-reanimated';
import { RUNTIME_TEST_ERRORS, color, logInFrame } from './logMessageUtils';
import { createUpdatesContainer } from './UpdatesContainer';
import { Matchers } from './Matchers';

declare global {
  var mockedAnimationTimestamp: number | undefined;
  var originalRequestAnimationFrame:
    | ((callback: (timestamp: number) => void) => void)
    | undefined;
  var originalGetAnimationTimestamp: (() => number) | undefined;
  var originalUpdateProps: ((operations: Operation[]) => void) | undefined;
  var originalNotifyAboutProgress:
    | ((
        tag: number,
        value: Record<string, unknown>,
        isSharedTransition: boolean
      ) => void)
    | undefined;
  var originalFlushAnimationFrame:
    | ((frameTimestamp: number) => void)
    | undefined;
  var _getAnimationTimestamp: () => number;
  var __frameTimestamp: number | undefined;
  var _IS_FABRIC: boolean | undefined;
  var _updatePropsPaper: (operations: Operation[]) => void;
  var _updatePropsFabric: (operations: Operation[]) => void;
  var _notifyAboutProgress: (
    tag: number,
    value: Record<string, unknown>,
    isSharedTransition: boolean
  ) => void;
  function _obtainProp(componentHandler: unknown, propName: string): string;
  var __flushAnimationFrame: (frameTimestamp: number) => void;
}

let callTrackerRegistryJS: Record<string, number> = {};
const callTrackerRegistryUI = makeMutable<Record<string, number>>({});
function callTrackerJS(name: string) {
  if (!callTrackerRegistryJS[name]) {
    callTrackerRegistryJS[name] = 0;
  }
  callTrackerRegistryJS[name]++;
}

const notificationRegistry: Record<string, boolean> = {};
function notifyJS(name: string) {
  notificationRegistry[name] = true;
}

function assertMockedAnimationTimestamp(
  timestamp: number | undefined
): asserts timestamp is number {
  'worklet';
  if (timestamp === undefined) {
    throw new Error(RUNTIME_TEST_ERRORS.NO_MOCKED_TIMESTAMP);
  }
}

export class TestRunner {
  private _testSuites: TestSuite[] = [];
  private _currentTestSuite: TestSuite | null = null;
  private _currentTestCase: TestCase | null = null;
  private _renderHook: (component: any) => void = () => {};
  private _renderLock: LockObject = { lock: false };
  private _valueRegistry: Record<string, { value: unknown }> = {};
  private _wasRenderedNull: boolean = false;
  private _lockObject: LockObject = {
    lock: false,
  };

  public notify(name: string) {
    'worklet';
    if (_WORKLET) {
      runOnJS(notifyJS)(name);
    } else {
      notifyJS(name);
    }
  }

  public async waitForNotify(name: string) {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (notificationRegistry[name]) {
          clearInterval(interval);
          resolve(true);
        }
      }, 10);
    });
  }

  public configure(config: { render: (component: any) => void }) {
    this._renderHook = config.render;
    return this._renderLock;
  }

  public async render(component: any) {
    if (!component && this._wasRenderedNull) {
      return;
    }
    this._wasRenderedNull = !component;
    this._renderLock.lock = true;
    this._renderHook(component);
    return this.waitForPropertyValueChange(this._renderLock, 'lock');
  }

  public async clearRenderOutput() {
    return await this.render(null);
  }

  public describe(name: string, buildSuite: () => void) {
    this._testSuites.push({
      name,
      buildSuite,
      testCases: [],
    });
  }

  private _assertTestSuite(test: TestSuite | null): asserts test is TestSuite {
    if (!test) {
      throw new Error(RUNTIME_TEST_ERRORS.UNDEFINED_TEST_SUITE);
    }
  }

  private _assertTestCase(test: TestCase | null): asserts test is TestCase {
    if (!test) {
      throw new Error(RUNTIME_TEST_ERRORS.UNDEFINED_TEST_CASE);
    }
  }

  public test(name: string, testCase: () => void) {
    this._assertTestSuite(this._currentTestSuite);
    this._currentTestSuite.testCases.push({
      name,
      testCase,
      componentsRefs: {},
      callsRegistry: {},
      errors: [],
    });
  }

  public useTestRef(
    name: string
  ): React.MutableRefObject<React.Component | null> {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const ref = useRef(null);
    this._assertTestCase(this._currentTestCase);
    this._currentTestCase.componentsRefs[name] = ref;
    return ref;
  }

  public callTracker(name: string) {
    'worklet';
    if (_WORKLET) {
      if (!callTrackerRegistryUI.value[name]) {
        callTrackerRegistryUI.value[name] = 0;
      }
      callTrackerRegistryUI.value[name]++;
      callTrackerRegistryUI.value = { ...callTrackerRegistryUI.value };
    } else {
      callTrackerJS(name);
    }
  }

  public registerValue(name: string, value: { value: unknown }) {
    'worklet';
    this._valueRegistry[name] = value;
  }

  public async getRegisteredValue(name: string): Promise<TrackerCallCount> {
    const jsValue = this._valueRegistry[name].value as number;
    const sharedValue = this._valueRegistry[name] as SharedValue<number>;
    const valueContainer = makeMutable<number>(0);
    await this.runOnUiBlocking(() => {
      'worklet';
      valueContainer.value = sharedValue.value;
    });
    const uiValue = valueContainer.value;
    return {
      name,
      onJS: jsValue,
      onUI: uiValue,
    };
  }

  public getTrackerCallCount(name: string): TrackerCallCount {
    return {
      name,
      onJS: callTrackerRegistryJS[name] ?? 0,
      onUI: callTrackerRegistryUI.value[name] ?? 0,
    };
  }

  public getTestComponent(name: string): TestComponent {
    this._assertTestCase(this._currentTestCase);
    return new TestComponent(this._currentTestCase.componentsRefs[name]);
  }

  public async runTests() {
    const summary = {
      passed: 0,
      failed: 0,
      failedTests: [] as Array<string>,
      startTime: Date.now(),
      endTime: 0,
    };
    for (const testSuite of this._testSuites) {
      this._currentTestSuite = testSuite;

      logInFrame(`Running test suite: ${testSuite.name}`);

      testSuite.buildSuite();
      if (testSuite.beforeAll) {
        await testSuite.beforeAll();
      }

      for (const testCase of testSuite.testCases) {
        callTrackerRegistryUI.value = {};
        callTrackerRegistryJS = {};
        this._currentTestCase = testCase;

        if (testSuite.beforeEach) {
          await testSuite.beforeEach();
        }
        await testCase.testCase();
        if (testCase.errors.length > 0) {
          summary.failed++;
          summary.failedTests.push(testCase.name);
          console.log(`${color('✖', 'red')} ${testCase.name} `);
          for (const error of testCase.errors) {
            console.log(`\t${error}`);
          }
        } else {
          summary.passed++;
          console.log(`${color('✔', 'green')} ${testCase.name}`);
        }
        if (testSuite.afterEach) {
          await testSuite.afterEach();
        }
        this._currentTestCase = null;
        await render(null);
        await unmockAnimationTimer();
        await stopRecordingAnimationUpdates();
      }
      if (testSuite.afterAll) {
        await testSuite.afterAll();
      }
      console.log('\n\n');
      this._currentTestSuite = null;
    }
    this._testSuites = [];
    console.log('End of tests run 🏁');
    summary.endTime = Date.now();
    this.printSummary(summary);
  }

  public expect(currentValue: TestValue): Matchers {
    this._assertTestCase(this._currentTestCase);
    return new Matchers(currentValue, this._currentTestCase);
  }

  public beforeAll(job: () => void) {
    this._assertTestSuite(this._currentTestSuite);
    this._currentTestSuite.beforeAll = job;
  }

  public afterAll(job: () => void) {
    this._assertTestSuite(this._currentTestSuite);
    this._currentTestSuite.afterAll = job;
  }

  public beforeEach(job: () => void) {
    this._assertTestSuite(this._currentTestSuite);
    this._currentTestSuite.beforeEach = job;
  }

  public afterEach(job: () => void) {
    this._assertTestSuite(this._currentTestSuite);
    this._currentTestSuite.afterEach = job;
  }

  private waitForPropertyValueChange(
    targetObject: LockObject,
    targetProperty: 'lock',
    initialValue = true
  ) {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (targetObject[targetProperty] !== initialValue) {
          clearInterval(interval);
          resolve(targetObject[targetProperty]);
        }
      }, 10);
    });
  }

  async runOnUiBlocking(worklet: () => void) {
    const unlock = () => (this._lockObject.lock = false);
    this._lockObject.lock = true;
    runOnUI(() => {
      'worklet';
      worklet();
      runOnJS(unlock)();
    })();
    await this.waitForPropertyValueChange(this._lockObject, 'lock', true);
  }

  public async recordAnimationUpdates() {
    const updatesContainer = createUpdatesContainer(this);
    const recordAnimationUpdates = updatesContainer.pushAnimationUpdates;
    const recordLayoutAnimationUpdates =
      updatesContainer.pushLayoutAnimationUpdates;

    await this.runOnUiBlocking(() => {
      'worklet';
      const originalUpdateProps = global._IS_FABRIC
        ? global._updatePropsFabric
        : global._updatePropsPaper;
      global.originalUpdateProps = originalUpdateProps;

      const mockedUpdateProps = (operations: Operation[]) => {
        recordAnimationUpdates(operations);
        originalUpdateProps(operations);
      };

      if (global._IS_FABRIC) {
        global._updatePropsFabric = mockedUpdateProps;
      } else {
        global._updatePropsPaper = mockedUpdateProps;
      }

      const originalNotifyAboutProgress = global._notifyAboutProgress;
      global.originalNotifyAboutProgress = originalNotifyAboutProgress;
      global._notifyAboutProgress = (
        tag: number,
        value: Record<string, unknown>,
        isSharedTransition: boolean
      ) => {
        recordLayoutAnimationUpdates(tag, value);
        originalNotifyAboutProgress(tag, value, isSharedTransition);
      };
    });
    return updatesContainer;
  }

  public async stopRecordingAnimationUpdates() {
    await this.runOnUiBlocking(() => {
      'worklet';
      if (global.originalUpdateProps) {
        if (global._IS_FABRIC) {
          global._updatePropsFabric = global.originalUpdateProps;
        } else {
          global._updatePropsPaper = global.originalUpdateProps;
        }
        global.originalUpdateProps = undefined;
      }
      if (global.originalNotifyAboutProgress) {
        global._notifyAboutProgress = global.originalNotifyAboutProgress;
        global.originalNotifyAboutProgress = undefined;
      }
    });
  }

  public async mockAnimationTimer() {
    await this.runOnUiBlocking(() => {
      'worklet';
      global.mockedAnimationTimestamp = 0;
      global.originalGetAnimationTimestamp = global._getAnimationTimestamp;
      global._getAnimationTimestamp = () => {
        if (global.mockedAnimationTimestamp === undefined) {
          throw new Error("Animation timestamp wasn't initialized");
        }
        return global.mockedAnimationTimestamp;
      };

      let originalRequestAnimationFrame = global.requestAnimationFrame;
      global.originalRequestAnimationFrame = originalRequestAnimationFrame;
      (global as any).requestAnimationFrame = (callback: Function) => {
        originalRequestAnimationFrame(() => {
          callback(global._getAnimationTimestamp());
        });
      };

      global.originalFlushAnimationFrame = global.__flushAnimationFrame;
      global.__flushAnimationFrame = (_frameTimestamp: number) => {
        global.mockedAnimationTimestamp! += 16;
        global.__frameTimestamp = global.mockedAnimationTimestamp;
        global.originalFlushAnimationFrame!(global.mockedAnimationTimestamp!);
      };
    });
  }

  public async setAnimationTimestamp(timestamp: number) {
    await this.runOnUiBlocking(() => {
      'worklet';
      assertMockedAnimationTimestamp(global.mockedAnimationTimestamp);
      global.mockedAnimationTimestamp = timestamp;
    });
  }

  public async advanceAnimationByTime(time: number) {
    await this.runOnUiBlocking(() => {
      'worklet';
      assertMockedAnimationTimestamp(global.mockedAnimationTimestamp);
      global.mockedAnimationTimestamp += time;
    });
  }

  public async advanceAnimationByFrames(frameCount: number) {
    await this.runOnUiBlocking(() => {
      'worklet';
      assertMockedAnimationTimestamp(global.mockedAnimationTimestamp);
      global.mockedAnimationTimestamp += frameCount * 16;
    });
  }

  public async unmockAnimationTimer() {
    await this.runOnUiBlocking(() => {
      'worklet';
      if (global.originalGetAnimationTimestamp) {
        global._getAnimationTimestamp = global.originalGetAnimationTimestamp;
        global.originalGetAnimationTimestamp = undefined;
      }
      if (global.originalRequestAnimationFrame) {
        (global.requestAnimationFrame as any) =
          global.originalRequestAnimationFrame;
        global.originalRequestAnimationFrame = undefined;
      }
      if (global.originalFlushAnimationFrame) {
        global.__flushAnimationFrame = global.originalFlushAnimationFrame;
        global.originalFlushAnimationFrame = undefined;
      }
      if (global.mockedAnimationTimestamp) {
        global.mockedAnimationTimestamp = undefined;
      }
    });
  }

  public wait(delay: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, delay);
    });
  }

  private printSummary(summary: {
    passed: number;
    failed: number;
    failedTests: Array<string>;
    startTime: number;
    endTime: number;
  }) {
    console.log('\n');
    console.log(
      `🧮 Tests summary: ${color(summary.passed, 'green')} passed, ${color(
        summary.failed,
        'red'
      )} failed`
    );
    console.log(
      `⏱️  Total time: ${
        Math.round(((summary.endTime - summary.startTime) / 1000) * 100) / 100
      }s`
    );
    if (summary.failed > 0) {
      console.log('❌ Failed tests:');
      for (const failedTest of summary.failedTests) {
        console.log(`\t- ${failedTest}`);
      }
    } else {
      console.log('✅ All tests passed!');
    }
    console.log('\n');
  }
}
