import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/models.dart';
import '../state/inventory_store.dart';
import '../theme.dart';
import '../widgets/category_marks.dart';
import '../widgets/correct_plate.dart';
import '../widgets/widgets.dart';
import 'assign_screen.dart';
import 'inbound_screen.dart';

class InventoryScreen extends StatefulWidget {
  const InventoryScreen({super.key});

  @override
  State<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends State<InventoryScreen> {
  String query = '';
  String filter = 'Todos';

  @override
  Widget build(BuildContext context) {
    final store = context.watch<InventoryStore>();
    final filters = ['Todos', ...store.categories];
    final visible = store.items.where((item) {
      final hay = '${item.name} ${item.sku} ${item.brand} ${item.category} ${item.compatible}'.toLowerCase();
      final catOk = filter == 'Todos' || item.category == filter;
      return catOk && (query.isEmpty || hay.contains(query.toLowerCase()));
    }).toList();

    return SafeArea(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            child: Row(
              children: [
                const RgLogo(height: 36),
                const SizedBox(width: 10),
                const Expanded(
                  child: Text('Inventario', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800)),
                ),
                if (store.offlineCache)
                  const Text('Sin red', style: TextStyle(color: RgColors.yellow, fontSize: 12)),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: TextField(
              decoration: const InputDecoration(
                prefixIcon: Icon(Icons.search),
                hintText: 'Buscar: barra hilux, maxus, pisadera…',
              ),
              onChanged: (value) => setState(() => query = value),
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            height: 38,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              children: filters.map((f) {
                final on = filter == f;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(f),
                    selected: on,
                    onSelected: (_) => setState(() => filter = f),
                    selectedColor: RgColors.brand,
                    labelStyle: TextStyle(color: on ? Colors.white : RgColors.muted),
                  ),
                );
              }).toList(),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: FilledButton.icon(
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const InboundScreen(asPage: true)),
              ),
              icon: const Icon(Icons.add_a_photo_outlined),
              label: const Text('Sumar al inventario'),
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: store.refresh,
              child: store.loading && store.items.isEmpty
                  ? ListView(children: [const SizedBox(height: 80), Center(child: CircularProgressIndicator())])
                  : visible.isEmpty
                      ? ListView(
                          children: const [
                            SizedBox(height: 48),
                            Center(child: Text('No hay elementos con esa búsqueda', style: TextStyle(color: RgColors.muted))),
                          ],
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                          itemCount: visible.length,
                          itemBuilder: (context, i) {
                            final item = visible[i];
                            return Card(
                              child: Padding(
                                padding: const EdgeInsets.fromLTRB(14, 12, 14, 10),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    InkWell(
                                      onTap: () => _openDetail(context, item),
                                      child: Row(
                                        children: [
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(item.name, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
                                                const SizedBox(height: 2),
                                                Text(
                                                  '${item.category} · ${item.brand}',
                                                  style: const TextStyle(color: RgColors.muted, fontSize: 13),
                                                ),
                                              ],
                                            ),
                                          ),
                                          Column(
                                            crossAxisAlignment: CrossAxisAlignment.end,
                                            children: [
                                              Text('${item.stock}', style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800)),
                                              StatusPill(status: item.status, label: item.statusLabel),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(height: 10),
                                    Row(
                                      children: [
                                        Expanded(
                                          child: FilledButton.tonal(
                                            onPressed: () => Navigator.push(
                                              context,
                                              MaterialPageRoute(builder: (_) => InboundScreen(asPage: true, initialSku: item.sku)),
                                            ),
                                            child: const Text('Sumar'),
                                          ),
                                        ),
                                        const SizedBox(width: 10),
                                        Expanded(
                                          child: OutlinedButton(
                                            onPressed: () => _openUse(context, item),
                                            child: const Text('Entregar', style: TextStyle(color: RgColors.red, fontWeight: FontWeight.w800)),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
            ),
          ),
        ],
      ),
    );
  }

  void _openUse(BuildContext context, StockItem item) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => AssignScreen(initialSku: item.sku)));
  }

  void _openDetail(BuildContext context, StockItem item) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => ItemDetailScreen(sku: item.sku)));
  }
}

