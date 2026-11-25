import 'package:flutter_test/flutter_test.dart';
import 'package:rg_inventario/services/suspension.dart';

void main() {
  test('AppSuspensionStatus interpreta app_status', () {
    final suspended = AppSuspensionStatus.fromRow({
      'suspendido': true,
      'mensaje': 'Servicio suspendido temporalmente.',
    });
    expect(suspended.suspended, isTrue);
    expect(suspended.message, 'Servicio suspendido temporalmente.');

    expect(AppSuspensionStatus.fromRow({'suspendido': false}).suspended, isFalse);
    expect(AppSuspensionStatus.fromRow(null).suspended, isFalse);
  });
}
