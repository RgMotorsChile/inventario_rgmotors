import 'dart:async';
import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart' as sb;

import '../config.dart';
import '../models/models.dart';
import '../services/errors.dart';

class InventoryStore extends ChangeNotifier {
  InventoryStore();

  final Dio _http = Dio();

  bool loading = true;
  String? error;
  Profile? profile;
  List<StockItem> items = [];
  List<VehicleUnit> vehicles = [];
  List<StockMovement> movements = [];
  List<WarehouseBox> boxes = [];
  List<Worker> workers = [];
  List<Assignment> assignments = [];
  List<String> categories = [];

  bool get isManagement => profile?.isManagement ?? false;
  bool get isActiveStaff => profile?.active == true && !isManagement;
  bool offlineCache = false;
  bool get usingSupabaseBridge => AppConfig.useBodegaApi;

  Timer? _poll;
  bool _refreshing = false;

  String? get _userId => sb.Supabase.instance.client.auth.currentUser?.id;

  String? get _userEmail => sb.Supabase.instance.client.auth.currentUser?.email ?? '';

  String? get _accessToken => sb.Supabase.instance.client.auth.currentSession?.accessToken;

  Future<Map<String, dynamic>> _bodegaGet(String path) async {
    final token = _accessToken;
    if (token == null || token.isEmpty) {
      throw StateError('Sin token de sesión');
    }
    final res = await _http.get(
      '${AppConfig.resolvedBodegaApiUrl}$path',
      options: Options(headers: {'Authorization': 'Bearer $token'}),
    );
    final data = res.data;
    if (data is Map<String, dynamic>) return data;
    if (data is Map) return Map<String, dynamic>.from(data);
    throw StateError('Respuesta inválida del API bodega');
  }

