import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/inventory_store.dart';
import '../widgets/widgets.dart';

class MovementsScreen extends StatefulWidget {
  const MovementsScreen({super.key});

  @override
  State<MovementsScreen> createState() => _MovementsScreenState();
}

class _MovementsScreenState extends State<MovementsScreen> {
  String type = 'todos';

  @override
  Widget build(BuildContext context) {
    final store = context.watch<InventoryStore>();
    final rows = store.movements.where((m) => type == 'todos' || m.type == type).toList();

    return Scaffold(
      appBar: AppBar(title: const Text('Movimientos')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'todos', label: Text('Todos')),
                ButtonSegment(value: 'uso', label: Text('Unidad')),
                ButtonSegment(value: 'asignacion', label: Text('Asignado')),
                ButtonSegment(value: 'ingreso', label: Text('Ingreso')),
              ],
              selected: {type},
              onSelectionChanged: (value) => setState(() => type = value.first),
            ),
            ),
          ),
          Expanded(
            child: ListView.builder(
              itemCount: rows.length,
              itemBuilder: (context, i) {
                final m = rows[i];
                return ListTile(
                  title: Text(itemName(store.items, m.itemSku)),
                  subtitle: Text(
                    '${prettyWhen(m.createdAt)} · ${m.userName}\n${m.destination}',
                  ),
                  isThreeLine: true,
                  leading: m.isUse && m.plate != null
                      ? PlateChip(plate: m.plate!)
                      : Icon(m.isAssign ? Icons.badge_outlined : Icons.south),
                  trailing: StatusPill(
                    status: m.isUse || m.isAssign ? 'uso' : 'in',
                    label: '${m.isReturn || m.type == 'ingreso' ? '+' : '-'}${m.qty}',
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
