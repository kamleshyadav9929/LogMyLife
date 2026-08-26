import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/database/local_store.dart';
import '../../domain/models/focus_models.dart';
import '../../services/timer_engine.dart';

/// NOVI — Ambient Focus Audio Mixer
/// Minimalist, non-colourful multitrack soundscape controller with 6 discrete channels
/// (Rain, Brown noise, Forest, Waves, Cafe, Fireplace), subtle presets, and custom mix creation.

class AmbientSoundMixerModal extends StatefulWidget {
  final SoundscapeMix initialMix;
  final ValueChanged<SoundscapeMix> onMixChanged;

  const AmbientSoundMixerModal({
    super.key,
    required this.initialMix,
    required this.onMixChanged,
  });

  static Future<SoundscapeMix?> show(
    BuildContext context, {
    required SoundscapeMix initialMix,
    required ValueChanged<SoundscapeMix> onMixChanged,
  }) {
    return showModalBottomSheet<SoundscapeMix>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      showDragHandle: false,
      backgroundColor: Colors.transparent,
      builder: (ctx) => AmbientSoundMixerModal(
        initialMix: initialMix,
        onMixChanged: onMixChanged,
      ),
    );
  }

  @override
  State<AmbientSoundMixerModal> createState() => _AmbientSoundMixerModalState();
}

class _AmbientSoundMixerModalState extends State<AmbientSoundMixerModal> {
  late SoundscapeMix _currentMix;
  List<SoundscapeMix> _savedMixes = [];
  final TextEditingController _customNameController = TextEditingController();
  bool _isSavingMix = false;

  @override
  void initState() {
    super.initState();
    _currentMix = widget.initialMix;
    _loadSavedMixes();
  }

  @override
  void dispose() {
    _customNameController.dispose();
    super.dispose();
  }

  Future<void> _loadSavedMixes() async {
    final list = await LocalStore.getSoundMixes();
    if (mounted) {
      setState(() => _savedMixes = list);
    }
  }

  void _updateMix(SoundscapeMix newMix) {
    setState(() => _currentMix = newMix);
    widget.onMixChanged(newMix);
    LocalStore.saveActiveSoundMix(newMix);
    TimerEngine.setSoundMix(newMix);
  }

  void _applyPreset(SoundscapeMix preset) {
    NoviHaptics.selection();
    _updateMix(preset);
  }

