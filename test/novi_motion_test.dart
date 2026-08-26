import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:logmylife/core/theme/novi_motion.dart';
import 'package:logmylife/core/database/local_store.dart';
import 'package:logmylife/services/timer_engine.dart';
import 'package:logmylife/presentation/widgets/novi_pressable.dart';
import 'package:logmylife/presentation/widgets/novi_radial_gauge.dart';
import 'package:logmylife/presentation/widgets/novi_search_header.dart';
import 'package:logmylife/presentation/screens/pomodoro_screen.dart';
import 'package:logmylife/presentation/screens/master_dashboard_screen.dart';
import 'package:logmylife/presentation/screens/daily_planner_screen.dart';
import 'package:logmylife/presentation/screens/search_screen.dart';
import 'package:logmylife/presentation/screens/notifications_screen.dart';
import 'package:logmylife/presentation/widgets/early_stop_reason_sheet.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUpAll(() async {
    SharedPreferences.setMockInitialValues({});
    await LocalStore.init();
    await TimerEngine.cancelTimer();
  });

  setUp(() async {
    await TimerEngine.cancelTimer();
  });

  group('NoviMotion System Tokens & Curves', () {
    test('Motion duration hierarchy follows core morph principles', () {
      expect(NoviMotion.instant, Duration.zero);
      expect(NoviMotion.micro.inMilliseconds, 100);
      expect(NoviMotion.feedback.inMilliseconds, 140);
      expect(NoviMotion.fast.inMilliseconds, 180);
      expect(NoviMotion.shortDuration.inMilliseconds, 180);
      expect(NoviMotion.standard.inMilliseconds, 250);
      expect(NoviMotion.medium.inMilliseconds, 320);
      expect(NoviMotion.expand.inMilliseconds, 400);
      expect(NoviMotion.slow.inMilliseconds, 420);
      expect(NoviMotion.longDuration.inMilliseconds, 420);
    });

    test('Motion curves are defined and continuous', () {
      expect(NoviMotion.easeOut, isNotNull);
      expect(NoviMotion.easeIn, isNotNull);
      expect(NoviMotion.easeInOut, isNotNull);
      expect(NoviMotion.gentle, isNotNull);
      expect(NoviMotion.emphasized, isNotNull);
      expect(NoviMotion.emphasizedDecelerate, isNotNull);
      expect(NoviMotion.subtleTactile, isNotNull);
      expect(NoviMotion.subtleSpring, isNotNull);
    });

    testWidgets('Reduce motion falls back to Duration.zero', (tester) async {
      late BuildContext capturedContext;

      await tester.pumpWidget(
        MaterialApp(
          home: MediaQuery(
            data: const MediaQueryData(accessibleNavigation: false, disableAnimations: true),
            child: Builder(
              builder: (ctx) {
                capturedContext = ctx;
                return const Scaffold(body: SizedBox());
              },
            ),
          ),
        ),
      );

      expect(NoviMotion.shouldReduceMotion(capturedContext), isTrue);
      expect(
        NoviMotion.duration(capturedContext, NoviMotion.standard),
        Duration.zero,
      );
    });

    testWidgets('Standard motion returns intended duration when animations enabled', (tester) async {
      late BuildContext capturedContext;

      await tester.pumpWidget(
        MaterialApp(
          home: MediaQuery(
            data: const MediaQueryData(disableAnimations: false),
            child: Builder(
              builder: (ctx) {
                capturedContext = ctx;
                return const Scaffold(body: SizedBox());
              },
            ),
          ),
        ),
      );

      expect(NoviMotion.shouldReduceMotion(capturedContext), isFalse);
      expect(
        NoviMotion.duration(capturedContext, NoviMotion.standard),
        NoviMotion.standard,
      );
    });
  });

  group('NoviMorphIcon & Morph Primitives Tests', () {
    testWidgets('NoviMorphIcon switches smoothly between icons', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: NoviMorphIcon(
              icon: Icons.play_arrow_rounded,
              size: 24,
            ),
          ),
        ),
      );

      expect(find.byIcon(Icons.play_arrow_rounded), findsOneWidget);

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: NoviMorphIcon(
              icon: Icons.pause_rounded,
              size: 24,
            ),
          ),
        ),
      );

      await tester.pump(const Duration(milliseconds: 90));
      expect(find.byType(AnimatedSwitcher), findsOneWidget);

      await tester.pumpAndSettle();
      expect(find.byIcon(Icons.pause_rounded), findsOneWidget);
    });

    testWidgets('NoviAnimatedCounter renders and interpolates values with tabular figures', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: NoviAnimatedCounter(
              value: 75.0,
              suffix: '%',
            ),
          ),
        ),
      );

      expect(find.text('75%'), findsOneWidget);

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: NoviAnimatedCounter(
              value: 80.0,
              suffix: '%',
            ),
          ),
        ),
      );

      await tester.pump(const Duration(milliseconds: 160));
      await tester.pumpAndSettle();
      expect(find.text('80%'), findsOneWidget);
    });

    testWidgets('NoviSlidingPillSelector selects items and triggers callbacks', (tester) async {
      int selectedMinutes = 25;

      await tester.pumpWidget(
        StatefulBuilder(
          builder: (context, setState) {
            return MaterialApp(
              home: Scaffold(
                body: NoviSlidingPillSelector<int>(
                  items: const [15, 25, 45, 60],
                  selectedItem: selectedMinutes,
                  onSelected: (val) {
                    setState(() => selectedMinutes = val);
                  },
                  itemBuilder: (context, item, isSelected) {
                    return Text('$item min');
                  },
                ),
              ),
            );
          },
        ),
      );

      expect(find.text('25 min'), findsOneWidget);
      expect(find.text('45 min'), findsOneWidget);

      await tester.tap(find.text('45 min'));
      await tester.pumpAndSettle();

      expect(selectedMinutes, 45);
    });

    testWidgets('NoviMorphButton transitions states smoothly', (tester) async {
      bool buttonPressed = false;
      NoviMorphButtonState currentState = NoviMorphButtonState.idle;

      await tester.pumpWidget(
        StatefulBuilder(
          builder: (context, setState) {
            return MaterialApp(
              home: Scaffold(
                body: NoviMorphButton(
                  state: currentState,
                  onPressed: () {
                    buttonPressed = true;
                    setState(() => currentState = NoviMorphButtonState.active);
                  },
                  idleChild: const Text('Start Focus'),
                  activeChild: const Text('Pause Focus'),
                ),
              ),
            );
          },
        ),
      );

      expect(find.text('Start Focus'), findsOneWidget);

      await tester.tap(find.text('Start Focus'));
      await tester.pumpAndSettle();

      expect(buttonPressed, isTrue);
      expect(find.text('Pause Focus'), findsOneWidget);
    });

    testWidgets('NoviMorphExpandableCard expands and collapses without layout jank', (tester) async {
      bool isExpanded = false;

      await tester.pumpWidget(
        StatefulBuilder(
          builder: (context, setState) {
            return MaterialApp(
              home: Scaffold(
                body: NoviMorphExpandableCard(
                  header: const Text('Expandable Header'),
                  expandedContent: const Text('Hidden Detail Content'),
                  isExpanded: isExpanded,
                  onToggle: () => setState(() => isExpanded = !isExpanded),
                ),
              ),
            );
          },
        ),
      );

      expect(find.text('Expandable Header'), findsOneWidget);
      expect(find.text('Hidden Detail Content'), findsNothing);

      await tester.tap(find.text('Expandable Header'));
      await tester.pumpAndSettle();

      expect(find.text('Hidden Detail Content'), findsOneWidget);
    });
  });

  group('NoviPressable Tactile Interaction Tests', () {
    testWidgets('NoviPressable scales smoothly on tap down and resets on tap up', (tester) async {
      bool tapped = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Center(
              child: NoviPressable(
                onTap: () => tapped = true,
                child: const SizedBox(
                  key: Key('pressable_box'),
                  width: 100,
                  height: 100,
                ),
              ),
            ),
          ),
        ),
      );

      final gesture = await tester.startGesture(tester.getCenter(find.byKey(const Key('pressable_box'))));
      await tester.pump(const Duration(milliseconds: 50));

      expect(find.byType(Transform), findsWidgets);

      await gesture.up();
      await tester.pumpAndSettle();

      expect(tapped, isTrue);
    });
  });

  group('NoviTransitions & Screen Morph Flows', () {
    testWidgets('NoviTransitions.fadeThrough crossfades smoothly between children', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: NoviTransitions.fadeThrough(
              key: const ValueKey('key_a'),
              duration: const Duration(milliseconds: 200),
              child: const Text('Child A', key: Key('child_a')),
            ),
          ),
        ),
      );

      expect(find.text('Child A'), findsOneWidget);

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: NoviTransitions.fadeThrough(
              key: const ValueKey('key_b'),
              duration: const Duration(milliseconds: 200),
              child: const Text('Child B', key: Key('child_b')),
            ),
          ),
        ),
      );

      await tester.pump(const Duration(milliseconds: 100));
      expect(find.byType(AnimatedSwitcher), findsOneWidget);

      await tester.pumpAndSettle();
      expect(find.text('Child B'), findsOneWidget);
    });

    testWidgets('NoviTransitions.horizontalSlide transitions directionally', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: NoviTransitions.horizontalSlide(
              key: const ValueKey('monday'),
              forward: true,
              duration: const Duration(milliseconds: 200),
              child: const Text('Monday Schedule', key: Key('mon')),
            ),
          ),
        ),
      );

      expect(find.text('Monday Schedule'), findsOneWidget);

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: NoviTransitions.horizontalSlide(
              key: const ValueKey('tuesday'),
              forward: true,
              duration: const Duration(milliseconds: 200),
              child: const Text('Tuesday Schedule', key: Key('tue')),
            ),
          ),
        ),
      );

      await tester.pump(const Duration(milliseconds: 100));
      expect(find.byType(AnimatedSwitcher), findsOneWidget);

      await tester.pumpAndSettle();
      expect(find.text('Tuesday Schedule'), findsOneWidget);
    });

    testWidgets('NoviRadialGauge smoothly animates progress', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: NoviRadialGauge(
              progress: 0.75,
              currentHours: 4.5,
              targetHours: 6.0,
              size: 120,
            ),
          ),
        ),
      );

      expect(find.byType(NoviRadialGauge), findsOneWidget);

      await tester.pumpAndSettle();
      expect(find.text('75%'), findsOneWidget);
      expect(find.text('4.5 / 6h'), findsOneWidget);
      expect(find.byType(CustomPaint), findsWidgets);
    });

    testWidgets('NoviSearchHeader renders search pill, mic, notification badge and avatar', (tester) async {
      bool searchTapped = false;
      bool notifTapped = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: NoviSearchHeader(
              onSearchTap: () => searchTapped = true,
              onNotificationTap: () => notifTapped = true,
              notificationCount: 4,
            ),
          ),
        ),
      );

      expect(find.text('Search for apps & activities...'), findsOneWidget);
      expect(find.byIcon(Icons.search_rounded), findsOneWidget);
      expect(find.byIcon(Icons.mic_none_rounded), findsOneWidget);
      expect(find.byIcon(Icons.notifications_none_rounded), findsOneWidget);
      expect(find.text('4'), findsOneWidget);

      await tester.tap(find.text('Search for apps & activities...'));
      expect(searchTapped, isTrue);

      await tester.tap(find.byIcon(Icons.notifications_none_rounded));
      expect(notifTapped, isTrue);
    });

    testWidgets('PomodoroScreen renders Focus morph button and duration chips', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 3.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: PomodoroScreen(),
        ),
      );

      await tester.pumpAndSettle();
      expect(find.text('Focus'), findsOneWidget);
      expect(find.text('Start Focus'), findsOneWidget);
      expect(find.byType(NoviMorphButton), findsOneWidget);
      expect(find.byType(NoviSlidingPillSelector<int>), findsWidgets);
    });

    testWidgets('MasterDashboardScreen renders synchronized Daily Rhythm and Add Block', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: MasterDashboardScreen(
            onNavigateToPlanner: () {},
            onNavigateToPomodoro: () {},
          ),
        ),
      );

      await tester.pumpAndSettle();
      expect(find.text('NOVI'), findsOneWidget);
      expect(find.byIcon(Icons.search_rounded), findsOneWidget);
      expect(find.byIcon(Icons.notifications_outlined), findsOneWidget);
      expect(find.byIcon(Icons.settings_outlined), findsOneWidget);
      expect(find.text('Daily Rhythm'), findsOneWidget);
      expect(find.text('Add block'), findsOneWidget);
      expect(find.byType(NoviRadialGauge), findsOneWidget);
    });

    testWidgets('DailyPlannerScreen renders date strip and schedule view', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: DailyPlannerScreen(),
        ),
      );

      await tester.pumpAndSettle();
      expect(find.text('Schedule'), findsWidgets);
      expect(find.byType(SegmentedButton<String>), findsOneWidget);
    });

    testWidgets('SearchScreen renders full-screen search bar and category filters', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: SearchScreen(),
        ),
      );

      await tester.pumpAndSettle();
      expect(find.byType(TextField), findsOneWidget);
      expect(find.text('All'), findsOneWidget);
      expect(find.text('Activities'), findsOneWidget);
      expect(find.text('Routines'), findsOneWidget);
      expect(find.text('QUICK SUGGESTIONS'), findsOneWidget);
    });

    testWidgets('NotificationsScreen renders full-screen notification center and categories', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: NotificationsScreen(streakDays: 8),
        ),
      );

      await tester.pumpAndSettle();
      expect(find.text('Notifications'), findsOneWidget);
      expect(find.text('All'), findsOneWidget);
      expect(find.text('AI Intelligence'), findsOneWidget);
      expect(find.text('Rhythms & Streaks'), findsOneWidget);
      expect(find.text('System & Sensors'), findsOneWidget);
      expect(find.text('8 Day Rhythm Milestone'), findsOneWidget);
    });

    testWidgets('EarlyStopReasonSheet displays task progress and 5 reason options', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: EarlyStopReasonSheet(
              taskTitle: 'Deep Coding Session',
              completedSeconds: 600, // 10 min
              targetDurationSeconds: 1500, // 25 min (40%)
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();
      expect(find.text('Focus Paused Early'), findsOneWidget);
      expect(find.text('Deep Coding Session'), findsOneWidget);
      expect(find.text('40% (10.0 / 25m)'), findsOneWidget);
      expect(find.text('Distracted / Phone notification'), findsOneWidget);
      expect(find.text('Interrupted by someone / Urgent request'), findsOneWidget);
      expect(find.text('Finished task earlier than expected'), findsOneWidget);
      expect(find.text('Mental fatigue / Need a short break'), findsOneWidget);
      expect(find.text('Switched to a higher priority task'), findsOneWidget);
      expect(find.text('Save & Resume Later'), findsOneWidget);
    });
  });
}
