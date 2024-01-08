/* eslint-disable no-inline-styles/no-inline-styles */
import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
  runOnUI,
} from 'react-native-reanimated';
import {
  describe,
  test,
  expect,
  render,
  useTestRef,
  getTestComponent,
  wait,
  mockAnimationTimer,
  recordAnimationUpdates,
  callTracker,
  getTrackerCallCount,
  registerValue,
  getRegisteredValue,
  Presets,
  callTrackerFn,
  notify,
  waitForNotify
} from '../ReanimatedRuntimeTestsRunner/RuntimeTestsApi';
import { Snapshots } from './snapshots/Animations.snapshot';
import { ComparisonMode } from '../ReanimatedRuntimeTestsRunner/types';

const AnimatedComponent = () => {
  const widthSV = useSharedValue(0);
  const ref = useTestRef('AnimatedComponent');

  const style = useAnimatedStyle(() => {
    callTracker('useAnimatedStyleTracker');
    return {
      width: withTiming(
        widthSV.value,
        { duration: 500 },
        callTrackerFn('withTimingTracker')
      ),
    };
  });

  useEffect(() => {
    widthSV.value = 100;
  }, [widthSV]);

  return (
    <View
      style={{ flex: 1, flexDirection: 'column', backgroundColor: 'beige' }}>
      <Animated.View
        ref={ref}
        style={[
          {
            width: 0,
            height: 80,
            backgroundColor: 'chocolate',
            margin: 30,
          },
          style,
        ]}
      />
    </View>
  );
};

const AnimatedComponent2 = () => {
  const widthSV = useSharedValue(0);
  const ref = useTestRef('AnimatedComponent');

  const style = useAnimatedStyle(() => {
    return {
      width: withTiming(
        widthSV.value,
        { duration: 500 },
      ),
    };
  });

  
  useEffect(() => {
    widthSV.value = 100;

    setTimeout(() => {
      notify('notifyJS');
      runOnUI(() => {
        notify('notifyUI');
      })();
    }, 1000);

    
  }, [widthSV]);

  return (
    <View
      style={{ flex: 1, flexDirection: 'column', backgroundColor: 'beige' }}>
      <Animated.View
        ref={ref}
        style={[
          {
            width: 0,
            height: 80,
            backgroundColor: 'chocolate',
            margin: 30,
          },
          style,
        ]}
      />
    </View>
  );
};

const SharedValueComponent = ({ initialValue }: { initialValue: any }) => {
  const sharedValue = useSharedValue(initialValue);
  registerValue('sv', sharedValue);
  return <Text>{sharedValue.value}</Text>;
};

const TOP = 41;
const LEFT = 42;
const MARGIN = 10;
const LayoutAnimation = () => {
  const ref = useTestRef('AnimatedComponent');

  return (
    <View
      style={{ flex: 1, flexDirection: 'column', backgroundColor: 'beige' }}>
      <Animated.View
        ref={ref}
        entering={FadeIn}
        style={{
          top: TOP,
          left: LEFT,
          width: 50,
          height: 50,
          backgroundColor: 'chocolate',
          margin: MARGIN,
        }}
      />
    </View>
  );
};

describe('Tests of animations', () => {

  test('withTiming - expect error', async () => {
    await render(<AnimatedComponent />);
    const component = getTestComponent('AnimatedComponent');
    await wait(600);
    expect(await component.getAnimatedStyle('width')).toBe(
      '123',
      ComparisonMode.DISTANCE
    );
  });

  test('withTiming - expect pass', async () => {
    await render(<AnimatedComponent />);
    const component = getTestComponent('AnimatedComponent');
    await wait(600);
    expect(await component.getAnimatedStyle('width')).toBe(
      '100',
      ComparisonMode.DISTANCE
    );
  });

  test('withTiming - expect callback call', async () => {
    await render(<AnimatedComponent />);
    await wait(600);
    expect(getTrackerCallCount('useAnimatedStyleTracker')).toBeCalled(3);

    expect(getTrackerCallCount('useAnimatedStyleTracker')).toBeCalledUI(1);
    expect(getTrackerCallCount('useAnimatedStyleTracker')).toBeCalledJS(2);

    expect(getTrackerCallCount('withTimingTracker')).toBeCalledUI(1);
    expect(getTrackerCallCount('withTimingTracker')).toBeCalledJS(0);
  });

  test('withTiming - test number preset', async () => {
    for (const preset of Presets.numbers) {
      await render(null);
      await render(<SharedValueComponent initialValue={preset} />);
      const sharedValue = await getRegisteredValue('sv');
      expect(sharedValue.onJS).toBe(preset, ComparisonMode.NUMBER);
      expect(sharedValue.onUI).toBe(preset, ComparisonMode.NUMBER);
    }
  });

  test('layoutAnimation - top & left', async () => {
    await render(<LayoutAnimation />);
    const component = getTestComponent('AnimatedComponent');
    await wait(600);
    expect(await component.getAnimatedStyle('top')).toBe(
      `${TOP + MARGIN}`,
      ComparisonMode.DISTANCE
    );
    expect(await component.getAnimatedStyle('left')).toBe(
      `${LEFT + MARGIN}`,
      ComparisonMode.DISTANCE
    );
  });

  test('layoutAnimation - opacity', async () => {
    await render(<LayoutAnimation />);
    const component = getTestComponent('AnimatedComponent');
    await wait(600);
    expect(await component.getAnimatedStyle('opacity')).toBe(
      '1',
      ComparisonMode.NUMBER
    );
  });

  test('withTiming - match snapshot', async () => {
    await mockAnimationTimer();
    const updatesContainer = await recordAnimationUpdates();
    await render(<AnimatedComponent />);
    await wait(1000);
    expect(updatesContainer.getUpdates()).toMatchSnapshot(Snapshots.animation3);
    expect(updatesContainer.getUpdates()).toMatchNativeSnapshots(await updatesContainer.getNativeSnapshots());
  });

  test('layoutAnimation - entering', async () => {
    await mockAnimationTimer();
    const updatesContainer = await recordAnimationUpdates();
    await render(<LayoutAnimation />);
    await wait(600);
    expect(updatesContainer.getUpdates()).toMatchSnapshot(Snapshots.layoutAnimation);
  });

  test('withTiming - notify', async () => {
    await render(<AnimatedComponent2 />);
    const component = getTestComponent('AnimatedComponent');
    await waitForNotify('notifyJS');
    await waitForNotify('notifyUI');
    expect(await component.getAnimatedStyle('width')).toBe(
      '100',
      ComparisonMode.DISTANCE
    );
  });

});