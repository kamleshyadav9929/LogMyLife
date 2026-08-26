import 'package:flutter/material.dart';
import '../../domain/models/models.dart';
import 'novi_banner.dart';

/// Legacy alias for NoviBanner
class RescheduleBanner extends StatelessWidget {
  final RescheduleEvent event;
  final VoidCallback onUndo;
  final VoidCallback onDismiss;

  const RescheduleBanner({
    super.key,
    required this.event,
    required this.onUndo,
    required this.onDismiss,
  });

  @override
  Widget build(BuildContext context) {
    return NoviBanner(
      event: event,
      onUndo: onUndo,
      onDismiss: onDismiss,
    );
  }
}
