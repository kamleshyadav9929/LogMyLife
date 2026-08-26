import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// NOVI — Centralized Motion & Morph Animation Engine
/// Google Pixel / Modern Android-inspired calming motion language:
/// Fast (100–300ms) → Soft → Organic → Predictable → Premium.
///
/// Ensures UI elements transform naturally from one state to another rather
/// than abruptly disappearing and being replaced.
/// Built-in respect for accessibility and reduced motion preferences.

class NoviMotion {
  // --- Motion Durations ---
  /// Immediate action (0ms)
  static const Duration instant = Duration.zero;

  /// Micro transition (100ms) — Icon morphs, checkmark draws, subtle micro-state toggles
  static const Duration micro = Duration(milliseconds: 100);

  /// Tactile feedback (140ms) — Button taps, tactile scale releases
  static const Duration feedback = Duration(milliseconds: 140);

  /// Fast transition (180ms) — Chip selection, small badges, toggle switches
  static const Duration fast = Duration(milliseconds: 180);
  static const Duration shortDuration = fast; // Compatibility alias

  /// Standard transition (250ms) — Cards, tab navigation, list state changes, button morphs
  static const Duration standard = Duration(milliseconds: 250);

  /// Medium transition (320ms) — Bottom sheets, date morphs, radial gauges
  static const Duration medium = Duration(milliseconds: 320);

  /// Expansion transition (400ms) — Shared surface growth, creation modal morphs
  static const Duration expand = Duration(milliseconds: 400);

  /// Complex transition (420ms) — Comprehensive screen transformations, long charts
  static const Duration slow = Duration(milliseconds: 420);
  static const Duration longDuration = slow; // Compatibility alias

  // --- Natural Easing Curves ---
  /// Natural ease out for elements entering the view or expanding
  static const Curve easeOut = Curves.easeOutCubic;

  /// Natural ease in for elements leaving the view
  static const Curve easeIn = Curves.easeInCubic;

  /// Smooth ease in-out for state transitions, morphs, and geometry resizing
  static const Curve easeInOut = Curves.easeInOutCubic;

  /// Gentle organic curve with soft deceleration
  static const Curve gentle = Curves.easeOutCubic;

  /// Material 3 / Pixel emphasized curve for primary hero & navigation elements
  static const Curve emphasized = Curves.fastEaseInToSlowEaseOut;

  /// Emphasized decelerate for incoming sheets, dialogs, and morph surfaces
  static const Curve emphasizedDecelerate = Curves.easeOutQuart;

  /// Restrained tactile spring curve (no exaggerated bounce)
  static const Curve subtleTactile = Curves.easeOutBack;

  /// Gentle spring-like settle for natural morphing
  static const Curve subtleSpring = Curves.easeOutCubic;

  // --- Accessibility & Reduced Motion Support ---
  /// Checks if reduced motion is requested by the OS or user accessibility settings
  static bool shouldReduceMotion(BuildContext context) {
    final mediaQuery = MediaQuery.maybeOf(context);
    if (mediaQuery == null) return false;
    return mediaQuery.accessibleNavigation || mediaQuery.disableAnimations;
  }

  /// Returns a duration adjusted for the user's reduced motion settings
  static Duration duration(BuildContext context, Duration normalDuration) {
    if (shouldReduceMotion(context)) {
      return Duration.zero;
    }
    return normalDuration;
  }

  /// Returns an appropriate curve respecting reduced motion settings
  static Curve curve(BuildContext context, Curve normalCurve) {
    if (shouldReduceMotion(context)) {
      return Curves.linear;
    }
    return normalCurve;
  }
}

/// Purposeful, subtle tactile haptic feedback helpers
class NoviHaptics {
  /// Subtle tick on selection change (e.g. date strip, chip, tab switch)
  static void selection() {
    HapticFeedback.selectionClick();
  }

  /// Very light impact on button tap or toggle
  static void light() {
    HapticFeedback.lightImpact();
  }

