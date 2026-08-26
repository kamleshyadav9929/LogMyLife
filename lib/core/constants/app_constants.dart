library;

/// LogMyLife Core Constants, App Presets & Engine Configurations

class AppPreset {
  final String name;
  final String packageName;
  final String categoryId;
  final String icon;
  final String colorHex;

  const AppPreset({
    required this.name,
    required this.packageName,
    required this.categoryId,
    required this.icon,
    required this.colorHex,
  });
}

class AppConstants {
  static const int minForegroundMs = 3000;
  static const int maxReentryGapMs = 2000;
  static const int interruptionThresholdSeconds = 60;

  static const List<AppPreset> popularAppPresets = [
    AppPreset(
      name: 'Visual Studio Code',
      packageName: 'com.microsoft.vscode',
      categoryId: 'cat_work',
      icon: '💻',
      colorHex: '#007ACC',
    ),
    AppPreset(
      name: 'LeetCode / Browser',
      packageName: 'com.android.chrome',
      categoryId: 'cat_study',
      icon: '🌐',
      colorHex: '#EA4335',
    ),
    AppPreset(
      name: 'Notion',
      packageName: 'notion.id',
      categoryId: 'cat_study',
      icon: '📝',
      colorHex: '#000000',
    ),
    AppPreset(
      name: 'YouTube',
      packageName: 'com.google.android.youtube',
      categoryId: 'cat_leisure',
      icon: '📺',
      colorHex: '#FF0000',
    ),
    AppPreset(
      name: 'Instagram',
      packageName: 'com.instagram.android',
      categoryId: 'cat_leisure',
      icon: '📸',
      colorHex: '#E1306C',
    ),
    AppPreset(
      name: 'WhatsApp',
      packageName: 'com.whatsapp',
      categoryId: 'cat_comm',
      icon: '💬',
      colorHex: '#25D366',
    ),
    AppPreset(
      name: 'Spotify',
      packageName: 'com.spotify.music',
      categoryId: 'cat_leisure',
      icon: '🎵',
      colorHex: '#1DB954',
    ),
    AppPreset(
      name: 'Slack',
      packageName: 'com.Slack',
      categoryId: 'cat_work',
      icon: '💼',
      colorHex: '#4A154B',
    ),
  ];
}
