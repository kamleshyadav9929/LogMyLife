import 'package:flutter_test/flutter_test.dart';
import 'package:logmylife/main.dart';

void main() {
  testWidgets('NoviApp smoke test', (WidgetTester tester) async {
    // Build NoviApp and trigger a frame.
    await tester.pumpWidget(const NoviApp());
    expect(find.byType(NoviApp), findsOneWidget);
  });
}
