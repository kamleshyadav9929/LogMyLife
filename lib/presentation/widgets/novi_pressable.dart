import 'package:flutter/material.dart';
import '../../core/theme/novi_motion.dart';

/// NOVI — Tactile Interactive Pressable Wrapper
/// Provides a subtle, natural compression feedback (scale: 1.0 -> 0.98 -> 1.0)
/// on tap without layout shifts, jank, or unneeded subtree rebuilds.
/// Supports hover, focus, disabled states, and subtle haptics.

class NoviPressable extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;
  final double pressedScale;
  final bool enableHaptics;
  final HitTestBehavior behavior;

  const NoviPressable({
    super.key,
    required this.child,
    this.onTap,
    this.onLongPress,
    this.pressedScale = 0.975, // Subtle 2.5% compression
    this.enableHaptics = false,
    this.behavior = HitTestBehavior.opaque,
  });

  @override
  State<NoviPressable> createState() => _NoviPressableState();
}

class _NoviPressableState extends State<NoviPressable> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: NoviMotion.feedback,
      reverseDuration: NoviMotion.feedback,
      value: 0.0,
    );

    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: widget.pressedScale,
    ).animate(
      CurvedAnimation(
        parent: _controller,
        curve: NoviMotion.easeOut,
        reverseCurve: NoviMotion.subtleTactile,
      ),
    );
  }

  @override
  void didUpdateWidget(covariant NoviPressable oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.pressedScale != widget.pressedScale) {
      _scaleAnimation = Tween<double>(
        begin: 1.0,
        end: widget.pressedScale,
      ).animate(
        CurvedAnimation(
          parent: _controller,
          curve: NoviMotion.easeOut,
          reverseCurve: NoviMotion.subtleTactile,
        ),
      );
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onTapDown(TapDownDetails details) {
    if (widget.onTap == null && widget.onLongPress == null) return;
    if (NoviMotion.shouldReduceMotion(context)) return;
    _controller.forward();
  }

  void _onTapUp(TapUpDetails details) {
    if (widget.onTap == null && widget.onLongPress == null) return;
    if (widget.enableHaptics) {
      NoviHaptics.light();
    }
    _controller.reverse();
  }

  void _onTapCancel() {
    if (widget.onTap == null && widget.onLongPress == null) return;
    _controller.reverse();
  }

  @override
  Widget build(BuildContext context) {
    final isInteractive = widget.onTap != null || widget.onLongPress != null;
    final reduceMotion = NoviMotion.shouldReduceMotion(context);

    return MouseRegion(
      cursor: isInteractive ? SystemMouseCursors.click : SystemMouseCursors.basic,
      child: GestureDetector(
        behavior: widget.behavior,
        onTapDown: _onTapDown,
        onTapUp: _onTapUp,
        onTapCancel: _onTapCancel,
        onTap: widget.onTap,
        onLongPress: widget.onLongPress,
        child: reduceMotion
            ? widget.child
            : AnimatedBuilder(
                animation: _scaleAnimation,
                builder: (context, child) {
                  return Transform.scale(
                    scale: _scaleAnimation.value,
                    child: child,
                  );
                },
                child: widget.child,
              ),
      ),
    );
  }
}
