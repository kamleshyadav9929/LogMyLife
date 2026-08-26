import 'package:intl/intl.dart';
import '../core/database/local_store.dart';

/// LogMyLife Habit & Streak Engine
/// Calculates streak continuity, updates XP and manages habit matrices.

class HabitEngine {
  static Future<bool> toggleHabitCompletion(String habitId, [String? dateStr]) async {
    final targetDate = dateStr ?? LocalStore.getTodayDateStr();
    final habits = await LocalStore.getHabits();
    final habitIdx = habits.indexWhere((h) => h.id == habitId);
    if (habitIdx < 0) return false;

    final habit = habits[habitIdx];
    final completedDates = List<String>.from(habit.completedDates);

    bool isNowCompleted = false;
    if (completedDates.contains(targetDate)) {
      completedDates.remove(targetDate);
      isNowCompleted = false;
    } else {
      completedDates.add(targetDate);
      isNowCompleted = true;
    }

    // Calculate streak
    final streak = _calculateStreak(completedDates);

    habits[habitIdx] = habit.copyWith(
      completedDates: completedDates,
      completedDaysStreak: streak,
    );
    await LocalStore.saveHabits(habits);

    // If completed today, award XP
    if (isNowCompleted && targetDate == LocalStore.getTodayDateStr()) {
      final profile = await LocalStore.getUserProfile();
      final newStreak = profile.currentStreak + (streak > profile.currentStreak ? 1 : 0);
      final newXp = profile.xpPoints + 50;
      final newLevel = (newXp / 400).floor() + 1;

      await LocalStore.saveUserProfile(profile.copyWith(
        xpPoints: newXp,
        level: newLevel,
        currentStreak: newStreak > profile.longestStreak ? newStreak : profile.currentStreak,
        longestStreak: newStreak > profile.longestStreak ? newStreak : profile.longestStreak,
      ));
    }

    return isNowCompleted;
  }

  static int _calculateStreak(List<String> completedDates) {
    if (completedDates.isEmpty) return 0;

    final sortedDates = List<String>.from(completedDates)..sort();
    final dateSet = sortedDates.toSet();

    int streak = 0;
    DateTime checkDate = DateTime.now();

    // Check today or yesterday
    final todayStr = DateFormat('yyyy-MM-dd').format(checkDate);
    final yesterdayStr = DateFormat('yyyy-MM-dd').format(checkDate.subtract(const Duration(days: 1)));

    if (!dateSet.contains(todayStr) && !dateSet.contains(yesterdayStr)) {
      return 0;
    }

    if (!dateSet.contains(todayStr)) {
      checkDate = checkDate.subtract(const Duration(days: 1));
    }

    while (true) {
      final dateStr = DateFormat('yyyy-MM-dd').format(checkDate);
      if (dateSet.contains(dateStr)) {
        streak++;
        checkDate = checkDate.subtract(const Duration(days: 1));
      } else {
        break;
      }
    }

    return streak;
  }
}
