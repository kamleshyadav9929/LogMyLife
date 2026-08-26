import 'package:flutter/material.dart';
import 'core/theme/app_theme.dart';
import 'core/database/local_store.dart';
import 'services/timer_engine.dart';
import 'presentation/screens/master_dashboard_screen.dart';
import 'presentation/screens/daily_planner_screen.dart';
import 'presentation/screens/pomodoro_screen.dart';
import 'presentation/screens/habits_matrix_screen.dart';
import 'presentation/screens/settings_native_screen.dart';
import 'presentation/screens/onboarding_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await LocalStore.init();
  await TimerEngine.init();
  runApp(const NoviApp());
}

// Compatibility alias for existing smoke tests
typedef LogMyLifeApp = NoviApp;

class NoviApp extends StatefulWidget {
  const NoviApp({super.key});

  @override
  State<NoviApp> createState() => _NoviAppState();
}

class _NoviAppState extends State<NoviApp> with WidgetsBindingObserver {
  ThemeMode _themeMode = ThemeMode.dark;
  bool _isOnboarded = true;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _checkInitialState();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      TimerEngine.handleAppLifecycleResumed();
    }
  }

  Future<void> _checkInitialState() async {
    final profile = await LocalStore.getUserProfile();
    if (mounted) {
      setState(() {
        _isOnboarded = profile.hasCompletedOnboarding;
        _isLoading = false;
      });
    }
  }

  void _updateThemeMode(ThemeMode mode) {
    setState(() => _themeMode = mode);
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Novi',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: _themeMode,
      home: _isLoading
          ? Scaffold(
              body: Center(
                child: CircularProgressIndicator(
                  color: Theme.of(context).colorScheme.primary,
                ),
              ),
            )
          : !_isOnboarded
              ? OnboardingScreen(
                  onOnboardingCompleted: () => setState(() => _isOnboarded = true),
                )
              : MainNavigationHost(
                  onThemeChanged: _updateThemeMode,
                  currentThemeMode: _themeMode,
                ),
    );
  }
}

class MainNavigationHost extends StatefulWidget {
  final ValueChanged<ThemeMode> onThemeChanged;
  final ThemeMode currentThemeMode;

  const MainNavigationHost({
    super.key,
    required this.onThemeChanged,
    required this.currentThemeMode,
  });

  @override
  State<MainNavigationHost> createState() => _MainNavigationHostState();
}

class _MainNavigationHostState extends State<MainNavigationHost> {
  int _currentIndex = 0;

  void _navigateToTab(int index) {
    if (_currentIndex != index) {
      NoviHaptics.selection();
      setState(() => _currentIndex = index);
    }
  }

  void _openSettings() {
    Navigator.of(context).push(
      NoviPageRoute(
        page: SettingsNativeScreen(
          onThemeChanged: widget.onThemeChanged,
          currentThemeMode: widget.currentThemeMode,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final screens = [
      MasterDashboardScreen(
        onNavigateToPlanner: () => _navigateToTab(1),
        onNavigateToPomodoro: () => _navigateToTab(2),
        onOpenSettings: _openSettings,
      ),
      const DailyPlannerScreen(),
      const PomodoroScreen(),
      const HabitsMatrixScreen(),
    ];

    return Scaffold(
      body: NoviTransitions.fadeThrough(
        key: ValueKey<int>(_currentIndex),
        duration: NoviMotion.duration(context, NoviMotion.shortDuration),
        slideOffset: 0.015,
        child: KeyedSubtree(
          key: ValueKey<int>(_currentIndex),
          child: screens[_currentIndex],
        ),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: _navigateToTab,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home_rounded),
            label: 'Today',
          ),
          NavigationDestination(
            icon: Icon(Icons.calendar_month_outlined),
            selectedIcon: Icon(Icons.calendar_month_rounded),
            label: 'Schedule',
          ),
          NavigationDestination(
            icon: Icon(Icons.timer_outlined),
            selectedIcon: Icon(Icons.timer_rounded),
            label: 'Focus',
          ),
          NavigationDestination(
            icon: Icon(Icons.self_improvement_outlined),
            selectedIcon: Icon(Icons.self_improvement_rounded),
            label: 'Rhythms',
          ),
        ],
      ),
    );
  }
}
