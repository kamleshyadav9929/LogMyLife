import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import 'novi_pressable.dart';

/// NOVI — M3 Pixel Search Header Bar
/// Replicates the exact pill-shaped search bar with leading search icon,
/// placeholder "Search for apps & activities...", trailing mic icon,
/// notification bell with badge counter, and scenic avatar circle.

class NoviSearchHeader extends StatelessWidget {
  final VoidCallback? onSearchTap;
  final VoidCallback? onVoiceTap;
  final VoidCallback? onNotificationTap;
  final VoidCallback? onProfileTap;
  final int notificationCount;
  final String hintText;
  final String? avatarAsset;

  const NoviSearchHeader({
    super.key,
    this.onSearchTap,
    this.onVoiceTap,
    this.onNotificationTap,
    this.onProfileTap,
    this.notificationCount = 4,
    this.hintText = 'Search for apps & activities...',
    this.avatarAsset = 'assets/scenic_avatar.png',
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final textTheme = theme.textTheme;

    final searchPillBg = colorScheme.surfaceContainer;
    final searchIconColor = colorScheme.onSurface;
    final hintColor = colorScheme.onSurfaceVariant;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        // (1) Expanded Pill-Shaped Search Container
        Expanded(
          child: NoviPressable(
            onTap: onSearchTap,
            child: Container(
              height: 52,
              padding: const EdgeInsets.symmetric(horizontal: NoviSpacing.space16),
              decoration: BoxDecoration(
                color: searchPillBg,
                borderRadius: BorderRadius.circular(NoviShapes.radiusPill),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.search_rounded,
                    size: 22,
                    color: searchIconColor,
                  ),
                  const SizedBox(width: NoviSpacing.space12),
                  Expanded(
                    child: Text(
                      hintText,
                      style: textTheme.bodyMedium?.copyWith(
                        color: hintColor,
                        fontSize: 15,
                        fontWeight: FontWeight.w400,
                        letterSpacing: -0.1,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: NoviSpacing.space8),
                  NoviPressable(
                    onTap: () {
                      NoviHaptics.selection();
                      if (onVoiceTap != null) {
                        onVoiceTap!();
                      } else if (onSearchTap != null) {
                        onSearchTap!();
                      }
                    },
                    child: Padding(
                      padding: const EdgeInsets.all(4.0),
                      child: Icon(
                        Icons.mic_none_rounded,
                        size: 22,
                        color: searchIconColor,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),

        const SizedBox(width: NoviSpacing.space14),

        // (2) Notification Bell with Accent Circular Badge
        NoviPressable(
          onTap: onNotificationTap,
          child: SizedBox(
            width: 40,
            height: 40,
            child: Stack(
              alignment: Alignment.center,
              clipBehavior: Clip.none,
              children: [
                Icon(
                  Icons.notifications_none_rounded,
                  size: 26,
                  color: colorScheme.onSurface,
                ),
                if (notificationCount > 0)
                  Positioned(
                    top: 2,
                    right: 2,
                    child: Container(
                      padding: const EdgeInsets.all(2),
                      constraints: const BoxConstraints(
                        minWidth: 18,
                        minHeight: 18,
                      ),
                      decoration: BoxDecoration(
                        color: colorScheme.primary,
                        shape: BoxShape.circle,
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        '$notificationCount',
                        style: TextStyle(
                          color: colorScheme.onPrimary,
                          fontSize: 10.5,
                          fontWeight: FontWeight.w700,
                          height: 1.0,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),

        const SizedBox(width: NoviSpacing.space10),

        // (3) Scenic Nature Landscape Avatar Circle
        NoviPressable(
          onTap: onProfileTap,
          child: Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: colorScheme.outlineVariant.withValues(alpha: 0.4),
                width: 1.2,
              ),
            ),
            child: ClipOval(
              child: Image.asset(
                avatarAsset ?? 'assets/scenic_avatar.png',
                width: 40,
                height: 40,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  // Fallback: proper person icon matching semantic purpose
                  return Container(
                    color: colorScheme.primaryContainer,
                    alignment: Alignment.center,
                    child: Icon(
                      Icons.person_rounded,
                      size: 22,
                      color: colorScheme.onPrimaryContainer,
                    ),
                  );
                },
              ),
            ),
          ),
        ),
      ],
    );
  }
}
