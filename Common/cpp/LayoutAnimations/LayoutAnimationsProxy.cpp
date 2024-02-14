#include "LayoutAnimationsProxy.h"
#include "NativeReanimatedModule.h"

namespace reanimated {

void LayoutAnimationsProxy::startAnimation(const int tag, const LayoutAnimationType type, Values values){
  printf("start aniamtion %f %f %f %f", values.x, values.y, values.width, values.height);
  nativeReanimatedModule_->uiScheduler_->scheduleOnUI([values, this, tag, type](){
    jsi::Runtime &rt = nativeReanimatedModule_->getUIRuntime();
    jsi::Object yogaValues(rt);
    yogaValues.setProperty(rt, "originX", values.x);
    yogaValues.setProperty(rt, "originY", values.y);
    yogaValues.setProperty(rt, "width", values.width);
    yogaValues.setProperty(rt, "height", values.height);
    nativeReanimatedModule_->layoutAnimationsManager().startLayoutAnimation(rt, tag, type, yogaValues);
  });
}

void LayoutAnimationsProxy::startLayoutLayoutAnimation(const int tag, Values currentValues, Values targetValues){
  nativeReanimatedModule_->uiScheduler_->scheduleOnUI([currentValues, targetValues, this, tag](){
    jsi::Runtime &rt = nativeReanimatedModule_->getUIRuntime();
    jsi::Object yogaValues(rt);
    yogaValues.setProperty(rt, "currentOriginX", currentValues.x);
    yogaValues.setProperty(rt, "currentOriginY", currentValues.y);
    yogaValues.setProperty(rt, "currentWidth", currentValues.width);
    yogaValues.setProperty(rt, "currentHeight", currentValues.height);
    yogaValues.setProperty(rt, "targetOriginX", targetValues.x);
    yogaValues.setProperty(rt, "targetOriginY", targetValues.y);
    yogaValues.setProperty(rt, "targetWidth", targetValues.width);
    yogaValues.setProperty(rt, "targetHeight", targetValues.height);
    nativeReanimatedModule_->layoutAnimationsManager().startLayoutAnimation(rt, tag, LayoutAnimationType::LAYOUT, yogaValues);
  });
}

}
