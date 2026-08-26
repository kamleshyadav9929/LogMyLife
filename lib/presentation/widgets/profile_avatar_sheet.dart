import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/database/local_store.dart';
import '../../domain/models/models.dart';
import 'novi_pressable.dart';

/// Modal sheet allowing user to update their name, custom avatar, and photo.
class ProfileAvatarSheet extends StatefulWidget {
  final UserProfile profile;
  final ValueChanged<UserProfile> onProfileUpdated;

  const ProfileAvatarSheet({
    super.key,
    required this.profile,
    required this.onProfileUpdated,
  });

  static Future<void> show(
    BuildContext context, {
    required UserProfile profile,
    required ValueChanged<UserProfile> onProfileUpdated,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Theme.of(context).colorScheme.surfaceContainerHighest,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(NoviShapes.radiusSheet)),
      ),
      builder: (ctx) => ProfileAvatarSheet(
        profile: profile,
        onProfileUpdated: onProfileUpdated,
      ),
    );
  }

  @override
  State<ProfileAvatarSheet> createState() => _ProfileAvatarSheetState();
}

class _ProfileAvatarSheetState extends State<ProfileAvatarSheet> {
  late TextEditingController _nameController;
  late TextEditingController _urlController;
  late String _selectedAvatar;
  bool _isCustomUrlMode = false;

