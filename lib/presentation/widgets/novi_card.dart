import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import 'novi_pressable.dart';

/// NOVI — Standard Material 3 Tonal Card Container
/// Uses theme ColorScheme tokens (surfaceContainerLow) and 16dp squircle radius.
/// Integrates subtle tactile press compression and smooth state transitions.

class NoviCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final EdgeInsetsGeometry margin;
  final Color? backgroundColor;
  final Color? borderColor;
  final double? borderRadius;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;
  final bool hasBorder;
  final bool enableHaptics;

  const NoviCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(NoviSpacing.space16),
    this.margin = EdgeInsets.zero,
    this.backgroundColor,
    this.borderColor,
    this.borderRadius,
    this.onTap,
    this.onLongPress,
    this.hasBorder = false,
    this.enableHaptics = false,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final radius = borderRadius ?? NoviShapes.radiusCard;

    final bg = backgroundColor ?? colorScheme.surfaceContainer;
    final border = hasBorder
        ? BorderSide(color: borderColor ?? colorScheme.outline, width: 1)
        : BorderSide.none;

    final shape = RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(radius),
      side: border,
    );

    Widget cardBody = Padding(
      padding: margin,
      child: AnimatedContainer(
        duration: NoviMotion.duration(context, NoviMotion.feedback),
        curve: NoviMotion.easeInOut,
        decoration: ShapeDecoration(
          color: bg,
          shape: shape,
        ),
        clipBehavior: Clip.antiAlias,
        child: Padding(
          padding: padding,
          child: child,
        ),
      ),
    );

    if (onTap != null || onLongPress != null) {
      return NoviPressable(
        onTap: onTap,
        onLongPress: onLongPress,
        enableHaptics: enableHaptics,
        child: cardBody,
      );
    }

    return cardBody;
  }
}