  /// Medium impact on significant state trigger (e.g. focus start, session save)
  static void medium() {
    HapticFeedback.mediumImpact();
  }

  /// Restrained success feedback pattern
  static void success() {
    HapticFeedback.lightImpact();
  }
}

/// NOVI Morph Icon — Short, organic transition between two icons
/// (play <-> pause, plus <-> close, check <-> uncheck, expand <-> collapse)
class NoviMorphIcon extends StatelessWidget {
  final IconData icon;
  final Color? color;
  final double size;
  final Duration duration;

  const NoviMorphIcon({
    super.key,
    required this.icon,
    this.color,
    this.size = 20,
    this.duration = NoviMotion.fast,
  });

  @override
  Widget build(BuildContext context) {
    final reduceMotion = NoviMotion.shouldReduceMotion(context);
    final animDuration = reduceMotion ? Duration.zero : duration;

    return AnimatedSwitcher(
      duration: animDuration,
      switchInCurve: NoviMotion.easeOut,
      switchOutCurve: NoviMotion.easeIn,
      transitionBuilder: (child, animation) {
        return ScaleTransition(
          scale: Tween<double>(begin: 0.82, end: 1.0).animate(animation),
          child: FadeTransition(
            opacity: animation,
            child: RotationTransition(
              turns: Tween<double>(begin: -0.05, end: 0.0).animate(animation),
              child: child,
            ),
          ),
        );
      },
      child: Icon(
        icon,
        key: ValueKey<IconData>(icon),
        color: color,
        size: size,
      ),
    );
  }
}

/// NOVI Animated Counter — Smooth numerical interpolation without text jumping
class NoviAnimatedCounter extends StatelessWidget {
  final double value;
  final String prefix;
  final String suffix;
  final int fractionDigits;
  final TextStyle? style;
  final Duration duration;
  final Curve curve;

  const NoviAnimatedCounter({
    super.key,
    required this.value,
    this.prefix = '',
    this.suffix = '',
    this.fractionDigits = 0,
    this.style,
    this.duration = NoviMotion.medium,
    this.curve = NoviMotion.easeOut,
  });

  @override
  Widget build(BuildContext context) {
    final reduceMotion = NoviMotion.shouldReduceMotion(context);
    final animDuration = reduceMotion ? Duration.zero : duration;

    return TweenAnimationBuilder<double>(
      tween: Tween<double>(begin: value, end: value),
      duration: animDuration,
      curve: curve,
      builder: (context, animValue, child) {
        final formattedNumber = fractionDigits > 0
            ? animValue.toStringAsFixed(fractionDigits)
            : animValue.round().toString();

        return Text(
          '$prefix$formattedNumber$suffix',
          style: (style ?? const TextStyle()).copyWith(
            fontFeatures: const [FontFeature.tabularFigures()],
          ),
        );
      },
    );
  }
}

/// NOVI Sliding Pill Selector — Smooth sliding indicator between items (chips/tabs)
class NoviSlidingPillSelector<T> extends StatelessWidget {
  final List<T> items;
  final T selectedItem;
  final ValueChanged<T> onSelected;
  final Widget Function(BuildContext context, T item, bool isSelected) itemBuilder;
  final Color? backgroundColor;
  final Color? indicatorColor;
  final EdgeInsetsGeometry padding;
  final double borderRadius;
  final double height;

