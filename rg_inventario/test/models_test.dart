import 'package:flutter_test/flutter_test.dart';
import 'package:rg_inventario/models/models.dart';
import 'package:rg_inventario/services/app_version.dart';

StockItem item({int stock = 4, int min = 2, double cost = 1000}) {
  return StockItem(
    sku: 'BAR-HILUX',
    name: 'Barra Hilux',
    category: 'Barras',
    brand: 'RG',
    stock: stock,
    minStock: min,
    location: 'Bodega',
    unitCost: cost,
    compatible: 'Hilux',
  );
}

void main() {
  test('stock sin unidades', () {
    expect(item(stock: 0).status, 'out');
    expect(item(stock: 0).statusLabel, 'Sin stock');
  });

  test('stock en el mínimo', () {
    expect(item(stock: 2, min: 2).status, 'low');
    expect(item(stock: 2, min: 2).statusLabel, 'Stock bajo');
  });

  test('stock en nivel', () {
    expect(item(stock: 9, min: 2).status, 'ok');
    expect(item(stock: 9).statusLabel, 'En nivel');
  });

  test('fromMap acepta costos enteros', () {
    final row = StockItem.fromMap({
      'sku': 'ASP-01',
      'name': 'Aspiradora',
      'category': 'Limpieza',
      'brand': 'Karcher',
      'stock': 1,
      'min_stock': 1,
      'location': 'Bodega',
      'unit_cost': 0,
    });
    expect(row.compatible, '');
    expect(row.unitCost, 0);
    expect(row.status, 'low');
  });

  test('patente y trabajador se leen del mapa', () {
    final worker = Worker.fromMap({
      'id': 'w1',
      'full_name': 'Pedro Saldivia',
      'job_title': 'Mecánico',
      'active': false,
    });
    expect(worker.active, isFalse);
    expect(worker.fullName, 'Pedro Saldivia');

    final asg = Assignment.fromMap({
      'id': 'a1',
      'item_sku': 'BAR-HILUX',
      'qty': 2,
      'worker_id': 'w1',
      'status': 'abierta',
      'created_at': DateTime.now().subtract(const Duration(days: 4)).toIso8601String(),
    });
    expect(asg.isOpen, isTrue);
    expect(asg.daysOpen, greaterThanOrEqualTo(4));
  });

  test('vehículo arma título', () {
    final unit = VehicleUnit.fromMap({
      'id': 'v1',
      'plate': 'THZF 75',
      'brand': 'Toyota',
      'model': 'Hilux',
      'year': 2022,
      'color': 'Blanco',
      'status': 'Disponible',
    });
    expect(unit.title, 'Toyota Hilux');
  });

  test('entrega a unidad se puede corregir las primeras 24 horas', () {
    final now = DateTime(2026, 9, 23, 12);
    final recent = StockMovement.fromMap({
      'id': 'm1',
      'type': 'uso',
      'item_sku': 'BAR-HILUX',
      'qty': 1,
      'plate': 'THZF 75',
      'created_at': now.subtract(const Duration(hours: 6)).toIso8601String(),
    });
    final old = StockMovement.fromMap({
      'id': 'm2',
      'type': 'uso',
      'item_sku': 'BAR-HILUX',
      'qty': 1,
      'plate': 'THLV 62',
      'created_at': now.subtract(const Duration(hours: 25)).toIso8601String(),
    });
    expect(recent.canCorrectPlate(now), isTrue);
    expect(old.canCorrectPlate(now), isFalse);
  });

  test('busca patente pegada o con espacio', () {
    const unit = VehicleUnit(
      id: '1',
      plate: 'RZVL 18',
      brand: 'Mitsubishi',
      model: 'L200',
      year: 2022,
      color: 'Rojo',
      status: 'Disponible',
    );
    expect(unit.matchesQuery('rzvl18'), isTrue);
    expect(unit.matchesQuery('RZVL-18'), isTrue);
    expect(unit.matchesQuery('hilux'), isFalse);
  });

  test('una APK nueva se detecta por build', () {
    expect(isNewerAppRelease(3, 4), isTrue);
    expect(isNewerAppRelease(4, 4), isFalse);
  });
}