class CategoryStockScreen extends StatelessWidget {
  const CategoryStockScreen({super.key, required this.category});
  final String category;

  @override
  Widget build(BuildContext context) {
    final store = context.watch<InventoryStore>();
    final rows = store.itemsInCategory(category);
    final units = rows.fold<int>(0, (sum, item) => sum + item.stock);

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            CategoryMark(category: category, size: 22),
            const SizedBox(width: 10),
            Text(category),
          ],
        ),
      ),
      body: rows.isEmpty
          ? const Center(child: Text('No hay elementos en esta categoría', style: TextStyle(color: RgColors.muted)))
          : ListView.builder(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
              itemCount: rows.length + 1,
              itemBuilder: (context, i) {
                if (i == 0) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Text(
                      '${rows.length} elementos · $units en bodega',
                      style: const TextStyle(color: RgColors.muted),
                    ),
                  );
                }
                final item = rows[i - 1];
                return Card(
                  child: ListTile(
                    contentPadding: const EdgeInsets.fromLTRB(14, 8, 10, 8),
                    title: Text(item.name, style: const TextStyle(fontWeight: FontWeight.w800)),
                    subtitle: Text(
                      [
                        if (item.brand.isNotEmpty) item.brand,
                        if (item.location.isNotEmpty) item.location,
                        if (item.compatible.isNotEmpty) item.compatible,
                      ].join(' · '),
                    ),
                    trailing: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text('${item.stock}', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
                        StatusPill(status: item.status, label: item.statusLabel),
                      ],
                    ),
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => ItemDetailScreen(sku: item.sku)),
                    ),
                  ),
                );
              },
            ),
    );
  }
}

class ItemDetailScreen extends StatelessWidget {
  const ItemDetailScreen({super.key, required this.sku});
  final String sku;

  @override
  Widget build(BuildContext context) {
    final store = context.watch<InventoryStore>();
    final item = store.itemBySku(sku);
    if (item == null) {
      return const Scaffold(body: Center(child: Text('SKU no encontrado')));
    }
    final hist = store.movementsForSku(sku);
    return Scaffold(
      appBar: AppBar(title: Text(item.name)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('${item.stock} en bodega', style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800)),
          StatusPill(status: item.status, label: item.statusLabel),
          const SizedBox(height: 16),
          _row('Categoría', item.category),
          _row('Marca', item.brand),
          _row('Ubicación', item.location),
          _row('Compatible', item.compatible),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => InboundScreen(asPage: true, initialSku: item.sku)),
            ),
            icon: const Icon(Icons.add),
            label: const Text('Sumar al inventario'),
          ),
          const SizedBox(height: 8),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: RgColors.red),
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => AssignScreen(initialSku: item.sku)),
            ),
            child: const Text('Entregar (responsable y vehículo)'),
          ),
          const SizedBox(height: 20),
          const Text('Historial', style: TextStyle(fontWeight: FontWeight.w800)),
          ...hist.map((m) => ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(m.isUse ? 'En ${m.plate}' : (m.note ?? 'Ingreso')),
                subtitle: Text(prettyWhen(m.createdAt)),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CorrectPlateAction(movement: m),
                    Text('${m.isUse || m.isAssign ? '-' : '+'}${m.qty}'),
                  ],
                ),
              )),
        ],
      ),
    );
  }

  Widget _row(String k, String v) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 7),
      child: Row(
        children: [
          Expanded(child: Text(k, style: const TextStyle(color: RgColors.muted))),
          Flexible(child: Text(v, textAlign: TextAlign.right, style: const TextStyle(fontWeight: FontWeight.w700))),
        ],
      ),
    );
  }
}