  Future<dynamic> _bodegaRpc(String fn, Map<String, dynamic> args) async {
    final token = _accessToken;
    if (token == null || token.isEmpty) {
      throw StateError('Sin token de sesión');
    }
    final res = await _http.post(
      '${AppConfig.resolvedBodegaApiUrl}/api/rpc',
      data: {'fn': fn, 'params': args},
      options: Options(headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      }),
    );
    final body = res.data;
    if (body is Map && body['error'] != null) {
      throw StateError(body['error'].toString());
    }
    if (body is Map) return body['data'];
    return body;
  }

  StockItem? itemBySku(String sku) {
    for (final item in items) {
      if (item.sku == sku) return item;
    }
    return null;
  }

  WarehouseBox? boxByCode(String code) {
    final needle = code.trim().toUpperCase();
    for (final box in boxes) {
      if (box.code.toUpperCase() == needle || box.barcode.toUpperCase() == needle) {
        return box;
      }
    }
    return null;
  }

  List<StockItem> get lowItems => items.where((i) => i.status != 'ok').toList();

  List<String> get stockedCategories {
    final names = items.map((i) => i.category.trim()).where((c) => c.isNotEmpty).toSet().toList();
    names.sort((a, b) => a.toLowerCase().compareTo(b.toLowerCase()));
    return names;
  }

  List<StockItem> itemsInCategory(String category) {
    final rows = items.where((i) => i.category == category).toList();
    rows.sort((a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()));
    return rows;
  }

  double get warehouseValue =>
      items.fold(0, (sum, item) => sum + item.stock * item.unitCost);

  int get usesToday {
    final now = DateTime.now();
    return movements.where((m) {
      return m.isUse &&
          m.createdAt.year == now.year &&
          m.createdAt.month == now.month &&
          m.createdAt.day == now.day;
    }).length;
  }

  List<VehicleUnit> get preparing =>
      vehicles.where((v) => v.status == 'En preparación').toList();

  List<StockMovement> movementsForSku(String sku) =>
      movements.where((m) => m.itemSku == sku).toList();

  Worker? workerById(String id) {
    for (final w in workers) {
      if (w.id == id) return w;
    }
    return null;
  }

  List<Assignment> get openAssignments =>
      assignments.where((a) => a.isOpen).toList();

  List<Assignment> assignmentsForWorker(String workerId) =>
      openAssignments.where((a) => a.workerId == workerId).toList();

  List<Assignment> get staleAssignments =>
      openAssignments.where((a) => a.daysOpen >= 3).toList();

  int get qtyInCustody => openAssignments.fold(0, (sum, a) => sum + a.qty);

  double get custodyValue => openAssignments.fold(0, (sum, a) {
        final item = itemBySku(a.itemSku);
        return sum + (item?.unitCost ?? 0) * a.qty;
      });

  List<StockMovement> movementsForWorker(String workerId) =>
      movements.where((m) => m.workerId == workerId).toList();

  List<StockMovement> movementsForPlate(String plate) {
    final norm = plate.replaceAll(RegExp(r'[^A-Za-z0-9]'), '').toUpperCase();
    return movements.where((m) {
      final p = (m.plate ?? '').replaceAll(RegExp(r'[^A-Za-z0-9]'), '').toUpperCase();
      return p == norm;
    }).toList();
  }

  Future<void> start() async {
    await refresh();
    _poll?.cancel();
    _poll = Timer.periodic(const Duration(seconds: 12), (_) {
      if (_userId == null) return;
      refresh();
    });
  }

  List<Map<String, dynamic>> _asMaps(dynamic data) {
    if (data is List) {
      return data.whereType<Map>().map((row) => Map<String, dynamic>.from(row)).toList();
    }
    if (data is Map) {
      final inner = data['data'];
      if (inner is List) {
        return inner.whereType<Map>().map((row) => Map<String, dynamic>.from(row)).toList();
      }
      return [Map<String, dynamic>.from(data)];
    }
    return [];
  }

  Map<String, dynamic>? _asMap(dynamic data) {
    if (data is Map<String, dynamic>) return data;
    if (data is Map) return Map<String, dynamic>.from(data);
    final rows = _asMaps(data);
    return rows.isEmpty ? null : rows.first;
  }

  Future<void> refresh() async {
    final userId = _userId;
    final email = _userEmail ?? '';
    if (userId == null) {
      _clearSession();
      loading = false;
      notifyListeners();
      return;
    }
    if (_refreshing) return;
    _refreshing = true;
    error = null;
    if (items.isEmpty) {
      loading = true;
      notifyListeners();
    }
    try {
      await _refreshFromBodegaApi(userId, email);
      await _saveCache();
      offlineCache = false;
    } catch (e) {
      error = friendlyError(e);
      await _loadCache();
    } finally {
      _refreshing = false;
      loading = false;
      notifyListeners();
    }
  }

  Future<void> _refreshFromBodegaApi(String userId, String email) async {
    final snap = await _bodegaGet('/api/bodega/snapshot');
    items = _asMaps(snap['items']).map(StockItem.fromMap).toList();
    vehicles = _asMaps(snap['vehicles']).map(VehicleUnit.fromMap).toList();
    movements = _asMaps(snap['movements']).map(StockMovement.fromMap).toList();
    final lines = _asMaps(snap['box_lines']);
    boxes = _asMaps(snap['boxes']).map((box) {
      final boxLines = lines
          .where((line) => line['box_id'] == box['id'])
          .map(BoxLine.fromMap)
          .toList();
      return WarehouseBox.fromMap(box, boxLines);
    }).toList();
    workers = _asMaps(snap['workers']).map(Worker.fromMap).toList();
    assignments = _asMaps(snap['assignments']).map(Assignment.fromMap).toList();
    final categoryRows = _asMaps(snap['categories']);
    final fromTable = categoryRows.map((r) => r['name'] as String).toList();
    final fromItems = items.map((i) => i.category).toSet().toList()..sort();
    categories = {...fromTable, ...fromItems}.toList()..sort();
    final profileMap = snap['profile'] is Map
        ? Map<String, dynamic>.from(snap['profile'] as Map)
        : null;
    profile = profileMap != null
        ? Profile.fromMap(profileMap)
        : Profile(
            id: userId,
            fullName: email.split('@').first,
            role: 'bodega',
            active: true,
          );
  }

  Future<dynamic> _rpc(String fn, Map<String, dynamic> args) {
    return _bodegaRpc(fn, args);
  }

  Future<void> useItem({
    required String sku,
    required int qty,
    required String plate,
    String? note,
  }) async {
    await _rpc('use_item', {
      'p_sku': sku,
      'p_qty': qty,
      'p_plate': plate,
      'p_note': note,
    });
    await refresh();
  }

  Future<void> receiveItem({
    required String sku,
    required int qty,
    String? note,
    Uint8List? photoBytes,
  }) {
    return receiveStock(qty: qty, sku: sku, note: note, photoBytes: photoBytes);
  }

  Future<void> _uploadEvidence(String path, Uint8List bytes) async {
    await sb.Supabase.instance.client.storage.from('box-evidence').uploadBinary(
          path,
          bytes,
          fileOptions: const sb.FileOptions(
            contentType: 'image/jpeg',
            upsert: true,
          ),
        );
  }

  Future<void> receiveStock({
    required int qty,
    String? sku,
    String? name,
    String? category,
    String? note,
    Uint8List? photoBytes,
  }) async {
    final row = await _rpc('receive_stock', {
      'p_qty': qty,
      'p_sku': sku,
      'p_name': name,
      'p_category': category,
      'p_note': note,
    });
    if (photoBytes != null && photoBytes.isNotEmpty) {
      try {
        final map = _asMap(row);
        final movementId = map?['id'] as String?;
        final itemSku = (map?['item_sku'] as String?) ?? sku ?? 'nuevo';
        final path =
            'rg-motors/receive/$itemSku/${DateTime.now().millisecondsSinceEpoch}.jpg';
        await _uploadEvidence(path, photoBytes);
        if (movementId != null) {
          await _rpc('attach_receive_photo', {
            'p_movement_id': movementId,
            'p_sku': itemSku,
            'p_qty': qty,
            'p_storage_path': path,
          });
        }
      } catch (_) {}
    }
    await refresh();
  }

  Future<void> correctDeliveryPlate({
    required String movementId,
    required String plate,
    String? note,
  }) async {
    await _rpc('correct_delivery_plate', {
      'p_movement_id': movementId,
      'p_plate': plate,
      'p_note': note,
    });
    await refresh();
  }

  Future<void> deliverItem({
    required String sku,
    required int qty,
    required String workerId,
    String? plate,
    required String outcome,
    String? note,
  }) async {
    await _rpc('deliver_item', {
      'p_sku': sku,
      'p_qty': qty,
      'p_worker_id': workerId,
      'p_plate': plate,
      'p_outcome': outcome,
      'p_note': note,
    });
    await refresh();
  }

  Future<void> assignItem({
    required String sku,
    required int qty,
    required String workerId,
    String? note,
  }) async {
    await _rpc('assign_item', {
      'p_sku': sku,
      'p_qty': qty,
      'p_worker_id': workerId,
      'p_note': note,
    });
    await refresh();
  }

  Future<void> returnAssignment(String assignmentId, {String? note}) async {
    await _rpc('return_assignment', {
      'p_assignment_id': assignmentId,
      'p_note': note,
    });
    await refresh();
  }

  Future<void> receiveBox({
    required String code,
    List<String> skipped = const [],
    Uint8List? evidenceBytes,
  }) async {
    final box = boxByCode(code);
    await _rpc('receive_box', {
      'p_code': code,
      'p_skipped': skipped,
    });
    if (evidenceBytes != null && evidenceBytes.isNotEmpty && box != null) {
      try {
        final path =
            'rg-motors/boxes/${box.id}/${DateTime.now().millisecondsSinceEpoch}.jpg';
        await _uploadEvidence(path, evidenceBytes);
        await _rpc('attach_box_evidence', {
          'p_box_id': box.id,
          'p_storage_path': path,
        });
      } catch (_) {}
    }
    await refresh();
  }

  Future<void> _saveCache() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      'rg_cache',
      jsonEncode({
        'items': items.map((i) => {
              'sku': i.sku,
              'name': i.name,
              'category': i.category,
              'brand': i.brand,
              'stock': i.stock,
              'min_stock': i.minStock,
              'location': i.location,
              'unit_cost': i.unitCost,
              'compatible': i.compatible,
            }).toList(),
      }),
    );
  }

  Future<void> _loadCache() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString('rg_cache');
    if (raw == null) return;
    try {
      final data = jsonDecode(raw) as Map<String, dynamic>;
      final cached = (data['items'] as List?)?.cast<Map<String, dynamic>>() ?? [];
      if (cached.isEmpty) return;
      items = cached.map(StockItem.fromMap).toList();
      offlineCache = true;
    } catch (_) {}
  }

  void _clearSession() {
    profile = null;
    items = [];
    vehicles = [];
    movements = [];
    boxes = [];
    workers = [];
    assignments = [];
    categories = [];
    error = null;
    offlineCache = false;
    _refreshing = false;
  }

  Future<void> signOut() async {
    _poll?.cancel();
    _poll = null;
    _clearSession();
    notifyListeners();
    await sb.Supabase.instance.client.auth.signOut();
  }

  @override
  void dispose() {
    _poll?.cancel();
    super.dispose();
  }
}
