import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import '../domain/models/models.dart';

/// LogMyLife Native Android Bridge Service
/// Manages MethodChannel communication with Kotlin native modules.

class NativeBridgeService {
  static const MethodChannel _channel = MethodChannel('com.logmylife.app/native_bridge');

  static bool get isAndroid => !kIsWeb && Platform.isAndroid;

  static Future<bool> hasUsageStatsPermission() async {
    if (!isAndroid) return true; // Simulated in desktop/web
    try {
      final bool? result = await _channel.invokeMethod<bool>('hasUsageStatsPermission');
      return result ?? false;
    } catch (e) {
      debugPrint('Error checking usage permission: $e');
      return false;
    }
  }

  static Future<bool> requestUsageStatsPermission() async {
    if (!isAndroid) return true;
    try {
      final bool? result = await _channel.invokeMethod<bool>('requestUsageStatsPermission');
      return result ?? false;
    } catch (e) {
      debugPrint('Error requesting usage permission: $e');
      return false;
    }
  }

  static Future<bool> isBatteryOptimizationIgnored() async {
    if (!isAndroid) return true;
    try {
      final bool? result = await _channel.invokeMethod<bool>('isBatteryOptimizationIgnored');
      return result ?? false;
    } catch (e) {
      debugPrint('Error checking battery optimization: $e');
      return false;
    }
  }

  static Future<bool> requestIgnoreBatteryOptimization() async {
    if (!isAndroid) return true;
    try {
      final bool? result = await _channel.invokeMethod<bool>('requestIgnoreBatteryOptimization');
      return result ?? false;
    } catch (e) {
      debugPrint('Error requesting battery optimization exemption: $e');
      return false;
    }
  }

  static Future<List<RawActivityEvent>> queryRawUsageEvents(int startTime, int endTime) async {
    if (!isAndroid) {
      // Return simulated device event sequence if non-Android
      return [];
    }
    try {
      final List<dynamic>? rawList = await _channel.invokeMethod<List<dynamic>>(
        'queryRawUsageEvents',
        {
          'startTime': startTime,
          'endTime': endTime,
        },
      );
      if (rawList == null) return [];
      return rawList.map((e) => RawActivityEvent.fromMap(Map<String, dynamic>.from(e))).toList();
    } catch (e) {
      debugPrint('Error querying raw usage events: $e');
      return [];
    }
  }

  static Future<List<Map<String, dynamic>>> getInstalledApps() async {
    if (!isAndroid) {
      return [
        {'appName': 'VS Code', 'packageName': 'com.microsoft.vscode', 'isSystem': false},
        {'appName': 'Chrome', 'packageName': 'com.android.chrome', 'isSystem': false},
        {'appName': 'YouTube', 'packageName': 'com.google.android.youtube', 'isSystem': false},
        {'appName': 'Instagram', 'packageName': 'com.instagram.android', 'isSystem': false},
        {'appName': 'WhatsApp', 'packageName': 'com.whatsapp', 'isSystem': false},
        {'appName': 'Spotify', 'packageName': 'com.spotify.music', 'isSystem': false},
      ];
    }
    try {
      final List<dynamic>? list = await _channel.invokeMethod<List<dynamic>>('getInstalledApps');
      if (list == null) return [];
      return list.map((e) => Map<String, dynamic>.from(e)).toList();
    } catch (e) {
      debugPrint('Error getting installed apps: $e');
      return [];
    }
  }

  static Future<void> startForegroundTimer({
    required String title,
    required int durationSeconds,
    int elapsedSeconds = 0,
  }) async {
    if (!isAndroid) return;
    try {
      await _channel.invokeMethod('startForegroundTimer', {
        'title': title,
        'duration': durationSeconds,
        'elapsed': elapsedSeconds,
      });
    } catch (e) {
      debugPrint('Error starting foreground timer service: $e');
    }
  }

  static Future<void> stopForegroundTimer() async {
    if (!isAndroid) return;
    try {
      await _channel.invokeMethod('stopForegroundTimer');
    } catch (e) {
      debugPrint('Error stopping foreground timer service: $e');
    }
  }

  static Future<bool> hasNotificationPermission() async {
    if (!isAndroid) return true;
    try {
      final bool? result = await _channel.invokeMethod<bool>('hasNotificationPermission');
      return result ?? false;
    } catch (e) {
      debugPrint('Error checking notification permission: $e');
      return false;
    }
  }

  static Future<bool> requestNotificationPermission() async {
    if (!isAndroid) return true;
    try {
      final bool? result = await _channel.invokeMethod<bool>('requestNotificationPermission');
      return result ?? false;
    } catch (e) {
      debugPrint('Error requesting notification permission: $e');
      return false;
    }
  }

  static Future<void> showCompletionNotification({
    required String title,
    String? message,
  }) async {
    if (!isAndroid) return;
    try {
      await _channel.invokeMethod('showCompletionNotification', {
        'title': title,
        'message': message ?? '$title session completed.',
      });
    } catch (e) {
      debugPrint('Error showing completion notification: $e');
    }
  }
}
