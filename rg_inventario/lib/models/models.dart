class StockItem {
  const StockItem({
    required this.sku,
    required this.name,
    required this.category,
    required this.brand,
    required this.stock,
    required this.minStock,
    required this.location,
    required this.unitCost,
    required this.compatible,
  });

  final String sku;
  final String name;
  final String category;
  final String brand;
  final int stock;
  final int minStock;
  final String location;
  final double unitCost;
  final String compatible;

  String get status {
    if (stock <= 0) return 'out';
    if (stock <= minStock) return 'low';
    return 'ok';
  }

  String get statusLabel {
    switch (status) {
      case 'out':
        return 'Sin stock';
      case 'low':
        return 'Stock bajo';
      default:
        return 'En nivel';
    }
  }

  factory StockItem.fromMap(Map<String, dynamic> map) {
    return StockItem(
      sku: map['sku'] as String,
      name: map['name'] as String,
      category: map['category'] as String,
      brand: map['brand'] as String,
      stock: (map['stock'] as num).toInt(),
      minStock: (map['min_stock'] as num).toInt(),
      location: map['location'] as String,
      unitCost: (map['unit_cost'] as num).toDouble(),
      compatible: map['compatible'] as String? ?? '',
    );
  }
}

class VehicleUnit {
  const VehicleUnit({
    required this.id,
    required this.plate,
    required this.brand,
    required this.model,
    required this.year,
    required this.color,
    required this.status,
  });

  final String id;
  final String plate;
  final String brand;
  final String model;
  final int year;
  final String color;
  final String status;

  String get title => '$brand $model';

  factory VehicleUnit.fromMap(Map<String, dynamic> map) {
    return VehicleUnit(
      id: map['id'] as String,
      plate: map['plate'] as String,
      brand: map['brand'] as String,
      model: map['model'] as String,
      year: (map['year'] as num).toInt(),
      color: map['color'] as String,
      status: map['status'] as String,
    );
  }
}

class Worker {
  const Worker({
    required this.id,
    required this.fullName,
    required this.jobTitle,
    required this.active,
  });

  final String id;
  final String fullName;
  final String jobTitle;
  final bool active;

  factory Worker.fromMap(Map<String, dynamic> map) {
    return Worker(
      id: map['id'] as String,
      fullName: map['full_name'] as String,
      jobTitle: map['job_title'] as String? ?? 'Taller',
      active: map['active'] as bool? ?? true,
    );
  }
}

class Assignment {
  const Assignment({
    required this.id,
    required this.itemSku,
    required this.qty,
    required this.workerId,
    required this.status,
    this.note,
    required this.createdAt,
    this.returnedAt,
  });

  final String id;
  final String itemSku;
  final int qty;
  final String workerId;
  final String status;
  final String? note;
  final DateTime createdAt;
  final DateTime? returnedAt;

  bool get isOpen => status == 'abierta';
  int get daysOpen => DateTime.now().difference(createdAt).inDays;

  factory Assignment.fromMap(Map<String, dynamic> map) {
    return Assignment(
      id: map['id'] as String,
      itemSku: map['item_sku'] as String,
      qty: (map['qty'] as num).toInt(),
      workerId: map['worker_id'] as String,
      status: map['status'] as String,
      note: map['note'] as String?,
      createdAt: DateTime.parse(map['created_at'] as String).toLocal(),
      returnedAt: map['returned_at'] == null
          ? null
          : DateTime.parse(map['returned_at'] as String).toLocal(),
    );
  }
}

class StockMovement {
  const StockMovement({
    required this.id,
    required this.type,
    required this.itemSku,
    required this.qty,
    this.plate,
    this.workerId,
    this.workerName,
    this.note,
    required this.userName,
    required this.createdAt,
  });

  final String id;
  final String type;
  final String itemSku;
  final int qty;
  final String? plate;
  final String? workerId;
  final String? workerName;
  final String? note;
  final String userName;
  final DateTime createdAt;

  bool get isUse => type == 'uso';
  bool get isAssign => type == 'asignacion';
  bool get isReturn => type == 'devolucion';

  String get destination {
    if (isUse) return plate == null ? 'Unidad' : 'Unidad $plate';
    if (isAssign) return 'Trabajador ${workerName ?? ''}';
    if (isReturn) return 'Devolución ${workerName ?? ''}';
    return note ?? 'Ingreso a bodega';
  }

  factory StockMovement.fromMap(Map<String, dynamic> map) {
    return StockMovement(
      id: map['id'] as String,
      type: map['type'] as String,
      itemSku: map['item_sku'] as String,
      qty: (map['qty'] as num).toInt(),
      plate: map['plate'] as String?,
      workerId: map['worker_id'] as String?,
      workerName: map['worker_name'] as String?,
      note: map['note'] as String?,
      userName: map['user_name'] as String? ?? 'Bodega',
      createdAt: DateTime.parse(map['created_at'] as String).toLocal(),
    );
  }
}

class WarehouseBox {
  const WarehouseBox({
    required this.id,
    required this.code,
    required this.barcode,
    required this.supplier,
    required this.guide,
    this.receivedAt,
    required this.lines,
  });

  final String id;
  final String code;
  final String barcode;
  final String supplier;
  final String guide;
  final DateTime? receivedAt;
  final List<BoxLine> lines;

  bool get received => receivedAt != null;
  int get totalQty => lines.fold(0, (sum, line) => sum + line.qty);

  factory WarehouseBox.fromMap(Map<String, dynamic> map, [List<BoxLine> lines = const []]) {
    return WarehouseBox(
      id: map['id'] as String,
      code: map['code'] as String,
      barcode: map['barcode'] as String,
      supplier: map['supplier'] as String,
      guide: map['guide'] as String,
      receivedAt: map['received_at'] == null
          ? null
          : DateTime.parse(map['received_at'] as String).toLocal(),
      lines: lines,
    );
  }
}

class BoxLine {
  const BoxLine({required this.itemSku, required this.qty});

  final String itemSku;
  final int qty;

  factory BoxLine.fromMap(Map<String, dynamic> map) {
    return BoxLine(
      itemSku: map['item_sku'] as String,
      qty: (map['qty'] as num).toInt(),
    );
  }
}

class Profile {
  const Profile({
    required this.id,
    required this.fullName,
    required this.role,
    this.active = false,
  });

  final String id;
  final String fullName;
  final String role;
  final bool active;

  bool get isManagement => role == 'jefatura' || role == 'admin';
  String get roleLabel => isManagement ? 'Jefatura' : 'Encargado de bodega';

  factory Profile.fromMap(Map<String, dynamic> map) {
    return Profile(
      id: map['id'] as String,
      fullName: map['full_name'] as String,
      role: map['role'] as String,
      active: map['active'] as bool? ?? false,
    );
  }
}
