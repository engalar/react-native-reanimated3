package com.swmansion.reanimated3.nativeProxy;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.swmansion.reanimated3.NodesManager;

@DoNotStrip
public class AnimationFrameCallback implements NodesManager.OnAnimationFrame {

  @DoNotStrip private final HybridData mHybridData;

  @DoNotStrip
  private AnimationFrameCallback(HybridData hybridData) {
    mHybridData = hybridData;
  }

  @Override
  public native void onAnimationFrame(double timestampMs);
}
