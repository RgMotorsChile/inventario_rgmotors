import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/inventory_store.dart';
import '../widgets/widgets.dart';
import 'inbound_screen.dart';

class AlertsScreen extends StatelessWidget {
  const AlertsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final store = context.watch<InventoryStore>();
    return Scaffold(
      appBar: AppBar(title: const Text('Alertas de stock')),
      body: store.lowItems.isEmpty
          ? const Center(child: Text('Sin alertas. Bodega en nivel.'))
          : ListView(
              padding: const EdgeInsets.all(16),
              children: store.lowItems.map((item) {
                return Card(
                  child: ListTile(
                    title: Text(item.name),
                    subtitle: Text('Quedan ${item.stock} · mínimo ${item.minStock} · ${item.location}'),
                    trailing: StatusPill(status: item.status, label: item.statusLabel),
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => InboundScreen(initialSku: item.sku)),
                    ),
                  ),
                );
              }).toList(),
            ),
    );
  }
}
