import 'package:flutter_test/flutter_test.dart';
import 'package:rg_inventario/main.dart';
import 'package:rg_inventario/widgets/widgets.dart';

void main() {
  testWidgets('muestra la pantalla de configuración sin claves de InsForge', (tester) async {
    await tester.pumpWidget(const RgInventarioApp());
    expect(find.textContaining('INSFORGE'), findsWidgets);
    expect(find.byType(RgLogo), findsOneWidget);
  });
}
