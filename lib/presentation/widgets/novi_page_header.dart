import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

/// NOVI — Consistent Page Header
/// Shared header component used across Focus, Rhythms, and Settings screens.
/// Provides a uniform title, optional subtitle, and trailing action slot.
class NoviPageHeader extends StatelessWidget {
  final Widget? leading;
  final String title;
  final String? subtitle;
  final List<Widget>? actions;
  final double bottomPadding;
  final EdgeInsetsGeometry? padding;
  final bool showBottomDivider;

  const NoviPageHeader({
    super.key,
    this.leading,
    required this.title,
    this.subtitle,
    this.actions,
    this.bottomPadding = NoviSpacing.space8,
    this.padding,
    this.showBottomDivider = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final textTheme = theme.textTheme;

    Widget headerContent = Padding(
      padding: padding ?? EdgeInsets.only(bottom: bottomPadding),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          if (leading != null) ...[
            leading!,
            const SizedBox(width: NoviSpacing.space8),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  title,
                  style: textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                    letterSpacing: -0.3,
                  ),
                ),
                if (subtitle != null) ...[
                  const SizedBox(height: NoviSpacing.space2),
                  Text(
                    subtitle!,
                    style: textTheme.bodySmall?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ],
            ),
          ),
          if (actions != null && actions!.isNotEmpty)
            Row(
              mainAxisSize: MainAxisSize.min,
              children: actions!,
            ),
        ],
      ),
    );

    if (showBottomDivider) {
      return Container(
        decoration: BoxDecoration(
          color: theme.scaffoldBackgroundColor,
          border: Border(
            bottom: BorderSide(
              color: colorScheme.outline,
              width: 1,
            ),
          ),
        ),
        child: headerContent,
      );
    }

    return headerContent;
  }
}