  static const List<Map<String, String>> _presetAvatars = [
    {
      'id': 'asset:assets/scenic_avatar.png',
      'label': 'Zen Scenic',
      'type': 'asset',
      'value': 'assets/scenic_avatar.png',
    },
    {
      'id': 'preset:botanical',
      'label': 'Forest',
      'type': 'icon',
      'icon': '🌿',
      'color': '#334A3E',
    },
    {
      'id': 'preset:silver',
      'label': 'Pearl Silver',
      'type': 'icon',
      'icon': '✨',
      'color': '#DFDFDF',
    },
    {
      'id': 'preset:cosmic',
      'label': 'Cosmos',
      'type': 'icon',
      'icon': '🌌',
      'color': '#2A2E3D',
    },
    {
      'id': 'preset:coffee',
      'label': 'Focus Flow',
      'type': 'icon',
      'icon': '☕',
      'color': '#4A3E33',
    },
    {
      'id': 'preset:spark',
      'label': 'Kinetic',
      'type': 'icon',
      'icon': '⚡',
      'color': '#524322',
    },
  ];

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.profile.name);
    _selectedAvatar = widget.profile.avatarUrl.isNotEmpty
        ? widget.profile.avatarUrl
        : 'asset:assets/scenic_avatar.png';
    _urlController = TextEditingController(
      text: _selectedAvatar.startsWith('http') ? _selectedAvatar : '',
    );
    _isCustomUrlMode = _selectedAvatar.startsWith('http');
  }

  @override
  void dispose() {
    _nameController.dispose();
    _urlController.dispose();
    super.dispose();
  }

  Widget _buildAvatarPreview(double size) {
    if (_selectedAvatar.startsWith('http')) {
      return ClipOval(
        child: Image.network(
          _selectedAvatar,
          width: size,
          height: size,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _buildFallbackInitial(size),
        ),
      );
    } else if (_selectedAvatar.startsWith('asset:') || _selectedAvatar.endsWith('.png')) {
      final path = _selectedAvatar.replaceFirst('asset:', '');
      return ClipOval(
        child: Image.asset(
          path,
          width: size,
          height: size,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _buildFallbackInitial(size),
        ),
      );
    } else if (_selectedAvatar.startsWith('preset:')) {
      final preset = _presetAvatars.firstWhere(
        (p) => p['id'] == _selectedAvatar,
        orElse: () => _presetAvatars[1],
      );
      final hex = preset['color'] ?? '#DFDFDF';
      final colorInt = int.parse(hex.replaceFirst('#', '0xFF'));
      return Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: Color(colorInt),
          shape: BoxShape.circle,
        ),
        alignment: Alignment.center,
        child: Text(
          preset['icon'] ?? '🎯',
          style: TextStyle(fontSize: size * 0.45),
        ),
      );
    }

    return _buildFallbackInitial(size);
  }

  Widget _buildFallbackInitial(double size) {
    final theme = Theme.of(context);
    final initial = _nameController.text.trim().isNotEmpty
        ? _nameController.text.trim()[0].toUpperCase()
        : (widget.profile.name.isNotEmpty ? widget.profile.name[0].toUpperCase() : 'N');

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: theme.colorScheme.primaryContainer,
        shape: BoxShape.circle,
      ),
      alignment: Alignment.center,
      child: Text(
        initial,
        style: TextStyle(
          fontSize: size * 0.42,
          fontWeight: FontWeight.w700,
          color: theme.colorScheme.onPrimaryContainer,
        ),
      ),
    );
  }

  Future<void> _handleSave() async {
    final newName = _nameController.text.trim();
    if (newName.isEmpty) return;

    final avatarToSave = _isCustomUrlMode && _urlController.text.trim().isNotEmpty
        ? _urlController.text.trim()
        : _selectedAvatar;

    final updated = widget.profile.copyWith(
      name: newName,
      avatarUrl: avatarToSave,
    );

    await LocalStore.saveUserProfile(updated);
    widget.onProfileUpdated(updated);
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final textTheme = theme.textTheme;

    return Padding(
      padding: EdgeInsets.only(
        left: NoviSpacing.space20,
        right: NoviSpacing.space20,
        top: NoviSpacing.space16,
        bottom: MediaQuery.of(context).viewInsets.bottom + NoviSpacing.space24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Customize Profile',
                style: textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                  letterSpacing: -0.2,
                ),
              ),
              IconButton(
                icon: const Icon(Icons.close_rounded, size: 20),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: NoviSpacing.space16),

          // Center Avatar Preview
          Center(
            child: Stack(
              children: [
                _buildAvatarPreview(88),
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: colorScheme.primary,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.camera_alt_rounded,
                      size: 14,
                      color: Colors.white,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: NoviSpacing.space20),

          // Name Input
          Text(
            'Your Display Name',
            style: textTheme.labelMedium?.copyWith(
              color: colorScheme.onSurfaceVariant,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: NoviSpacing.space6),
          TextField(
            controller: _nameController,
            onChanged: (_) => setState(() {}),
            decoration: const InputDecoration(
              hintText: 'Enter your name',
              prefixIcon: Icon(Icons.person_outline_rounded, size: 20),
            ),
          ),
          const SizedBox(height: NoviSpacing.space20),

          // Avatar Presets
          Text(
            'Choose Avatar Preset',
            style: textTheme.labelMedium?.copyWith(
              color: colorScheme.onSurfaceVariant,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: NoviSpacing.space10),
          SizedBox(
            height: 72,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: _presetAvatars.length,
              separatorBuilder: (_, __) => const SizedBox(width: NoviSpacing.space12),
              itemBuilder: (context, index) {
                final preset = _presetAvatars[index];
                final isSelected = !_isCustomUrlMode && _selectedAvatar == preset['id'];

                return NoviPressable(
                  onTap: () {
                    NoviHaptics.selection();
                    setState(() {
                      _isCustomUrlMode = false;
                      _selectedAvatar = preset['id']!;
                    });
                  },
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: isSelected
                              ? Border.all(color: colorScheme.primary, width: 2.5)
                              : null,
                        ),
                        child: ClipOval(
                          child: preset['type'] == 'asset'
                              ? Image.asset(
                                  preset['value']!,
                                  fit: BoxFit.cover,
                                )
                              : Container(
                                  color: Color(int.parse(
                                      preset['color']!.replaceFirst('#', '0xFF'))),
                                  alignment: Alignment.center,
                                  child: Text(
                                    preset['icon']!,
                                    style: const TextStyle(fontSize: 22),
                                  ),
                                ),
                        ),
                      ),
                      const SizedBox(height: NoviSpacing.space4),
                      Text(
                        preset['label']!,
                        style: textTheme.labelSmall?.copyWith(
                          fontSize: 10,
                          color: isSelected ? colorScheme.primary : colorScheme.onSurfaceVariant,
                          fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: NoviSpacing.space16),

          // Custom Image URL Toggle / Input
          Row(
            children: [
              Icon(
                Icons.link_rounded,
                size: 16,
                color: _isCustomUrlMode ? colorScheme.primary : colorScheme.onSurfaceVariant,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Or use custom image URL',
                  style: textTheme.bodySmall?.copyWith(
                    color: _isCustomUrlMode ? colorScheme.onSurface : colorScheme.onSurfaceVariant,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              Switch.adaptive(
                value: _isCustomUrlMode,
                onChanged: (val) {
                  setState(() {
                    _isCustomUrlMode = val;
                    if (val && _urlController.text.trim().isNotEmpty) {
                      _selectedAvatar = _urlController.text.trim();
                    }
                  });
                },
              ),
            ],
          ),

          if (_isCustomUrlMode) ...[
            const SizedBox(height: NoviSpacing.space8),
            TextField(
              controller: _urlController,
              decoration: const InputDecoration(
                hintText: 'https://example.com/avatar.jpg',
                prefixIcon: Icon(Icons.image_outlined, size: 20),
              ),
              onChanged: (val) {
                setState(() {
                  _selectedAvatar = val.trim();
                });
              },
            ),
          ],

          const SizedBox(height: NoviSpacing.space24),

          // Action Buttons
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Cancel'),
                ),
              ),
              const SizedBox(width: NoviSpacing.space12),
              Expanded(
                flex: 2,
                child: FilledButton(
                  onPressed: _handleSave,
                  child: const Text('Save Profile'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
