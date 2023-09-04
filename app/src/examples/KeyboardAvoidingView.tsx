import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  KeyboardAvoidingView as RNKeyboardAvoidingView,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Animated, {
  KeyboardState,
  measure,
  runOnJS,
  runOnUI,
  useAnimatedKeyboard,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  useWorkletCallback,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function getRandomData(numberOfElements: number) {
  return Array.from(Array(numberOfElements).keys()).map((number) => {
    const likeSynonims = ['enjoy', 'love', 'am interested in'];
    const hobbies = [
      'reading books',
      'going for long walks in the park',
      'try new foods',
      'travel to different places around the world',
      'spending time with my family and friends',
      'going on outdoor adventures',
      'learning new languages',
      'exploring different cultures',
    ];
    const firstNames = ['Emily', 'Alexander', 'Olivia', 'William', 'Sophia'];
    const lastNames = ['Johnson', 'Lee', 'Hernandez', 'Kim', 'Chen', 'Park'];

    const name = firstNames[number % firstNames.length];
    const lastName = lastNames[number % lastNames.length];
    return {
      text: `I ${likeSynonims[number % likeSynonims.length]} ${
        hobbies[number % hobbies.length]
      } and  ${hobbies[(3 * number + 1) % hobbies.length]}`,
      avatar: `https://i.pravatar.cc/150?img=${number % 7}`,
      name: `${name} ${lastName}`,
      username: `${name.toLocaleLowerCase()}${lastName.toLocaleLowerCase()[0]}`,
    };
  });
}

const DATA = getRandomData(20);

type MachineStates = {
  [state: string]: {
    [action: string]: string;
  };
};

function useWorkletStateMachine(
  stateMachine: MachineStates,
  initialState: string,
  enableDebug = false
) {
  const currentState = useSharedValue<{
    previous: string | null;
    current: string;
  }>({
    previous: null,
    current: initialState,
  });

  const log = useWorkletCallback((message: string, params?: object) => {
    if (!enableDebug) {
      return;
    }

    console.log(`[StateMachine] ${message}`, params);
  }, []);

  const transitionWorklet = useWorkletCallback((action: string) => {
    if (!action) {
      throw new Error('state machine action is required');
    }

    const state = currentState.value;

    log(`Current STATE: ${state.current}`);
    log(`Next ACTION: ${action}`);

    const nextMachine = stateMachine[state.current];

    if (!nextMachine) {
      log(`No next machine found for state: ${state.current}`);
      return;
    }

    const nextState = nextMachine[action];

    if (typeof nextState === 'undefined') {
      log(`No next state found for action: ${action}`);
      return;
    }

    currentState.value = {
      previous: state.current,
      current: nextState,
    };
  });

  const resetWorklet = useWorkletCallback(() => {
    log('RESET STATE MACHINE');
    currentState.value = {
      previous: null,
      current: initialState,
    };
  }, [initialState]);

  const reset = useCallback(() => {
    runOnUI(resetWorklet)();
  }, [resetWorklet]);

  const transition = useCallback(
    (action: string) => {
      runOnUI(transitionWorklet)(action);
    },
    [transitionWorklet]
  );

  return {
    currentState,
    transitionWorklet,
    transition,
    reset,
    resetWorklet,
  };
}

const States = {
  idle: {
    openKeyboard: 'keyboardOpen',
    openPopover: 'popoverOpen',
  },
  keyboardOpen: {
    openPopover: 'keyboardPopoverOpen',
    closeKeyboard: 'idle',
  },
  keyboardPopoverOpen: {
    closePopover: 'keyboardClosingPopover',
  },
  keyboardClosingPopover: {
    endTransition: 'keyboardOpen',
  },
  popoverOpen: {
    closePopover: 'popoverClosing',
  },
  popoverClosing: {
    endTransition: 'idle',
  },
};

const config = {
  mass: 3,
  stiffness: 1000,
  damping: 500,
};

const TALL_POPOVER_HEIGHT = 500;
const SHORT_POPOVER_HEIGHT = 200;

function ListItem({
  item,
  onLongPress,
}: {
  item: any;
  onLongPress: (ref: React.RefObject<Animated.View>, height: number) => void;
}) {
  const ref = useAnimatedRef<Animated.View>();

  return (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => onLongPress(ref, SHORT_POPOVER_HEIGHT)}
      onLongPress={() => onLongPress(ref, TALL_POPOVER_HEIGHT)}>
      <Image source={{ uri: item.avatar + '?u=1' }} style={styles.avatar} />
      <Animated.View ref={ref} style={styles.item}>
        <Text style={styles.title}>
          {item.name} · <Text style={styles.username}>@{item.username}</Text>
        </Text>
        <Text>{item.text}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

function KeyboardSpace({
  children,
  currentElementState,
  machine,
  ...props
}: ScrollViewProps & {
  machine: ReturnType<typeof useWorkletStateMachine>;
  currentElementState: Animated.SharedValue<{
    fy: number;
    height: number;
    popoverHeight: number;
  }>;
}) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  const keyboard = useAnimatedKeyboard();
  const [syncLocalWorkletState] = useState({
    shouldRunAnimation: false,
    lastHeight: 0,
    lastState: KeyboardState.CLOSED,
  });

  useAnimatedReaction(
    () => {
      return keyboard.state.value;
    },
    (lastState) => {
      if (lastState === syncLocalWorkletState.lastState) {
        return;
      }

      syncLocalWorkletState.lastState = lastState;

      if (lastState === KeyboardState.OPEN) {
        machine.transitionWorklet('openKeyboard');
      } else if (lastState === KeyboardState.CLOSED) {
        machine.transitionWorklet('closeKeyboard');
      }
    },
    []
  );

  const translateY = useDerivedValue(() => {
    const keyboardHeight =
      keyboard.height.value === 0 ? 0 : keyboard.height.value - insets.bottom;
    // sometimes we need to know the last keyboard height
    if (
      keyboard.state.value === KeyboardState.OPEN &&
      keyboard.height.value !== 0
    ) {
      syncLocalWorkletState.lastHeight = keyboardHeight;
    }

    const lastKeyboardValue = syncLocalWorkletState.lastHeight;

    const invertedKeyboardHeight =
      keyboard.state.value === KeyboardState.CLOSED ? lastKeyboardValue : 0;

    const { current, previous } = machine.currentState.value;

    if (current === 'idle') {
      return 0;
    }

    const { fy, height, popoverHeight } = currentElementState.value;

    const elementOffset =
      fy + height + insets.top - insets.bottom - (windowHeight - popoverHeight);

    switch (current) {
      case 'keyboardOpen': {
        if (previous === 'keyboardClosingPopover' && elementOffset > 0) {
          return withSequence(
            withTiming(elementOffset + invertedKeyboardHeight, {
              duration: 0,
            }),
            withSpring(0, config, () => {
              machine.transitionWorklet('endTransition');
            })
          );
        }

        return 0;
      }

      case 'keyboardPopoverOpen': {
        if (keyboard.state.value === KeyboardState.OPEN) {
          return 0;
        }

        const nextOffset = elementOffset + lastKeyboardValue;

        if (
          keyboard.state.value === KeyboardState.CLOSING &&
          elementOffset < 0
        ) {
          console.log(lastKeyboardValue - keyboard.height.value);
          return Math.max(lastKeyboardValue - keyboard.height.value, 0);
        } else if (
          keyboard.state.value === KeyboardState.CLOSED &&
          nextOffset > invertedKeyboardHeight
        ) {
          return withSequence(
            withTiming(lastKeyboardValue, {
              duration: 0,
            }),
            withSpring(nextOffset < 0 ? 0 : nextOffset, config)
          );
        }

        return lastKeyboardValue;
      }

      case 'keyboardClosingPopover': {
        if (elementOffset < 0) {
          machine.transitionWorklet('endTransition');
          return invertedKeyboardHeight;
        }

        return withSequence(
          withTiming(elementOffset + lastKeyboardValue, {
            duration: 0,
          }),
          withTiming(
            elementOffset,
            {
              duration: 0,
            },
            () => {
              machine.transitionWorklet('endTransition');
            }
          )
        );
      }

      case 'popoverOpen': {
        if (elementOffset < 0) {
          return 0;
        }

        return withSpring(elementOffset, config);
      }

      case 'popoverClosing': {
        return withSpring(0, config, () => {
          machine.transitionWorklet('endTransition');
        });
      }

      default:
        return 0;
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: translateY.value,
        },
      ],
    };
  });

  return (
    <ScrollView {...props}>
      <Animated.View style={[{ flex: 1 }, animatedStyle]}>
        {children}
      </Animated.View>
    </ScrollView>
  );
}

