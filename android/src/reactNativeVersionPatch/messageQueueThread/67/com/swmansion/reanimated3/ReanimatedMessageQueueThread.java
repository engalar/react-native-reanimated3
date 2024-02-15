package com.swmansion.reanimated3;

import com.facebook.proguard.annotations.DoNotStrip;
import com.swmansion.reanimated3.ReanimatedMessageQueueThreadBase;

@DoNotStrip
public class ReanimatedMessageQueueThread extends ReanimatedMessageQueueThreadBase {
  @Override
  public void runOnQueue(Runnable runnable) {
    messageQueueThread.runOnQueue(runnable);
  }
}
