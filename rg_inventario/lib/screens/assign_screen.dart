import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/models.dart';
import '../state/inventory_store.dart';
import '../theme.dart';

class AssignScreen extends StatefulWidget {
  const AssignScreen({super.key, this.initialSku});
  final String? initialSku;

  @override
  State<AssignScreen> createState() => _AssignScreenState();
}

class _AssignScreenState extends State<AssignScreen> {
  String? sku;
  String? workerId;
  int qty = 1;
  final note = TextEditingController();
  bool busy = false;

  @override
  void initState() {
    super.initState();
    sku = widget.initialSku;
  }

  @override
  void dispose() {
    note.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final store = context.watch<InventoryStore>();
    final item = sku == null ? null : store.itemBySku(sku!);

    return Scaffold(
      appBar: AppBar(title: const Text('Asignar a trabajador')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            'Sale de bodega y queda en poder de una persona. Jefatura puede ver quién lo tiene hasta que lo devuelva.',
            style: TextStyle(color: RgColors.muted, height: 1.4),
          ),
          const SizedBox(height: 16),
          const Text('1. Elemento', style: TextStyle(fontWeight: FontWeight.w800)),
          ...store.items.map((it) {
            return Card(
              color: it.sku == sku ? const Color(0x33173A79) : null,
              child: ListTile(
                title: Text(it.name),
                subtitle: Text('${it.sku} · stock ${it.stock}'),
                onTap: () => setState(() => sku = it.sku),
              ),
            );
          }),
          const SizedBox(height: 12),
          const Text('2. Trabajador', style: TextStyle(fontWeight: FontWeight.w800)),
          ...store.workers.where((w) => w.active).map((w) {
            return Card(
              color: w.id == workerId ? const Color(0x33173A79) : null,
              child: ListTile(
                title: Text(w.fullName),
                subtitle: Text(w.jobTitle),
                onTap: () => setState(() => workerId = w.id),
              ),
            );
          }),
          if (item != null && workerId != null) ...[
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
              ],
            ),
            TextField(
              controller: note,
              decoration: const InputDecoration(labelText: 'Para qué se lo lleva (opcional)'),
            ),
            const SizedBox(height: 12),
            FilledButton(
              style: FilledButton.styleFrom(backgroundColor: RgColors.red),
              onPressed: busy ? null : () => _save(store, item),
              child: Text(busy ? 'Asignando…' : 'Asignar y descontar de bodega'),
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _save(InventoryStore store, StockItem item) async {
    setState(() => busy = true);
    try {
      await store.assignItem(
        sku: item.sku,
        qty: qty,
        workerId: workerId!,
        note: note.text.trim().isEmpty ? null : note.text.trim(),
      );
      if (!mounted) return;
      final worker = store.workerById(workerId!);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('${item.name} quedó asignado a ${worker?.fullName}.')),
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