  const NoviSlidingPillSelector({
    super.key,
    required this.items,
    required this.selectedItem,
    required this.onSelected,
    required this.itemBuilder,
    this.backgroundColor,
    this.indicatorColor,
    this.padding = const EdgeInsets.all(4),
    this.borderRadius = 16,
    this.height = 42,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final selectedIndex = items.indexOf(selectedItem).clamp(0, items.length - 1);
    final reduceMotion = NoviMotion.shouldReduceMotion(context);
    final animDuration = reduceMotion ? Duration.zero : NoviMotion.fast;

    return Container(
      height: height,
      padding: padding,
      decoration: BoxDecoration(
        color: backgroundColor ?? colorScheme.surfaceContainerLow,
        borderRadius: BorderRadius.circular(borderRadius),
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final totalWidth = constraints.maxWidth;
          final itemWidth = items.isNotEmpty ? totalWidth / items.length : 0.0;

          return Stack(
            children: [
              // Smooth sliding indicator pill
              AnimatedPositioned(
                duration: animDuration,
                curve: NoviMotion.emphasizedDecelerate,
                left: selectedIndex * itemWidth,
                top: 0,
                bottom: 0,
                width: itemWidth,
                child: Container(
                  decoration: BoxDecoration(
                    color: indicatorColor ?? colorScheme.primaryContainer,
                    borderRadius: BorderRadius.circular(borderRadius - 2),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.04),
                        blurRadius: 4,
                        offset: const Offset(0, 1),
                      ),
                    ],
                  ),
                ),
              ),
              // Items row
              Row(
                children: items.map((item) {
                  final isSelected = item == selectedItem;
                  return Expanded(
                    child: GestureDetector(
                      behavior: HitTestBehavior.opaque,
                      onTap: () {
                        if (!isSelected) {
                          NoviHaptics.selection();
                          onSelected(item);
                        }
                      },
                      child: Center(
                        child: itemBuilder(context, item, isSelected),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ],
          );
        },
      ),
    );
  }
}

/// NOVI Morph Button — State transforming button (Idle -> Active/Timer -> Success)
enum NoviMorphButtonState { idle, active, success }

class NoviMorphButton extends StatelessWidget {
  final NoviMorphButtonState state;
  final VoidCallback onPressed;
  final Widget idleChild;
  final Widget activeChild;
  final Widget? successChild;
  final Color? backgroundColor;
  final Color? activeColor;
  final Color? successColor;
  final Color? foregroundColor;
  final EdgeInsetsGeometry padding;
  final double height;
  final double? width;

  const NoviMorphButton({
    super.key,
    required this.state,
    required this.onPressed,
    required this.idleChild,
    required this.activeChild,
    this.successChild,
    this.backgroundColor,
    this.activeColor,
    this.successColor,
    this.foregroundColor,
    this.padding = const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
    this.height = 48,
    this.width,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final reduceMotion = NoviMotion.shouldReduceMotion(context);
    final animDuration = reduceMotion ? Duration.zero : NoviMotion.standard;

    Color bg;
    Color fg;

    switch (state) {
      case NoviMorphButtonState.active:
        bg = activeColor ?? colorScheme.primary;
        fg = foregroundColor ?? colorScheme.onPrimary;
        break;
      case NoviMorphButtonState.success:
        bg = successColor ?? colorScheme.primaryContainer;
        fg = colorScheme.onPrimaryContainer;
        break;
      case NoviMorphButtonState.idle:
        bg = backgroundColor ?? colorScheme.primary;
        fg = foregroundColor ?? colorScheme.onPrimary;
        break;
    }

    Widget content;
    switch (state) {
      case NoviMorphButtonState.active:
        content = activeChild;
        break;
      case NoviMorphButtonState.success:
        content = successChild ??
            const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.check_rounded, size: 18),
                SizedBox(width: 6),
                Text('Completed', style: TextStyle(fontWeight: FontWeight.w600)),
              ],
            );
        break;
      case NoviMorphButtonState.idle:
        content = idleChild;
        break;
    }

    return AnimatedContainer(
      duration: animDuration,
      curve: NoviMotion.easeInOut,
      height: height,
      width: width,
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(height / 2),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(height / 2),
          onTap: () {
            NoviHaptics.medium();
            onPressed();
          },
          child: Padding(
            padding: padding,
            child: Center(
              child: DefaultTextStyle(
                style: TextStyle(
                  color: fg,
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
                child: IconTheme(
                  data: IconThemeData(color: fg, size: 18),
                  child: AnimatedSwitcher(
                    duration: animDuration,
                    switchInCurve: NoviMotion.easeOut,
                    switchOutCurve: NoviMotion.easeIn,
                    child: KeyedSubtree(
                      key: ValueKey<NoviMorphButtonState>(state),
                      child: content,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// NOVI Expandable Card — Continuous surface expansion without subtree rebuilds
class NoviMorphExpandableCard extends StatefulWidget {
  final Widget header;
  final Widget expandedContent;
  final bool isExpanded;
  final VoidCallback onToggle;
  final Color? backgroundColor;
  final EdgeInsetsGeometry padding;
  final double borderRadius;

  const NoviMorphExpandableCard({
    super.key,
    required this.header,
    required this.expandedContent,
    required this.isExpanded,
    required this.onToggle,
    this.backgroundColor,
    this.padding = const EdgeInsets.all(16),
    this.borderRadius = 16,
  });

  @override
  State<NoviMorphExpandableCard> createState() => _NoviMorphExpandableCardState();
}

class _NoviMorphExpandableCardState extends State<NoviMorphExpandableCard> {
  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final reduceMotion = NoviMotion.shouldReduceMotion(context);
    final animDuration = reduceMotion ? Duration.zero : NoviMotion.standard;

    return AnimatedContainer(
      duration: animDuration,
      curve: NoviMotion.easeInOut,
      decoration: BoxDecoration(
        color: widget.backgroundColor ?? colorScheme.surfaceContainerLow,
        borderRadius: BorderRadius.circular(widget.borderRadius),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(widget.borderRadius),
          onTap: () {
            NoviHaptics.selection();
            widget.onToggle();
          },
          child: Padding(
            padding: widget.padding,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    Expanded(child: widget.header),
                    NoviMorphIcon(
                      icon: widget.isExpanded ? Icons.expand_less_rounded : Icons.expand_more_rounded,
                      size: 20,
                    ),
                  ],
                ),
                AnimatedSize(
                  duration: animDuration,
                  curve: NoviMotion.emphasizedDecelerate,
                  alignment: Alignment.topCenter,
                  clipBehavior: Clip.antiAlias,
                  child: widget.isExpanded
                      ? Padding(
                          padding: const EdgeInsets.only(top: 12),
                          child: widget.expandedContent,
                        )
                      : const SizedBox.shrink(),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Google Pixel-inspired Page Transition Builder
class NoviPageTransitionsBuilder extends PageTransitionsBuilder {
  const NoviPageTransitionsBuilder();

  @override
  Widget buildTransitions<T>(
    PageRoute<T> route,
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    if (NoviMotion.shouldReduceMotion(context)) {
      return child;
    }

    // Entering page: Opacity 0 -> 1 + translateY 12px -> 0px
    final curvedAnimation = CurvedAnimation(
      parent: animation,
      curve: NoviMotion.emphasizedDecelerate,
      reverseCurve: NoviMotion.easeIn,
    );

    final secondaryCurved = CurvedAnimation(
      parent: secondaryAnimation,
      curve: NoviMotion.easeIn,
    );

    // Departing page: subtle scale down and fade out
    final exitFade = Tween<double>(begin: 1.0, end: 0.88).animate(secondaryCurved);
    final exitSlide = Tween<Offset>(begin: Offset.zero, end: const Offset(0.0, -0.02)).animate(secondaryCurved);

    final enterFade = Tween<double>(begin: 0.0, end: 1.0).animate(curvedAnimation);
    final enterSlide = Tween<Offset>(
      begin: const Offset(0.0, 0.03), // subtle 3% vertical slide
      end: Offset.zero,
    ).animate(curvedAnimation);

    return SlideTransition(
      position: exitSlide,
      child: FadeTransition(
        opacity: exitFade,
        child: SlideTransition(
          position: enterSlide,
          child: FadeTransition(
            opacity: enterFade,
            child: child,
          ),
        ),
      ),
    );
  }
}

/// Custom PageRoute using NOVI ultra-smooth motion
class NoviPageRoute<T> extends PageRouteBuilder<T> {
  final Widget page;

  NoviPageRoute({
    required this.page,
    super.settings,
    super.transitionDuration = NoviMotion.standard,
  }) : super(
          pageBuilder: (context, animation, secondaryAnimation) => page,
          reverseTransitionDuration: NoviMotion.fast,
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            const builder = NoviPageTransitionsBuilder();
            return builder.buildTransitions(
              PageRouteBuilder<T>(
                pageBuilder: (c, a, sa) => page,
              ),
              context,
              animation,
              secondaryAnimation,
              child,
            );
          },
        );
}

/// Standardized Modal & Sheet Transition Helpers
class NoviTransitions {
  /// Standard smooth cross-fade transition with subtle directional slide for tab/content swaps
  static Widget fadeThrough({
    required Widget child,
    required Key key,
    Duration duration = NoviMotion.fast,
    double slideOffset = 0.015,
    Axis direction = Axis.vertical,
  }) {
    return AnimatedSwitcher(
      duration: duration,
      switchInCurve: NoviMotion.easeOut,
      switchOutCurve: NoviMotion.easeIn,
      layoutBuilder: (currentChild, previousChildren) {
        return Stack(
          alignment: Alignment.topLeft,
          children: <Widget>[
            ...previousChildren,
            if (currentChild != null) currentChild,
          ],
        );
      },
      transitionBuilder: (child, animation) {
        final isEntering = child.key == key;
        final beginOffset = direction == Axis.vertical
            ? Offset(0.0, isEntering ? slideOffset : 0.0)
            : Offset(isEntering ? slideOffset : 0.0, 0.0);

        final slide = Tween<Offset>(
          begin: beginOffset,
          end: Offset.zero,
        ).animate(CurvedAnimation(parent: animation, curve: NoviMotion.easeOut));

        return FadeTransition(
          opacity: animation,
          child: SlideTransition(
            position: slide,
            child: child,
          ),
        );
      },
      child: child,
    );
  }

  /// Directional horizontal slide-fade for date and calendar switching (e.g. Mon -> Tue)
  static Widget horizontalSlide({
    required Widget child,
    required Key key,
    bool forward = true,
    Duration duration = NoviMotion.standard,
  }) {
    return AnimatedSwitcher(
      duration: duration,
      switchInCurve: NoviMotion.emphasizedDecelerate,
      switchOutCurve: NoviMotion.easeIn,
      layoutBuilder: (currentChild, previousChildren) {
        return Stack(
          children: <Widget>[
            ...previousChildren,
            if (currentChild != null) currentChild,
          ],
        );
      },
      transitionBuilder: (child, animation) {
        final isEntering = child.key == key;
        final beginOffset = isEntering
            ? Offset(forward ? 0.05 : -0.05, 0.0)
            : Offset(forward ? -0.05 : 0.05, 0.0);

        final slide = Tween<Offset>(
          begin: beginOffset,
          end: Offset.zero,
        ).animate(CurvedAnimation(parent: animation, curve: NoviMotion.emphasizedDecelerate));

        return FadeTransition(
          opacity: animation,
          child: SlideTransition(
            position: slide,
            child: child,
          ),
        );
      },
      child: child,
    );
  }

  /// Subtle scale-fade transition for dialogs and status popups (0.96 -> 1.0)
  static Widget scaleFade({
    required Widget child,
    required Animation<double> animation,
  }) {
    final scale = Tween<double>(begin: 0.96, end: 1.0).animate(
      CurvedAnimation(parent: animation, curve: NoviMotion.emphasizedDecelerate),
    );
    final fade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: animation, curve: NoviMotion.easeOut),
    );

    return ScaleTransition(
      scale: scale,
      child: FadeTransition(
        opacity: fade,
        child: child,
      ),
    );
  }
}
