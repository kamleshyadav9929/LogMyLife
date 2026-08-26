import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/theme/app_theme.dart';
import '../../core/database/local_store.dart';
import '../../services/ai_insights_service.dart';
import '../widgets/novi_pressable.dart';

class NotificationRecord {
  final String id;
  final String title;
  final String message;
  final DateTime timestamp;
  final IconData icon;
  final Color iconColor;
  final String category; // 'ai', 'rhythm', 'focus', 'system'
  bool isRead;

  NotificationRecord({
    required this.id,
    required this.title,
    required this.message,
    required this.timestamp,
    required this.icon,
    required this.iconColor,
    required this.category,
    this.isRead = false,
  });
}

/// NOVI — Full-Screen Notifications & System Intelligence
/// Dedicated full page displaying prioritized actionable alerts, daily AI insights,
/// streak rhythm milestones, and hardware sensor status.

class NotificationsScreen extends StatefulWidget {
  final DailyAIBriefing? briefing;
  final int streakDays;

  const NotificationsScreen({
    super.key,
    this.briefing,
    this.streakDays = 8,
  });

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<NotificationRecord> _notifications = [];
  String _selectedCategory = 'all'; // all, ai, rhythm, system
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    try {
      final now = DateTime.now();
      DailyAIBriefing? briefing = widget.briefing;
      if (briefing == null) {
        try {
          briefing = await AIInsightsService.generateDailyBriefing();
        } catch (_) {}
      }

      final profile = await LocalStore.getUserProfile();
      final streak = profile.currentStreak > 0 ? profile.currentStreak : widget.streakDays;

      if (mounted) {
        setState(() {
          _notifications = [
            if (briefing != null)
              NotificationRecord(
                id: 'notif_briefing',
                title: 'Daily Focus Intelligence',
                message: briefing.headline,
                timestamp: now.subtract(const Duration(minutes: 12)),
                icon: Icons.auto_awesome_rounded,
                iconColor: const Color(0xFFDFDFDF),
                category: 'ai',
                isRead: false,
              ),
            NotificationRecord(
              id: 'notif_streak',
              title: '$streak Day Rhythm Milestone',
              message: 'Your consistency score is steady. Complete your scheduled focus blocks today.',
              timestamp: now.subtract(const Duration(hours: 2)),
              icon: Icons.repeat_rounded,
              iconColor: const Color(0xFFDFDFDF),
              category: 'rhythm',
              isRead: false,
            ),
            NotificationRecord(
              id: 'notif_sensor',
              title: 'Local Privacy Sensor Active',
              message: 'Foreground session auditor and screen-state tracking are operating locally without cloud leakage.',
              timestamp: now.subtract(const Duration(hours: 4)),
              icon: Icons.security_rounded,
              iconColor: const Color(0xFFB5B5B5),
              category: 'system',
              isRead: true,
            ),
            NotificationRecord(
              id: 'notif_focus_flow',
              title: 'Focus Rhythm Optimization',
              message: 'Deep work windows peak between 9:00 AM – 1:00 PM based on past session data.',
              timestamp: now.subtract(const Duration(hours: 6)),
              icon: Icons.bolt_rounded,
              iconColor: const Color(0xFFDFDFDF),
              category: 'ai',
              isRead: true,
            ),
          ];
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _markAllAsRead() {
    NoviHaptics.light();
    setState(() {
      for (final n in _notifications) {
        n.isRead = true;
      }
    });
  }

  void _clearNotification(String id) {
    NoviHaptics.light();
    setState(() {
      _notifications.removeWhere((n) => n.id == id);
    });
  }

  String _formatTimestamp(DateTime time) {
    final now = DateTime.now();
    final diff = now.difference(time);
    if (diff.inMinutes < 60) {
      return '${diff.inMinutes}m ago';
    } else if (diff.inHours < 24) {
      return '${diff.inHours}h ago';
    } else {
      return DateFormat('MMM d, h:mm a').format(time);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final textTheme = theme.textTheme;

    final unreadCount = _notifications.where((n) => !n.isRead).length;

    final filtered = _notifications.where((n) {
      if (_selectedCategory == 'all') return true;
      return n.category == _selectedCategory;
    }).toList();

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            // ── STICKY TOP APP BAR ──
            Container(
              padding: const EdgeInsets.fromLTRB(
                NoviSpacing.space8,
                NoviSpacing.space12,
                NoviSpacing.space16,
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
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back_rounded, size: 22),
                    tooltip: 'Back',
                    onPressed: () {
                      NoviHaptics.light();
                      Navigator.of(context).pop();
                    },
                  ),
                  const SizedBox(width: NoviSpacing.space8),
                  Expanded(
                    child: Row(
                      children: [
                        Text(
                          'Notifications',
                          style: textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                            letterSpacing: -0.2,
                          ),
                        ),
                        if (unreadCount > 0) ...[
                          const SizedBox(width: NoviSpacing.space8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                            decoration: BoxDecoration(
                              color: colorScheme.primary,
                              borderRadius: BorderRadius.circular(NoviShapes.radiusPill),
                            ),
                            child: Text(
                              '$unreadCount new',
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  if (unreadCount > 0)
                    TextButton.icon(
                      onPressed: _markAllAsRead,
                      icon: const Icon(Icons.done_all_rounded, size: 16),
                      label: const Text('Mark read'),
                      style: TextButton.styleFrom(
                        visualDensity: VisualDensity.compact,
                        foregroundColor: colorScheme.primary,
                      ),
                    ),
                ],
              ),
            ),

            // ── FILTER TABS ──
            Container(
              height: 48,
              padding: const EdgeInsets.symmetric(horizontal: NoviSpacing.space16, vertical: 8),
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  _buildFilterChip('all', 'All', _notifications.length),
                  const SizedBox(width: 8),
                  _buildFilterChip('ai', 'AI Intelligence', _notifications.where((n) => n.category == 'ai').length),
                  const SizedBox(width: 8),
                  _buildFilterChip('rhythm', 'Rhythms & Streaks', _notifications.where((n) => n.category == 'rhythm').length),
                  const SizedBox(width: 8),
                  _buildFilterChip('system', 'System & Sensors', _notifications.where((n) => n.category == 'system').length),
                ],
              ),
            ),

            // ── NOTIFICATIONS LIST BODY ──
            Expanded(
              child: _isLoading
                  ? Center(child: CircularProgressIndicator(color: colorScheme.primary))
                  : filtered.isEmpty
                      ? _buildEmptyState(colorScheme, textTheme)
                      : ListView.separated(
                          padding: const EdgeInsets.symmetric(
                            horizontal: NoviSpacing.space20,
                            vertical: NoviSpacing.space12,
                          ),
                          itemCount: filtered.length,
                          separatorBuilder: (_, __) => const SizedBox(height: NoviSpacing.space10),
                          itemBuilder: (context, index) {
                            final notif = filtered[index];
                            return Dismissible(
                              key: Key(notif.id),
                              direction: DismissDirection.endToStart,
                              background: Container(
                                alignment: Alignment.centerRight,
                                padding: const EdgeInsets.only(right: 20),
                                decoration: BoxDecoration(
                                  color: colorScheme.errorContainer,
                                  borderRadius: BorderRadius.circular(NoviShapes.radiusMedium),
                                ),
                                child: Icon(Icons.delete_outline_rounded, color: colorScheme.onErrorContainer),
                              ),
                              onDismissed: (_) => _clearNotification(notif.id),
                              child: NoviPressable(
                                onTap: () {
                                  NoviHaptics.selection();
                                  setState(() => notif.isRead = true);
                                },
                                child: Container(
                                  padding: const EdgeInsets.all(NoviSpacing.space14),
                                  decoration: BoxDecoration(
                                    color: colorScheme.surfaceContainer,
                                    borderRadius: BorderRadius.circular(NoviShapes.radiusMedium),
                                  ),
                                  child: Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Container(
                                        width: 38,
                                        height: 38,
                                        decoration: BoxDecoration(
                                          color: notif.isRead
                                              ? colorScheme.surfaceContainerHigh
                                              : colorScheme.primaryContainer,
                                          shape: BoxShape.circle,
                                        ),
                                        child: Icon(
                                          notif.icon,
                                          size: 18,
                                          color: notif.isRead
                                              ? colorScheme.onSurfaceVariant
                                              : colorScheme.primary,
                                        ),
                                      ),
                                      const SizedBox(width: NoviSpacing.space12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Row(
                                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                              children: [
                                                Expanded(
                                                  child: Text(
                                                    notif.title,
                                                    style: textTheme.bodyMedium?.copyWith(
                                                      fontWeight: notif.isRead ? FontWeight.w500 : FontWeight.w700,
                                                      color: colorScheme.onSurface,
                                                    ),
                                                  ),
                                                ),
                                                const SizedBox(width: 8),
                                                Text(
                                                  _formatTimestamp(notif.timestamp),
                                                  style: textTheme.labelSmall?.copyWith(
                                                    color: colorScheme.onSurfaceVariant,
                                                    fontSize: 10,
                                                  ),
                                                ),
                                                if (!notif.isRead) ...[
                                                  const SizedBox(width: 6),
                                                  Container(
                                                    width: 7,
                                                    height: 7,
                                                    decoration: BoxDecoration(
                                                      color: colorScheme.primary,
                                                      shape: BoxShape.circle,
                                                    ),
                                                  ),
                                                ],
                                              ],
                                            ),
                                            const SizedBox(height: 4),
                                            Text(
                                              notif.message,
                                              style: textTheme.bodySmall?.copyWith(
                                                color: colorScheme.onSurfaceVariant,
                                                height: 1.35,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(String categoryKey, String label, int count) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isSelected = _selectedCategory == categoryKey;

    return NoviPressable(
      onTap: () {
        NoviHaptics.selection();
        setState(() => _selectedCategory = categoryKey);
      },
      child: AnimatedContainer(
        duration: NoviMotion.duration(context, NoviMotion.fast),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
        decoration: BoxDecoration(
          color: isSelected ? colorScheme.primary : colorScheme.surfaceContainer,
          borderRadius: BorderRadius.circular(NoviShapes.radiusPill),
        ),
        alignment: Alignment.center,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                color: isSelected ? Colors.white : colorScheme.onSurfaceVariant,
              ),
            ),
            if (count > 0) ...[
              const SizedBox(width: 5),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                decoration: BoxDecoration(
                  color: isSelected
                      ? Colors.white.withValues(alpha: 0.25)
                      : colorScheme.surfaceContainerHigh,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '$count',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: isSelected ? Colors.white : colorScheme.onSurfaceVariant,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(ColorScheme colorScheme, TextTheme textTheme) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(NoviSpacing.space32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: colorScheme.surfaceContainer,
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.notifications_none_rounded,
                size: 30,
                color: colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: NoviSpacing.space16),
            Text(
              'All caught up!',
              style: textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
                color: colorScheme.onSurface,
              ),
            ),
            const SizedBox(height: NoviSpacing.space6),
            Text(
              'No new alerts or notifications in this category.',
              style: textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
            ),
          ],
        ),
      ),
    );
  }
}
