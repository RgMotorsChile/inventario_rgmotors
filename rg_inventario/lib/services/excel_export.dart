import 'dart:io';

import 'package:excel/excel.dart';
import 'package:intl/intl.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

import '../state/inventory_store.dart';
import '../widgets/widgets.dart';

Future<void> exportManagementExcel(InventoryStore store) async {
  final book = Excel.createExcel();
  book.rename('Sheet1', 'Stock');
  _stock(book['Stock'], store);
  _alerts(book['Alertas'], store);
  _metrics(book['Metricas'], store);
  _workers(book['En poder de trabajadores'], store);
  _vehicles(book['Usado en vehiculos'], store);
  _moves(book['Movimientos'], store);

  final bytes = book.encode();
  if (bytes == null) {
    throw Exception('No se pudo generar el Excel');
  }
  final stamp = DateFormat('yyyyMMdd_HHmm').format(DateTime.now());
  final dir = await getTemporaryDirectory();
  final file = File('${dir.path}/RG_Inventario_$stamp.xlsx');
  await file.writeAsBytes(bytes, flush: true);
  await Share.shareXFiles(
    [XFile(file.path)],
    subject: 'RG Motors · inventario completo',
    text: 'Stock, alertas, asignaciones a trabajadores y usos por patente.',
  );
}

List<CellValue> _row(List<Object?> values) {
  return values.map<CellValue>((v) {
    if (v is int) return IntCellValue(v);
    if (v is double) return DoubleCellValue(v);
    return TextCellValue(v?.toString() ?? '');
  }).toList();
}

void _stock(Sheet sheet, InventoryStore store) {
  sheet.appendRow(_row(['SKU', 'Elemento', 'Categoria', 'Marca', 'Stock', 'Minimo', 'Estado', 'Ubicacion', 'Costo', 'Valor', 'Compatible']));
  for (final item in store.items) {
    sheet.appendRow(_row([
      item.sku,
      item.name,
      item.category,
      item.brand,
      item.stock,
      item.minStock,
      item.statusLabel,
      item.location,
      item.unitCost,
      item.unitCost * item.stock,
      item.compatible,
    ]));
  }
}

void _alerts(Sheet sheet, InventoryStore store) {
  sheet.appendRow(_row(['Tipo', 'Detalle', 'SKU', 'Cantidad', 'Dias', 'Responsable']));
  for (final item in store.lowItems) {
    sheet.appendRow(_row([
      item.stock <= 0 ? 'Sin stock' : 'Stock bajo',
      item.name,
      item.sku,
      item.stock,
      '',
      'Bodega',
    ]));
  }
  for (final asg in store.staleAssignments) {
    final worker = store.workerById(asg.workerId);
    sheet.appendRow(_row([
      'Asignacion vencida',
      itemName(store.items, asg.itemSku),
      asg.itemSku,
      asg.qty,
      asg.daysOpen,
      worker?.fullName ?? asg.workerId,
    ]));
  }
}

void _metrics(Sheet sheet, InventoryStore store) {
  sheet.appendRow(_row(['Metrica', 'Valor']));
  sheet.appendRow(_row(['SKUs activos', store.items.length]));
  sheet.appendRow(_row(['Valor en bodega', store.warehouseValue]));
  sheet.appendRow(_row(['Criticos / bajos', store.lowItems.length]));
  sheet.appendRow(_row(['Usos de hoy', store.usesToday]));
  sheet.appendRow(_row(['Unidades en elementos de trabajadores', store.qtyInCustody]));
  sheet.appendRow(_row(['Valor en poder de trabajadores', store.custodyValue]));
  sheet.appendRow(_row(['Asignaciones abiertas', store.openAssignments.length]));
  sheet.appendRow(_row(['Asignaciones de 3+ dias', store.staleAssignments.length]));
  sheet.appendRow(_row(['Unidades en preparacion', store.preparing.length]));
}

void _workers(Sheet sheet, InventoryStore store) {
  sheet.appendRow(_row(['Trabajador', 'Cargo', 'SKU', 'Elemento', 'Cantidad', 'Desde', 'Dias', 'Nota']));
  for (final asg in store.openAssignments) {
    final worker = store.workerById(asg.workerId);
    sheet.appendRow(_row([
      worker?.fullName ?? '',
      worker?.jobTitle ?? '',
      asg.itemSku,
      itemName(store.items, asg.itemSku),
      asg.qty,
      DateFormat('yyyy-MM-dd HH:mm').format(asg.createdAt),
      asg.daysOpen,
      asg.note ?? '',
    ]));
  }
}

void _vehicles(Sheet sheet, InventoryStore store) {
  sheet.appendRow(_row(['Patente', 'Unidad', 'SKU', 'Elemento', 'Cantidad', 'Cuando', 'Quien registro']));
  for (final m in store.movements.where((m) => m.isUse)) {
    final vehicle = store.vehicles.where((v) => v.plate == m.plate);
    sheet.appendRow(_row([
      m.plate ?? '',
      vehicle.isEmpty ? '' : vehicle.first.title,
      m.itemSku,
      itemName(store.items, m.itemSku),
      m.qty,
      DateFormat('yyyy-MM-dd HH:mm').format(m.createdAt),
      m.userName,
    ]));
  }
}

void _moves(Sheet sheet, InventoryStore store) {
  sheet.appendRow(_row(['Fecha', 'Tipo', 'SKU', 'Elemento', 'Cantidad', 'Patente', 'Trabajador', 'Nota', 'Registrado por']));
  for (final m in store.movements) {
    sheet.appendRow(_row([
      DateFormat('yyyy-MM-dd HH:mm').format(m.createdAt),
      m.type,
      m.itemSku,
      itemName(store.items, m.itemSku),
      m.qty,
      m.plate ?? '',
      m.workerName ?? '',
      m.note ?? '',
      m.userName,
    ]));
  }
}
