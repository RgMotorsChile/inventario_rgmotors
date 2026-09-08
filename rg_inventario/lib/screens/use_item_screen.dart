import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/models.dart';
import '../state/inventory_store.dart';
import '../theme.dart';
import '../widgets/widgets.dart';

class UseItemScreen extends StatefulWidget {
  const UseItemScreen({super.key, this.initialSku, this.initialPlate});

  final String? initialSku;
  final String? initialPlate;

  @override
  State<UseItemScreen> createState() => _UseItemScreenState();
}

class _UseItemScreenState extends State<UseItemScreen> {
  int step = 1;
  String? sku;
  String? plate;
  int qty = 1;
  final note = TextEditingController();
  final search = TextEditingController();
  bool busy = false;

  @override
  void initState() {
    super.initState();
    sku = widget.initialSku;
    plate = widget.initialPlate;
    if (widget.initialSku != null) step = 2;
    if (widget.initialPlate != null) step = 3;
  }

  @override
  void dispose() {
    note.dispose();
    search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final store = context.watch<InventoryStore>();
    final item = sku == null ? null : store.itemBySku(sku!);
    final q = search.text.toLowerCase();
    final units = store.vehicles.where((v) {
      return '${v.plate} ${v.brand} ${v.model}'.toLowerCase().contains(q);
    }).toList();

    return Scaffold(
      appBar: AppBar(title: const Text('Usar en unidad')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            'Elige el elemento, busca la patente y el stock baja al confirmar.',
            style: TextStyle(color: RgColors.muted),
          ),
          const SizedBox(height: 12),
          _step('1. Elemento', step == 1, () => setState(() => step = 1)),
          _step('2. Patente', step == 2, () => setState(() => step = 2)),
          _step('3. Confirmar', step == 3, () => setState(() => step = 3)),
          const SizedBox(height: 16),
          if (step == 1)
            ...store.items.map((it) {
              return Card(
                color: it.sku == sku ? const Color(0x33173A79) : null,
                child: ListTile(
                  title: Text(it.name),
                  subtitle: Text('${it.sku} · stock ${it.stock}'),
                  trailing: StatusPill(status: it.status, label: '${it.stock} u.'),
                  onTap: () => setState(() {
                    sku = it.sku;
                    step = 2;
                  }),
                ),
              );
            }),
          if (step == 2) ...[
            TextField(
              controller: search,
              decoration: const InputDecoration(
                labelText: 'Buscar patente, marca o modelo',
                hintText: 'THZF 75 o Mitsubishi Katana',
              ),
              onChanged: (_) => setState(() {}),
            ),
            const SizedBox(height: 10),
            ...units.map((v) {
              return Card(
                color: v.plate == plate ? const Color(0x33173A79) : null,
                child: ListTile(
                  leading: PlateChip(plate: v.plate),
                  title: Text(v.title),
                  subtitle: Text('${v.year} · ${v.color} · ${v.status}'),
                  onTap: () => setState(() {
                    plate = v.plate;
                    step = 3;
                  }),
                ),
              );
            }),
          ],
          if (step == 3 && item != null && plate != null) ...[
            _row('Elemento', item.name),
            _row('SKU', item.sku),
            _row('Unidad', store.vehicles.firstWhere((v) => v.plate == plate, orElse: () => store.vehicles.first).title),
            _row('Patente', plate!),
            _row('Stock actual', '${item.stock} u.'),
            _row('Quedará', '${(item.stock - qty).clamp(0, 9999)} u.'),
            const SizedBox(height: 12),
            Row(
              children: [
                IconButton.filledTonal(
                  onPressed: qty > 1 ? () => setState(() => qty--) : null,
                  icon: const Icon(Icons.remove),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Text('$qty', style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800)),
                ),
                IconButton.filledTonal(
                  onPressed: qty < item.stock ? () => setState(() => qty++) : null,
                  icon: const Icon(Icons.add),
                ),
                const Text('unidades a descontar', style: TextStyle(color: RgColors.muted)),
              ],
            ),
            const SizedBox(height: 12),
            TextField(
              controller: note,
              decoration: const InputDecoration(labelText: 'Nota de instalación (opcional)'),
            ),
            const SizedBox(height: 12),
            const Text(
              'Al confirmar, el inventario baja al instante y queda quién, cuándo, camioneta y patente.',
              style: TextStyle(color: RgColors.green, height: 1.4),
            ),
            const SizedBox(height: 16),
            FilledButton(
              style: FilledButton.styleFrom(backgroundColor: RgColors.red),
              onPressed: busy ? null : () => _confirm(store, item),
              child: Text(busy ? 'Descontando…' : 'Descontar de bodega'),
            ),
          ],
        ],
      ),
    );
  }

  Widget _step(String label, bool on, VoidCallback tap) {
    return ListTile(
      onTap: tap,
      tileColor: on ? const Color(0x55173A79) : RgColors.ink800,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      title: Text(label, style: const TextStyle(fontWeight: FontWeight.w700)),
    );
  }

  Widget _row(String k, String v) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Expanded(child: Text(k, style: const TextStyle(color: RgColors.muted))),
          Text(v, style: const TextStyle(fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }

  Future<void> _confirm(InventoryStore store, StockItem item) async {
    setState(() => busy = true);
    try {
      await store.useItem(sku: item.sku, qty: qty, plate: plate!, note: note.text.trim().isEmpty ? null : note.text.trim());
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('${item.name} (−$qty) en $plate. Inventario actualizado.')),
      );
      Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }
}
