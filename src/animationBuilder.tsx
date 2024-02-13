'use strict';
import type {
  ILayoutAnimationBuilder,
  LayoutAnimationFunction,
  LayoutAnimationsValues,
} from './reanimated2/layoutReanimation';
import type { StyleProps } from './reanimated2/commonTypes';
import type { NestedArray } from './createAnimatedComponent/commonTypes';

const mockTargetValues: LayoutAnimationsValues = {
  targetOriginX: 0,
  targetOriginY: 0,
  targetWidth: 0,
  targetHeight: 0,
  targetGlobalOriginX: 0,
  targetGlobalOriginY: 0,
  targetBorderRadius: 0,
  windowWidth: 0,
  windowHeight: 0,
  currentOriginX: 0,
  currentOriginY: 0,
  currentWidth: 0,
  currentHeight: 0,
  currentGlobalOriginX: 0,
  currentGlobalOriginY: 0,
  currentBorderRadius: 0,
};

function getCommonProperties(
  layoutStyle: StyleProps,
  secondStyle: StyleProps | Array<StyleProps>
) {
  const secondStyleFlat = Array.isArray(secondStyle)
    ? secondStyle.flat()
    : [secondStyle];

  let commonKeys: Array<string> = [];
  secondStyleFlat.forEach((s) => {
    if ('initial' in s) {
      s = s.initial.value;
    }

    const commonStyleKeys = Object.keys(s).filter((key) => key in layoutStyle);
    commonKeys = commonKeys.concat(...commonStyleKeys);
  });
  return commonKeys;
}

function maybeReportOverwrittenProperties(
  layoutAnimationStyle: StyleProps,
  style: NestedArray<StyleProps>,
  displayName: string
) {
  const commonProperties = getCommonProperties(layoutAnimationStyle, style);

  if (commonProperties.length > 0) {
    console.warn(
      `[Reanimated] ${
        commonProperties.length === 1 ? 'Property' : 'Properties'
      } "${commonProperties.join(
        ', '
      )}" of ${displayName} may be overwritten by a layout animation. Please wrap your component with an animated view and apply the layout animation on the wrapper.`
    );
  }
}

export function maybeBuild(
  layoutAnimationOrBuilder:
    | ILayoutAnimationBuilder
    | LayoutAnimationFunction
    | Keyframe,
  style: NestedArray<StyleProps> | undefined,
  displayName: string
): LayoutAnimationFunction | Keyframe {
  const isAnimationBuilder = (
    value: ILayoutAnimationBuilder | LayoutAnimationFunction | Keyframe
  ): value is ILayoutAnimationBuilder =>
    'build' in layoutAnimationOrBuilder &&
    typeof layoutAnimationOrBuilder.build === 'function';

  if (isAnimationBuilder(layoutAnimationOrBuilder)) {
    const animationFactory = layoutAnimationOrBuilder.build();
    const layoutAnimation = animationFactory(mockTargetValues);

    if (__DEV__ && style) {
      maybeReportOverwrittenProperties(
        layoutAnimation.animations,
        style,
        displayName
      );
    }

    return layoutAnimationOrBuilder.build();
  } else {
    return layoutAnimationOrBuilder;
  }
}