  Future<void> _saveCurrentMix() async {
    final name = _customNameController.text.trim();
    if (name.isEmpty) return;

    final newMix = _currentMix.copyWith(
      id: 'mix_${DateTime.now().millisecondsSinceEpoch}',
      name: name,
      isCustom: true,
    );

    final updatedList = List<SoundscapeMix>.from(_savedMixes)..add(newMix);
    await LocalStore.saveSoundMixes(updatedList);
    _customNameController.clear();

    if (mounted) {
      setState(() {
        _savedMixes = updatedList;
        _currentMix = newMix;
        _isSavingMix = false;
      });
      NoviHaptics.success();
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final textTheme = theme.textTheme;

    return Container(
      decoration: BoxDecoration(
        color: theme.scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(NoviShapes.radiusSheet)),
      ),
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom + NoviSpacing.space20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Drag handle
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: NoviSpacing.space12, bottom: NoviSpacing.space8),
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: colorScheme.outlineVariant,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: NoviSpacing.space20, vertical: NoviSpacing.space8),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: colorScheme.surfaceContainerHigh,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(Icons.tune_rounded, color: colorScheme.onSurfaceVariant, size: 20),
                ),
                const SizedBox(width: NoviSpacing.space12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Ambient Sound Mixer',
                        style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                      ),
                      Text(
                        _currentMix.name,
                        style: textTheme.bodySmall?.copyWith(
                          color: colorScheme.onSurfaceVariant,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
                // Master Mute / Active toggle
                IconButton.filledTonal(
                  onPressed: () {
                    NoviHaptics.light();
                    _updateMix(_currentMix.copyWith(isMuted: !_currentMix.isMuted));
                  },
                  icon: Icon(
                    _currentMix.isMuted ? Icons.volume_off_rounded : Icons.volume_up_rounded,
                    color: _currentMix.isMuted ? colorScheme.error : colorScheme.onSurface,
                    size: 20,
                  ),
                  tooltip: _currentMix.isMuted ? 'Unmute' : 'Mute',
                ),
              ],
            ),
          ),

          const SizedBox(height: NoviSpacing.space6),

          // Soundscape Presets Bar (Muted, Clean Chips)
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: NoviSpacing.space20),
            child: Row(
              children: _savedMixes.map((preset) {
                final isSelected = _currentMix.id == preset.id || _currentMix.name == preset.name;
                return Padding(
                  padding: const EdgeInsets.only(right: NoviSpacing.space8),
                  child: ChoiceChip(
                    label: Text(preset.name),
                    selected: isSelected,
                    onSelected: (_) => _applyPreset(preset),
                    avatar: Icon(
                      isSelected ? Icons.check_circle_rounded : Icons.graphic_eq_rounded,
                      size: 15,
                      color: isSelected ? colorScheme.onPrimary : colorScheme.onSurfaceVariant,
                    ),
                    selectedColor: colorScheme.primary,
                    backgroundColor: colorScheme.surfaceContainerLow,
                    side: BorderSide(
                      color: isSelected
                          ? colorScheme.primary
                          : colorScheme.outlineVariant.withValues(alpha: 0.5),
                    ),
                    labelStyle: TextStyle(
                      color: isSelected ? colorScheme.onPrimary : colorScheme.onSurface,
                      fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                      fontSize: 12.5,
                    ),
                  ),
                );
              }).toList(),
            ),
          ),

          const SizedBox(height: NoviSpacing.space12),

          // 6 Audio Track Sliders — Clean, Grouped Container (Zero Card Soup & Zero Rainbow Colors)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: NoviSpacing.space20),
            child: Container(
              decoration: BoxDecoration(
                color: colorScheme.surfaceContainer,
                borderRadius: BorderRadius.circular(NoviShapes.radiusMedium),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _buildChannelItem(
                    title: 'Rain Storm',
                    icon: Icons.water_drop_outlined,
                    value: _currentMix.rainVolume,
                    onChanged: (val) => _updateMix(_currentMix.copyWith(rainVolume: val)),
                  ),
                  _buildDivider(),
                  _buildChannelItem(
                    title: 'Brown Noise',
                    icon: Icons.headphones_outlined,
                    value: _currentMix.brownNoiseVolume,
                    onChanged: (val) => _updateMix(_currentMix.copyWith(brownNoiseVolume: val)),
                  ),
                  _buildDivider(),
                  _buildChannelItem(
                    title: 'Deep Forest',
                    icon: Icons.park_outlined,
                    value: _currentMix.forestVolume,
                    onChanged: (val) => _updateMix(_currentMix.copyWith(forestVolume: val)),
                  ),
                  _buildDivider(),
                  _buildChannelItem(
                    title: 'Ocean Waves',
                    icon: Icons.waves_outlined,
                    value: _currentMix.wavesVolume,
                    onChanged: (val) => _updateMix(_currentMix.copyWith(wavesVolume: val)),
                  ),
                  _buildDivider(),
                  _buildChannelItem(
                    title: 'Warm Cafe',
                    icon: Icons.coffee_outlined,
                    value: _currentMix.cafeVolume,
                    onChanged: (val) => _updateMix(_currentMix.copyWith(cafeVolume: val)),
                  ),
                  _buildDivider(),
                  _buildChannelItem(
                    title: 'Cozy Fireplace',
                    icon: Icons.local_fire_department_outlined,
                    value: _currentMix.fireplaceVolume,
                    onChanged: (val) => _updateMix(_currentMix.copyWith(fireplaceVolume: val)),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: NoviSpacing.space12),

          // Save Custom Mix Section
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: NoviSpacing.space20),
            child: _isSavingMix
                ? Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _customNameController,
                          autofocus: true,
                          decoration: InputDecoration(
                            hintText: 'e.g. My Deep Focus Mix',
                            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(NoviShapes.radiusMedium),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: NoviSpacing.space8),
                      FilledButton(
                        onPressed: _saveCurrentMix,
                        child: const Text('Save'),
                      ),
                      IconButton(
                        onPressed: () => setState(() => _isSavingMix = false),
                        icon: const Icon(Icons.close_rounded),
                      ),
                    ],
                  )
                : OutlinedButton.icon(
                    onPressed: () => setState(() => _isSavingMix = true),
                    icon: const Icon(Icons.bookmark_add_outlined, size: 18),
                    label: const Text('Save as Custom Soundscape'),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildDivider() {
    final colorScheme = Theme.of(context).colorScheme;
    return Divider(
      height: 1,
      thickness: 1,
      indent: 48,
      endIndent: 12,
      color: colorScheme.outlineVariant.withValues(alpha: 0.4),
    );
  }

  Widget _buildChannelItem({
    required String title,
    required IconData icon,
    required double value,
    required ValueChanged<double> onChanged,
  }) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final textTheme = theme.textTheme;
    final isActive = value > 0 && !_currentMix.isMuted;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: NoviSpacing.space12, vertical: NoviSpacing.space6),
      child: Row(
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: isActive
                  ? colorScheme.primary.withValues(alpha: 0.12)
                  : colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
              shape: BoxShape.circle,
            ),
            child: Icon(
              icon,
              size: 15,
              color: isActive ? colorScheme.primary : colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(width: NoviSpacing.space10),
          SizedBox(
            width: 88,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  title,
                  style: textTheme.bodySmall?.copyWith(
                    fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
                    color: isActive ? colorScheme.onSurface : colorScheme.onSurfaceVariant,
                    fontSize: 13,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  '${(value * 100).round()}%',
                  style: textTheme.labelSmall?.copyWith(
                    color: isActive ? colorScheme.primary : colorScheme.onSurfaceVariant.withValues(alpha: 0.6),
                    fontWeight: FontWeight.w600,
                    fontSize: 11,
                    fontFeatures: const [FontFeature.tabularFigures()],
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: SliderTheme(
              data: SliderTheme.of(context).copyWith(
                activeTrackColor: isActive ? colorScheme.primary : colorScheme.onSurfaceVariant,
                thumbColor: isActive ? colorScheme.primary : colorScheme.onSurfaceVariant,
                inactiveTrackColor: colorScheme.surfaceContainerHighest,
                trackHeight: 3.5,
                thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 5.5),
                overlayShape: const RoundSliderOverlayShape(overlayRadius: 12.0),
              ),
              child: Slider(
                value: value,
                min: 0.0,
                max: 1.0,
                onChanged: (v) {
                  NoviHaptics.light();
                  onChanged(v);
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}
