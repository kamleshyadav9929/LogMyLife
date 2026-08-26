import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/theme/app_theme.dart';
import '../../core/database/local_store.dart';
import '../../domain/models/models.dart';
import '../../domain/models/focus_models.dart';
import '../../services/native_bridge_service.dart';
import '../widgets/novi_card.dart';
import '../widgets/novi_section_header.dart';
import '../widgets/novi_page_header.dart';
import '../widgets/profile_avatar_sheet.dart';

/// NOVI — Settings & System Preferences
/// Google Pixel-inspired settings screen for theme, notifications, privacy, app rules, and data management.

class SettingsNativeScreen extends StatefulWidget {
  final ValueChanged<ThemeMode> onThemeChanged;
  final ThemeMode currentThemeMode;

  const SettingsNativeScreen({
    super.key,
    required this.onThemeChanged,
    required this.currentThemeMode,
  });

  @override
  State<SettingsNativeScreen> createState() => _SettingsNativeScreenState();
}

class _SettingsNativeScreenState extends State<SettingsNativeScreen> with WidgetsBindingObserver {
  bool _hasUsagePermission = false;
  bool _isBatteryIgnored = false;
  bool _hasNotificationPermission = true;
  NotificationPreferences _notifPrefs = const NotificationPreferences();
  UserProfile? _profile;
  List<ActivityRule> _activityRules = [];
  List<RawActivityEvent> _diagnosticEvents = [];
  bool _isLoadingDiagnostics = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _loadSettingsData();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _loadSettingsData();
    }
  }

  Future<void> _loadSettingsData() async {
    final hasUsage = await NativeBridgeService.hasUsageStatsPermission();
    final isBattery = await NativeBridgeService.isBatteryOptimizationIgnored();
    final hasNotif = await NativeBridgeService.hasNotificationPermission();
    final notifPrefs = await LocalStore.getNotificationPreferences();
    final prof = await LocalStore.getUserProfile();
    final rules = await LocalStore.getActivityRules();

    if (mounted) {
      setState(() {
        _hasUsagePermission = hasUsage;
        _isBatteryIgnored = isBattery;
        _hasNotificationPermission = hasNotif;
        _notifPrefs = notifPrefs;
        _profile = prof;
        _activityRules = rules;
      });
    }
  }

  Future<void> _updateNotificationPreferences(NotificationPreferences updated) async {
    setState(() => _notifPrefs = updated);
    await LocalStore.saveNotificationPreferences(updated);
    NoviHaptics.light();
  }

  Future<void> _fetchLiveDiagnostics() async {
    NoviHaptics.light();
    setState(() => _isLoadingDiagnostics = true);
    final now = DateTime.now().millisecondsSinceEpoch;
    final oneHourAgo = now - (60 * 60 * 1000);
    final events = await NativeBridgeService.queryRawUsageEvents(oneHourAgo, now);

    if (mounted) {
      setState(() {
        _diagnosticEvents = events;
        _isLoadingDiagnostics = false;
      });
    }
  }

  void _showEditProfileDialog() {
    if (_profile == null) return;
    ProfileAvatarSheet.show(
      context,
      profile: _profile!,
      onProfileUpdated: (updated) {
        setState(() => _profile = updated);
      },
    );
  }

  Widget _buildAvatarWidget(ColorScheme colorScheme) {
    final avatarUrl = _profile?.avatarUrl ?? '';
    if (avatarUrl.startsWith('http')) {
      return ClipOval(
        child: Image.network(
          avatarUrl,
          width: 48,
          height: 48,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _buildFallbackInitial(colorScheme),
        ),
      );
    } else if (avatarUrl.startsWith('asset:') || avatarUrl.endsWith('.png')) {
      final path = avatarUrl.replaceFirst('asset:', '');
      return ClipOval(
        child: Image.asset(
          path,
          width: 48,
          height: 48,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _buildFallbackInitial(colorScheme),
        ),
      );
    } else if (avatarUrl.startsWith('preset:')) {
      final icon = avatarUrl == 'preset:botanical'
          ? '🌿'
          : (avatarUrl == 'preset:wine'
              ? '🍷'
              : (avatarUrl == 'preset:cosmic'
                  ? '🌌'
                  : (avatarUrl == 'preset:coffee'
                      ? '☕'
                      : (avatarUrl == 'preset:spark' ? '⚡' : '🎯'))));
      return Center(child: Text(icon, style: const TextStyle(fontSize: 22)));
    }
    return _buildFallbackInitial(colorScheme);
  }

  Widget _buildFallbackInitial(ColorScheme colorScheme) {
    return Text(
      _profile!.name.isNotEmpty ? _profile!.name[0].toUpperCase() : 'N',
      style: TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.bold,
        color: colorScheme.onPrimaryContainer,
      ),
    );
  }

  void _showAddRuleDialog() {
    final pkgController = TextEditingController();
    final targetController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Add App Matching Rule'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: pkgController,
                decoration: const InputDecoration(
                  labelText: 'Package Name',
                  hintText: 'e.g. com.google.android.youtube',
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: targetController,
                decoration: const InputDecoration(
                  labelText: 'Target Activity ID / Category',
                  hintText: 'e.g. cat_study or plan_dsa_01',
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          FilledButton(
            onPressed: () async {
              final pkg = pkgController.text.trim();
              final target = targetController.text.trim();
              if (pkg.isNotEmpty && target.isNotEmpty) {
                NoviHaptics.medium();
                final newRule = ActivityRule(
                  id: 'rule_${DateTime.now().millisecondsSinceEpoch}',
                  targetId: target,
                  ruleType: RuleType.packageMatch,
                  ruleValue: pkg,
                  confidence: ConfidenceLevel.high,
                );
                await LocalStore.saveActivityRule(newRule);
                _loadSettingsData();
                if (ctx.mounted) Navigator.pop(ctx);
              }
            },
            child: const Text('Add Rule'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final textTheme = theme.textTheme;

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            // Sticky Top Header
            Container(
              padding: const EdgeInsets.fromLTRB(
                NoviSpacing.space16,
                NoviSpacing.space12,
                NoviSpacing.space20,
                NoviSpacing.space12,
              ),
              decoration: BoxDecoration(
                color: theme.scaffoldBackgroundColor,
                border: Border(
                  bottom: BorderSide(
                    color: colorScheme.outline,
                    width: 1,
                  ),
                ),
              ),
              child: NoviPageHeader(
                title: 'Settings',
                subtitle: 'Preferences, notifications & privacy',
                bottomPadding: 0,
                leading: IconButton(
                  icon: const Icon(Icons.arrow_back_rounded),
                  onPressed: () => Navigator.pop(context),
                ),
              ),
            ),

            // Scrollable Body
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(
                  horizontal: NoviSpacing.space20,
                  vertical: NoviSpacing.space16,
                ),
                children: [
                  // Profile Card
            if (_profile != null) ...[
              NoviCard(
                padding: const EdgeInsets.all(NoviSpacing.space16),
                child: ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: colorScheme.surfaceContainerHigh,
                      shape: BoxShape.circle,
                    ),
                    child: _buildAvatarWidget(colorScheme),
                  ),
                  title: Text(
                    _profile!.name,
                    style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                  ),
                  subtitle: Text(
                    '${_profile!.targetDailyHours}h daily goal · ${_profile!.currentStreak} day streak',
                    style: textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
                  ),
                  trailing: IconButton(
                    icon: const Icon(Icons.edit_outlined),
                    tooltip: 'Edit Profile',
                    onPressed: _showEditProfileDialog,
                  ),
                ),
              ),
              const SizedBox(height: NoviSpacing.space20),
            ],

            // Notifications Section
            const NoviSectionHeader(
              title: 'Notifications & Alerts',
              subtitle: 'Native alerts for completed sessions and rhythms',
            ),
            NoviCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  SwitchListTile(
                    title: const Text('Focus Session Completion'),
                    subtitle: const Text('Sound and vibration when focus blocks finish'),
                    value: _notifPrefs.focusSessionCompletion,
                    onChanged: (val) => _updateNotificationPreferences(
                      _notifPrefs.copyWith(focusSessionCompletion: val),
                    ),
                  ),
                  const Divider(height: 1),
                  SwitchListTile(
                    title: const Text('Schedule Reminders'),
                    subtitle: const Text('Gentle prompts before scheduled activities begin'),
                    value: _notifPrefs.scheduleReminders,
                    onChanged: (val) => _updateNotificationPreferences(
                      _notifPrefs.copyWith(scheduleReminders: val),
                    ),
                  ),
                  const Divider(height: 1),
                  SwitchListTile(
                    title: const Text('Daily Summary'),
                    subtitle: const Text('Evening briefing on your logged focus time'),
                    value: _notifPrefs.dailySummary,
                    onChanged: (val) => _updateNotificationPreferences(
                      _notifPrefs.copyWith(dailySummary: val),
                    ),
                  ),
                  if (!_hasNotificationPermission) ...[
                    const Divider(height: 1),
                    ListTile(
                      leading: Icon(Icons.warning_amber_rounded, color: colorScheme.error),
                      title: Text(
                        'Notifications disabled in system settings',
                        style: TextStyle(color: colorScheme.error, fontWeight: FontWeight.w600),
                      ),
                      subtitle: const Text('Tap to enable in Android notification settings'),
                      onTap: () async {
                        NoviHaptics.selection();
                        await NativeBridgeService.requestNotificationPermission();
                        await _loadSettingsData();
                      },
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: NoviSpacing.space20),

            // Appearance & Theme Mode
            const NoviSectionHeader(
              title: 'Appearance',
              subtitle: 'Choose your visual preference',
            ),
            NoviCard(
              padding: const EdgeInsets.all(NoviSpacing.space16),
              child: SizedBox(
                width: double.infinity,
                child: SegmentedButton<ThemeMode>(
                  segments: const [
                    ButtonSegment(
                      value: ThemeMode.light,
                      icon: Icon(Icons.light_mode_outlined, size: 18),
                      label: Text('Light'),
                    ),
                    ButtonSegment(
                      value: ThemeMode.dark,
                      icon: Icon(Icons.dark_mode_outlined, size: 18),
                      label: Text('Dark'),
                    ),
                    ButtonSegment(
                      value: ThemeMode.system,
                      icon: Icon(Icons.phone_android_rounded, size: 18),
                      label: Text('System'),
                    ),
                  ],
                  selected: {widget.currentThemeMode},
                  onSelectionChanged: (modes) {
                    NoviHaptics.selection();
                    widget.onThemeChanged(modes.first);
                  },
                ),
              ),
            ),
            const SizedBox(height: NoviSpacing.space20),

            // Native Android System Integrations
            const NoviSectionHeader(
              title: 'System & Permissions',
              subtitle: 'On-device background awareness and permissions',
            ),
            NoviCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  SwitchListTile(
                    title: const Text('App Usage Access'),
                    subtitle: Text(
                      _hasUsagePermission
                          ? 'Active · Tracking foreground focus apps locally'
                          : 'Disabled · Tap to open Android Usage Access Settings',
                    ),
                    value: _hasUsagePermission,
                    onChanged: (val) async {
                      NoviHaptics.selection();
                      await NativeBridgeService.requestUsageStatsPermission();
                      await _loadSettingsData();
                    },
                  ),
                  const Divider(height: 1),
                  SwitchListTile(
                    title: const Text('Battery Optimization Exemption'),
                    subtitle: Text(
                      _isBatteryIgnored
                          ? 'Active · Background timer runs uninterrupted'
                          : 'Standard · May pause during device deep sleep',
                    ),
                    value: _isBatteryIgnored,
                    onChanged: (val) async {
                      NoviHaptics.selection();
                      await NativeBridgeService.requestIgnoreBatteryOptimization();
                      await _loadSettingsData();
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: NoviSpacing.space20),

            // Privacy & Data Sovereignty
            const NoviSectionHeader(
              title: 'Privacy & Data Sovereignty',
              subtitle: '100% On-Device Processing',
            ),
            NoviCard(
              padding: const EdgeInsets.all(NoviSpacing.space16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.shield_outlined, color: colorScheme.primary, size: 20),
                      const SizedBox(width: NoviSpacing.space8),
                      Text(
                        'Your Privacy Guarantee',
                        style: textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
                      ),
                    ],
                  ),
                  const SizedBox(height: NoviSpacing.space8),
                  Text(
                    '• Collected: App switch timestamps and focus duration.\n'
                    '• Why: Reconciling study sessions with schedule blocks and calculating focus continuity.\n'
                    '• Storage: Stored 100% on your local device. Zero data is sent to external cloud servers.\n'
                    '• Control: You can revoke Usage Access or wipe all records at any time below.',
                    style: textTheme.bodySmall?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                      height: 1.45,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: NoviSpacing.space20),

            // App Matching Rules Manager
            NoviSectionHeader(
              title: 'App Mapping Rules',
              subtitle: 'Rules that reconcile foreground apps to focus intentions',
              actionLabel: '+ Add Rule',
              onAction: _showAddRuleDialog,
            ),
            if (_activityRules.isEmpty)
              const NoviCard(
                padding: EdgeInsets.all(NoviSpacing.space16),
                child: Text('No active matching rules configured.'),
              )
            else
              NoviCard(
                padding: const EdgeInsets.all(NoviSpacing.space12),
                child: Column(
                  children: _activityRules.map((rule) {
                    return ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: Container(
                        padding: const EdgeInsets.all(NoviSpacing.space8),
                        decoration: BoxDecoration(
                          color: colorScheme.surfaceContainerHigh,
                          borderRadius: BorderRadius.circular(NoviShapes.radiusSmall),
                        ),
                        child: Icon(Icons.rule_rounded, size: 18, color: colorScheme.primary),
                      ),
                      title: Text(rule.ruleValue, style: textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w600)),
                      subtitle: Text('Mapped to ${rule.targetId} (${rule.ruleType.name})', style: textTheme.bodySmall),
                      trailing: IconButton(
                        icon: const Icon(Icons.delete_outline_rounded, size: 18),
                        color: colorScheme.error,
                        onPressed: () async {
                          NoviHaptics.medium();
                          await LocalStore.deleteActivityRule(rule.id);
                          _loadSettingsData();
                        },
                      ),
                    );
                  }).toList(),
                ),
              ),
            const SizedBox(height: NoviSpacing.space20),

            // Data Management Section
            const NoviSectionHeader(
              title: 'Data & Backup Management',
              subtitle: 'Local data persistence, export, import, and reset',
            ),
            NoviCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.download_rounded),
                    title: const Text('Export Backup (JSON)'),
                    subtitle: const Text('Copy all local activities and records to clipboard'),
                    onTap: () async {
                      NoviHaptics.light();
                      final jsonStr = await LocalStore.exportDataAsJson();
                      await Clipboard.setData(ClipboardData(text: jsonStr));
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Backup data copied to clipboard!')),
                        );
                      }
                    },
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(Icons.restart_alt_rounded),
                    title: const Text('Reset to Demo Fixtures'),
                    subtitle: const Text('Reload sample scheduled blocks, habits, and syllabus'),
                    onTap: () async {
                      final confirm = await showDialog<bool>(
                        context: context,
                        builder: (ctx) => AlertDialog(
                          title: const Text('Reset Demo Data'),
                          content: const Text('This will reset your data back to initial sample fixtures. Proceed?'),
                          actions: [
                            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
                            FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Reset')),
                          ],
                        ),
                      );
                      if (confirm == true) {
                        NoviHaptics.medium();
                        await LocalStore.resetToDemoData();
                        await _loadSettingsData();
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Demo fixtures restored successfully!')),
                          );
                        }
                      }
                    },
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: Icon(Icons.delete_forever_rounded, color: colorScheme.error),
                    title: Text('Clear All User Data', style: TextStyle(color: colorScheme.error)),
                    subtitle: const Text('Erase all scheduled activities, occurrences, and records'),
                    onTap: () async {
                      final confirm = await showDialog<bool>(
                        context: context,
                        builder: (ctx) => AlertDialog(
                          title: const Text('Clear All Data'),
                          content: const Text('Are you sure? This will delete all activities, habits, and logs.'),
                          actions: [
                            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
                            FilledButton(
                              onPressed: () => Navigator.pop(ctx, true),
                              style: FilledButton.styleFrom(backgroundColor: colorScheme.error),
                              child: const Text('Clear All'),
                            ),
                          ],
                        ),
                      );
                      if (confirm == true) {
                        NoviHaptics.medium();
                        await LocalStore.clearAllData();
                        await _loadSettingsData();
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('All data cleared successfully!')),
                          );
                        }
                      }
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: NoviSpacing.space20),

            // Live Diagnostics Viewer
            NoviSectionHeader(
              title: 'Diagnostic Inspector',
              subtitle: 'Query on-device platform channel events',
              actionLabel: _isLoadingDiagnostics ? 'Querying...' : 'Query OS',
              onAction: _isLoadingDiagnostics ? null : _fetchLiveDiagnostics,
            ),
            if (_diagnosticEvents.isNotEmpty)
              NoviCard(
                padding: const EdgeInsets.all(NoviSpacing.space16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: _diagnosticEvents.take(4).map((ev) {
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: NoviSpacing.space4),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: NoviSpacing.space6,
                              vertical: NoviSpacing.space2,
                            ),
                            decoration: BoxDecoration(
                              color: colorScheme.surfaceContainerHigh,
                              borderRadius: BorderRadius.circular(NoviShapes.radiusSmall),
                            ),
                            child: Text(
                              ev.eventType.name,
                              style: textTheme.labelSmall?.copyWith(
                                color: colorScheme.primary,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                          const SizedBox(width: NoviSpacing.space8),
                          Expanded(
                            child: Text(
                              ev.packageName,
                              style: textTheme.bodySmall,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ),
              ),
            const SizedBox(height: NoviSpacing.space20),

            // About NOVI
            NoviCard(
              padding: const EdgeInsets.all(NoviSpacing.space16),
              child: Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: colorScheme.primaryContainer,
                      shape: BoxShape.circle,
                    ),
                    alignment: Alignment.center,
                    child: Icon(
                      Icons.spa_rounded,
                      size: 18,
                      color: colorScheme.onPrimaryContainer,
                    ),
                  ),
                  const SizedBox(width: NoviSpacing.space14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'NOVI',
                          style: textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        Text(
                          'A calm personal life space · Version 1.0.0',
                          style: textTheme.bodySmall?.copyWith(
                            color: colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: NoviSpacing.space40),
          ],
        ),
      ),
    ],
  ),
),
    );
  }
}