export default function KeyboardAvoidingViewExample(): React.ReactElement {
  const machine = useWorkletStateMachine(States, 'idle');

  const currentElementState = useSharedValue({
    fy: 0,
    height: 0,
    popoverHeight: 0,
  });

  const insets = useSafeAreaInsets();
  const [useReanimated, setUseReanimated] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const showModal = useCallback(
    (ref: React.RefObject<Animated.View>, height: number) => {
      runOnUI(() => {
        'worklet';

        const measurements = measure(ref);

        currentElementState.value = {
          fy: measurements.pageY,
          height: measurements.height,
          popoverHeight: height,
        };

        machine.transitionWorklet('openPopover');

        runOnJS(setIsModalVisible)(true);
      })();
    },
    [machine, currentElementState]
  );

  const hideModal = useCallback(() => {
    machine.transition('closePopover');
    setIsModalVisible(false);
  }, [machine]);

  const renderScrollComponent = useCallback(
    (props: ScrollViewProps) => {
      return (
        <KeyboardSpace
          {...props}
          machine={machine}
          currentElementState={currentElementState}
        />
      );
    },
    [machine, currentElementState]
  );

  const KeyboardAvoidingView = useReanimated
    ? // @ts-ignore
      Animated.KeyboardAvoidingView
    : RNKeyboardAvoidingView;

  const popoverHeightStyle = useAnimatedStyle(() => ({
    height: currentElementState.value.popoverHeight,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text>Use Reanimated KeyboardAvoidingView</Text>
        <Switch
          value={useReanimated}
          onChange={(evt) => setUseReanimated(evt.nativeEvent.value)}
        />
      </View>

      <FlatList
        inverted
        renderScrollComponent={renderScrollComponent}
        keyboardShouldPersistTaps="always"
        data={DATA}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <ListItem onLongPress={showModal} item={item} />
        )}
      />

      <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={48 + 10}>
        <View
          style={[
            styles.inputContainer,
            {
              marginBottom: insets.bottom - 20,
            },
          ]}>
          <TextInput
            placeholder="Focus me, press or long press on messages"
            style={styles.textInput}
            autoCorrect
          />
        </View>
      </KeyboardAvoidingView>

      <Modal
        style={styles.sheetContainer}
        visible={isModalVisible}
        transparent
        animationType="slide">
        <Pressable style={styles.sheetBackdrop} onPress={hideModal} />

        <Animated.View style={[styles.sheet, popoverHeightStyle]}>
          <Text style={styles.sheetText}>
            This modal should cover the keyboard, but the latest message should
            be either in the same place or animate to position above the modal.
          </Text>
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(29, 28, 29, 0.13)',
  },
  itemContainer: {
    flexDirection: 'row',
    marginHorizontal: 8,
    paddingHorizontal: 8,
    marginVertical: 4,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 25,
    marginRight: 10,
  },
  item: {
    flex: 1,
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    textAlignVertical: 'center',
    marginBottom: 2,
  },
  username: {
    fontSize: 11,
    fontWeight: '800',
  },
  inputContainer: {
    height: 70,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(29, 28, 29, 0.13)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  textInput: {
    borderColor: 'rgba(29, 28, 29, 0.13)',
    borderStyle: 'solid',
    height: 48,
    borderRadius: 20,
    marginHorizontal: 10,
    paddingHorizontal: 10,
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  sheet: {
    borderColor: 'rgba(29, 28, 29, 0.13)',
    borderWidth: 1,
    backgroundColor: 'white',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  sheetText: {
    fontSize: 20,
  },
});
