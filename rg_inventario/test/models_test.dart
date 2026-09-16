import 'package:flutter_test/flutter_test.dart';
import 'package:rg_inventario/models/models.dart';

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
}
