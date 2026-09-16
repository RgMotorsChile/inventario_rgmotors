import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/models.dart';
import '../state/inventory_store.dart';
import '../theme.dart';
import '../widgets/widgets.dart';
import 'assign_screen.dart';

class UnitsScreen extends StatefulWidget {
  const UnitsScreen({super.key});

  @override
  State<UnitsScreen> createState() => _UnitsScreenState();
}

class _UnitsScreenState extends State<UnitsScreen> {
  String query = '';

  @override
  Widget build(BuildContext context) {
    final store = context.watch<InventoryStore>();
    final q = query.toLowerCase();
    final units = store.vehicles.where((v) {
      return '${v.plate} ${v.brand} ${v.model} ${v.status}'.toLowerCase().contains(q);
    }).toList();

    return Scaffold(
      appBar: AppBar(title: const Text('Unidades')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
        children: [
          const SectionTitle(
            'UNIDADES DEL PATIO',
            subtitle: 'Las camionetas del stock. Aquí se ve qué se les instaló.',
          ),
          TextField(
            decoration: const InputDecoration(
              prefixIcon: Icon(Icons.search),
              hintText: 'Patente, Hilux, Partner…',
            ),
            onChanged: (value) => setState(() => query = value),
          ),
          const SizedBox(height: 8),
          Text(
            '${units.length} de ${store.vehicles.length}',
            style: const TextStyle(color: RgColors.muted, fontSize: 13),
          ),
          const SizedBox(height: 8),
          ...units.map((v) {
            final used = store.movementsForPlate(v.plate).where((m) => m.isUse).length;
            return Card(
              child: ListTile(
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                leading: PlateChip(plate: v.plate),
                title: Text(v.title, maxLines: 1, overflow: TextOverflow.ellipsis),
                subtitle: Text('${v.year} · ${v.color} · ${v.status} · $used ítems'),
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => UnitDetailScreen(plate: v.plate)),
                ),
              ),
            );
          }),
        ],
      ),
    );
  }
}

class UnitDetailScreen extends StatelessWidget {
  const UnitDetailScreen({super.key, required this.plate});
  final String plate;

  @override
  Widget build(BuildContext context) {
    final store = context.watch<InventoryStore>();
    VehicleUnit? vehicle;
    for (final v in store.vehicles) {
      if (v.plate == plate) vehicle = v;
    }
    if (vehicle == null) {
      return const Scaffold(body: Center(child: Text('Unidad no encontrada')));
    }
    final unit = vehicle;
    final hist = store.movementsForPlate(plate).where((m) => m.isUse).toList();
    final cost = hist.fold<double>(0, (sum, m) {
      final item = store.itemBySku(m.itemSku);
      return sum + (item?.unitCost ?? 0) * m.qty;
    });

    return Scaffold(
      appBar: AppBar(title: const Text('Ficha de unidad')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              PlateChip(plate: unit.plate),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(unit.title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
                    Text('${unit.year} · ${unit.color} · ${unit.status}', style: const TextStyle(color: RgColors.muted)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _row('Estado', unit.status),
          _row('Color', unit.color),
          _row('Elementos usados', '${hist.length}'),
          _row('Costo accesorios', clp.format(cost)),
          const SizedBox(height: 16),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: RgColors.red),
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => AssignScreen(initialPlate: unit.plate)),
            ),
            child: const Text('Registrar uso en esta patente'),
          ),
          const SizedBox(height: 20),
          const Text('Línea de tiempo de bodega', style: TextStyle(fontWeight: FontWeight.w800)),
          if (hist.isEmpty)
            const Padding(
              padding: EdgeInsets.only(top: 16),
              child: Text('Esta unidad todavía no tiene elementos de bodega.', style: TextStyle(color: RgColors.muted)),
            ),
          ...hist.map((m) => ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(itemName(store.items, m.itemSku)),
                subtitle: Text('${prettyWhen(m.createdAt)} · ${m.userName}\n${m.qty} unidad descontada en tiempo real'),
                isThreeLine: true,
              )),
        ],
      ),
    );
  }

  Widget _row(String k, String v) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Expanded(child: Text(k, style: const TextStyle(color: RgColors.muted))),
          Flexible(child: Text(v, textAlign: TextAlign.right, style: const TextStyle(fontWeight: FontWeight.w700))),
        ],
      ),
    );
  }
}
