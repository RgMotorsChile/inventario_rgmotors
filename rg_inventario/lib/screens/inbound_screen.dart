import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/errors.dart';
import '../state/inventory_store.dart';
import '../widgets/widgets.dart';
import 'scan_box_screen.dart';

class InboundScreen extends StatefulWidget {
  const InboundScreen({super.key});

  @override
  State<InboundScreen> createState() => _InboundScreenState();
}

class _InboundScreenState extends State<InboundScreen> {
  String? sku;
  final qty = TextEditingController(text: '4');
  final note = TextEditingController(text: 'Guía 00482 · Offroad Puerto Montt');
  bool busy = false;

  @override
  void dispose() {
    qty.dispose();
    note.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final store = context.watch<InventoryStore>();
    sku ??= store.items.isEmpty ? null : store.items.first.sku;

    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const SectionTitle(
            'INGRESO A BODEGA',
            subtitle: 'Si llega en cajas, escanea el código. Si viene suelto, súbelo a mano.',
          ),
          FilledButton.icon(
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ScanBoxScreen())),
            icon: const Icon(Icons.qr_code_scanner),
            label: const Text('Escanear caja con cámara'),
          ),
          const SizedBox(height: 18),
          const Text('Cajas del proveedor', style: TextStyle(fontWeight: FontWeight.w800)),
          const SizedBox(height: 8),
          ...store.boxes.map((box) {
            return Card(
              child: ListTile(
                title: Text(box.code),
                subtitle: Text('${box.supplier} · guía ${box.guide} · ${box.totalQty} u.'),
                trailing: StatusPill(
                  status: box.received ? 'ok' : 'in',
                  label: box.received ? 'Ingresada' : 'Pendiente',
                ),
                onTap: box.received
                    ? null
                    : () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ScanBoxScreen())),
              ),
            );
          }),
          const SizedBox(height: 20),
          const Text('Ingreso suelto', style: TextStyle(fontWeight: FontWeight.w800)),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(
            // ignore: deprecated_member_use
            value: sku,
            items: store.items
                .map((item) => DropdownMenuItem(value: item.sku, child: Text(item.name)))
                .toList(),
            onChanged: (value) => setState(() => sku = value),
            decoration: const InputDecoration(labelText: 'Elemento'),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: qty,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(labelText: 'Cantidad'),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: note,
            decoration: const InputDecoration(labelText: 'Guía / proveedor'),
          ),
          const SizedBox(height: 12),
          OutlinedButton(
            onPressed: busy || sku == null ? null : _receive,
            child: Text(busy ? 'Sumando…' : 'Sumar un SKU'),
          ),
        ],
      ),
    );
  }

  Future<void> _receive() async {
    setState(() => busy = true);
    try {
      final parsed = int.tryParse(qty.text.trim());
      if (parsed == null || parsed < 1) {
        throw Exception('Indica una cantidad válida');
      }
      await context.read<InventoryStore>().receiveItem(
            sku: sku!,
            qty: parsed,
            note: note.text.trim(),
          );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Ingreso registrado')));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(friendlyError(e))));
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }
}
