import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/models.dart';
import '../state/inventory_store.dart';
import '../theme.dart';
import '../widgets/widgets.dart';
import 'assign_screen.dart';
import 'use_item_screen.dart';

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
    final filters = ['Todos', 'Barras', 'Pisaderas', 'Lonas', 'Mitsubishi', 'Toyota'];
    final visible = store.items.where((item) {
      final hay = '${item.name} ${item.sku} ${item.brand} ${item.category} ${item.compatible}'.toLowerCase();
      final catOk = filter == 'Todos' || item.category == filter || item.brand == filter;
      return catOk && (query.isEmpty || hay.contains(query.toLowerCase()));
    }).toList();

    return SafeArea(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 16, 16, 0),
            child: SectionTitle('INVENTARIO', subtitle: 'Ubicación, mínimo y compatibilidad.'),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: TextField(
              decoration: const InputDecoration(
                prefixIcon: Icon(Icons.search),
                hintText: 'SKU, barra, lona o marca',
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
          Expanded(
            child: RefreshIndicator(
              onRefresh: store.refresh,
              child: ListView.builder(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 88),
                itemCount: visible.length,
                itemBuilder: (context, i) {
                  final item = visible[i];
                  return Card(
                    child: ListTile(
                      title: Text(item.name),
                      subtitle: Text('${item.sku} · ${item.location}\n${item.stock} u. · ${item.compatible}'),
                      isThreeLine: true,
                      trailing: TextButton(
                        onPressed: () => _openUse(context, item),
                        child: const Text('Usar', style: TextStyle(color: RgColors.red, fontWeight: FontWeight.w800)),
                      ),
                      onTap: () => _openDetail(context, item),
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
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => UseItemScreen(initialSku: item.sku)),
    );
  }

  void _openDetail(BuildContext context, StockItem item) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => ItemDetailScreen(sku: item.sku)),
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
      appBar: AppBar(title: const Text('Ficha de elemento')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Center(child: RgLogo(height: 64)),
          const SizedBox(height: 12),
          Text(item.sku, style: const TextStyle(color: RgColors.muted)),
          Text(item.name, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
          const SizedBox(height: 8),
          StatusPill(status: item.status, label: '${item.statusLabel} · ${item.stock} u.'),
          const SizedBox(height: 16),
          _row('Categoría', item.category),
          _row('Marca', item.brand),
          _row('Ubicación', item.location),
          _row('Compatible', item.compatible),
          _row('Costo', clp.format(item.unitCost)),
          _row('Valor en bodega', clp.format(item.unitCost * item.stock)),
          const SizedBox(height: 16),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: RgColors.red),
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => UseItemScreen(initialSku: item.sku)),
            ),
            child: const Text('Usar en unidad'),
          ),
          const SizedBox(height: 8),
          OutlinedButton(
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => AssignScreen(initialSku: item.sku)),
            ),
            child: const Text('Asignar a trabajador'),
          ),
          const SizedBox(height: 20),
          const Text('Historial de este SKU', style: TextStyle(fontWeight: FontWeight.w800)),
          ...hist.map((m) => ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(m.isUse ? 'Instalado en ${m.plate}' : (m.note ?? 'Ingreso')),
                subtitle: Text('${prettyWhen(m.createdAt)} · ${m.userName}'),
                trailing: Text('${m.isUse ? '-' : '+'}${m.qty}'),
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
