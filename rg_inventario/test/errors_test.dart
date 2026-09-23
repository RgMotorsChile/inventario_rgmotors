import 'package:flutter_test/flutter_test.dart';
import 'package:rg_inventario/config.dart';
import 'package:rg_inventario/services/errors.dart';

void main() {
  test('traduce login inválido', () {
    expect(friendlyError(Exception('Invalid login credentials')), 'Correo o contraseña incorrectos.');
  });

  test('traduce corte de red', () {
    expect(friendlyError(Exception('Failed host lookup: example')), contains('Sin conexión'));
  });

  test('saca el prefijo Exception de Postgres', () {
    expect(friendlyError(Exception('No se puede eliminar: tiene entregas abiertas.')), 'No se puede eliminar: tiene entregas abiertas.');
  });

  test('sin dart-defines la app no se considera configurada', () {
    expect(AppConfig.isConfigured, isFalse);
    expect(AppConfig.supabaseAnonKey, isEmpty);
  });
}
