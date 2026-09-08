import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/models.dart';
import '../services/errors.dart';

class InventoryStore extends ChangeNotifier {
  InventoryStore(this._client);

  final SupabaseClient _client;

  bool loading = true;
  String? error;
  Profile? profile;
  List<StockItem> items = [];
  List<VehicleUnit> vehicles = [];
  List<StockMovement> movements = [];
  List<WarehouseBox> boxes = [];
  List<Worker> workers = [];
  List<Assignment> assignments = [];

  bool get isManagement => profile?.isManagement ?? false;
  bool get isActiveStaff => profile?.active == true && !isManagement;
  bool offlineCache = false;

  RealtimeChannel? _channel;

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
    _listenRealtime();
  }

  Future<void> refresh() async {
    loading = true;
    error = null;
    notifyListeners();
    try {
      final user = _client.auth.currentUser;
      final itemRows = await _client.from('items').select().order('name');
      final vehicleRows = await _client.from('vehicles').select().order('brand');
      final movementRows = await _client
          .from('movements')
          .select()
          .order('created_at', ascending: false)
          .limit(500);
      final boxRows = await _client.from('boxes').select().order('created_at', ascending: false);
      final lineRows = await _client.from('box_lines').select();
      final workerRows = await _client.from('workers').select().order('full_name');
      final assignmentRows = await _client.from('assignments').select().order('created_at', ascending: false);
      final profileMap = user == null
          ? null
          : await _client.from('profiles').select().eq('id', user.id).maybeSingle();

      items = (itemRows as List).cast<Map<String, dynamic>>().map(StockItem.fromMap).toList();
      vehicles = (vehicleRows as List).cast<Map<String, dynamic>>().map(VehicleUnit.fromMap).toList();
      movements = (movementRows as List).cast<Map<String, dynamic>>().map(StockMovement.fromMap).toList();

      final lines = (lineRows as List).cast<Map<String, dynamic>>();
      boxes = (boxRows as List).cast<Map<String, dynamic>>().map((box) {
        final boxLines = lines
            .where((line) => line['box_id'] == box['id'])
            .map(BoxLine.fromMap)
            .toList();
        return WarehouseBox.fromMap(box, boxLines);
      }).toList();
      workers = (workerRows as List).cast<Map<String, dynamic>>().map(Worker.fromMap).toList();
      assignments = (assignmentRows as List).cast<Map<String, dynamic>>().map(Assignment.fromMap).toList();
      profile = profileMap is Map<String, dynamic>
          ? Profile.fromMap(profileMap)
          : Profile(
              id: user?.id ?? '',
              fullName: user?.email?.split('@').first ?? 'Bodega',
              role: 'bodega',
            );
      await _saveCache();
      offlineCache = false;
    } catch (e) {
      error = friendlyError(e);
      await _loadCache();
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  void _listenRealtime() {
    _channel?.unsubscribe();
    _channel = _client
        .channel('bodega-live')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'items',
          callback: (_) => refresh(),
        )
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'movements',
          callback: (_) => refresh(),
        )
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'boxes',
          callback: (_) => refresh(),
        )
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'assignments',
          callback: (_) => refresh(),
        )
        .subscribe();
  }

  Future<void> useItem({
    required String sku,
    required int qty,
    required String plate,
    String? note,
  }) async {
    await _client.rpc('use_item', params: {
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
  }) async {
    await _client.rpc('receive_item', params: {
      'p_sku': sku,
      'p_qty': qty,
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
    await _client.rpc('assign_item', params: {
      'p_sku': sku,
      'p_qty': qty,
      'p_worker_id': workerId,
      'p_note': note,
    });
    await refresh();
  }

  Future<void> returnAssignment(String assignmentId, {String? note}) async {
    await _client.rpc('return_assignment', params: {
      'p_assignment_id': assignmentId,
      'p_note': note,
    });
    await refresh();
  }

  Future<void> receiveBox({
    required String code,
    List<String> skipped = const [],
    File? evidence,
  }) async {
    final box = boxByCode(code);
    await _client.rpc('receive_box', params: {
      'p_code': code,
      'p_skipped': skipped,
    });
    if (evidence != null && box != null) {
      final path = '${box.id}/${DateTime.now().millisecondsSinceEpoch}.jpg';
      await _client.storage.from('box-evidence').upload(path, evidence);
      await _client.rpc('attach_box_evidence', params: {
        'p_box_id': box.id,
        'p_storage_path': path,
      });
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

  Future<void> signOut() async {
    await _channel?.unsubscribe();
    await _client.auth.signOut();
  }

  @override
  void dispose() {
    _channel?.unsubscribe();
    super.dispose();
  }
}
