import 'package:flutter/material.dart';
import 'novi_live_timer.dart';

/// Legacy alias for NoviLiveTimer
class LiveTimerOverlay extends StatelessWidget {
  const LiveTimerOverlay({super.key});

  @override
  Widget build(BuildContext context) {
    return const NoviLiveTimer();
  }
}
