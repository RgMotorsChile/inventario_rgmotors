import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/inventory_store.dart';
import '../theme.dart';
import '../widgets/widgets.dart';
import 'units_screen.dart';

class TrackingScreen extends StatelessWidget {
  const TrackingScreen({super.key, this.embedded = false});
  final bool embedded;

  @override
  Widget build(BuildContext context) {
    final store = context.watch<InventoryStore>();
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          automaticallyImplyLeading: !embedded,
          title: const Text('Rastro de elementos'),
          bottom: const TabBar(
            tabs: [
              Tab(text: 'Vehículos'),
              Tab(text: 'Trabajadores'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            ListView(
              padding: const EdgeInsets.all(16),
              children: [
                const Text(
                  'Qué se instaló en cada camioneta y con qué patente.',
                  style: TextStyle(color: RgColors.muted),
                ),
                const SizedBox(height: 12),
                ...store.vehicles.map((v) {
                  final used = store.movementsForPlate(v.plate).where((m) => m.isUse).toList();
                  return Card(
                    child: ListTile(
                      leading: PlateChip(plate: v.plate),
                      title: Text(v.title),
                      subtitle: Text(used.isEmpty
                          ? 'Sin elementos de bodega'
                          : used.map((m) => '${itemName(store.items, m.itemSku)} ×${m.qty}').join(' · ')),
                      onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => UnitDetailScreen(plate: v.plate)),
                      ),
                    ),
                  );
                }),
              ],
            ),
            ListView(
              padding: const EdgeInsets.all(16),
              children: [
                const Text(
                  'Qué tiene cada trabajador ahora. Si no lo devuelve, no se pierde el rastro.',
                  style: TextStyle(color: RgColors.muted),
                ),
                const SizedBox(height: 12),
                ...store.workers.map((w) {
                  final open = store.assignmentsForWorker(w.id);
                  final used = store.movementsForWorker(w.id);
                  final qty = open.fold<int>(0, (s, a) => s + a.qty);
                  return Card(
                    child: ListTile(
                      title: Text(w.fullName),
                      subtitle: Text(
                        open.isEmpty
                            ? used.isEmpty
                                ? '${w.jobTitle} · sin movimientos'
                                : '${w.jobTitle} · ${used.length} movimientos'
                            : '${w.jobTitle} · $qty u. a cargo · ${open.map((a) => itemName(store.items, a.itemSku)).join(', ')}',
                      ),
                      trailing: qty == 0 ? null : StatusPill(status: 'low', label: '$qty a cargo'),
                      onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => WorkerDetailScreen(workerId: w.id)),
                      ),
                    ),
                  );
                }),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class WorkerDetailScreen extends StatelessWidget {
  const WorkerDetailScreen({super.key, required this.workerId});
  final String workerId;

  @override
  Widget build(BuildContext context) {
    final store = context.watch<InventoryStore>();
    final worker = store.workerById(workerId);
    if (worker == null) {
      return const Scaffold(body: Center(child: Text('Trabajador no encontrado')));
    }
    final open = store.assignmentsForWorker(workerId);
    final hist = store.movementsForWorker(workerId);

    return Scaffold(
      appBar: AppBar(title: Text(worker.fullName)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(worker.jobTitle, style: const TextStyle(color: RgColors.muted)),
          const SizedBox(height: 12),
          const Text('Ahora a su cargo', style: TextStyle(fontWeight: FontWeight.w800)),
          if (open.isEmpty)
            const Padding(
              padding: EdgeInsets.only(top: 8),
              child: Text('No tiene elementos abiertos.', style: TextStyle(color: RgColors.muted)),
            ),
          ...open.map((asg) => Card(
                child: ListTile(
                  title: Text(itemName(store.items, asg.itemSku)),
                  subtitle: Text('${asg.qty} u. · hace ${asg.daysOpen} días · ${asg.itemSku}'),
                  trailing: TextButton(
                    onPressed: () => store.returnAssignment(asg.id),
                    child: const Text('Devolver'),
                  ),
                ),
              )),
          const SizedBox(height: 16),
          const Text('Historial', style: TextStyle(fontWeight: FontWeight.w800)),
          ...hist.map((m) => ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(itemName(store.items, m.itemSku)),
                subtitle: Text('${prettyWhen(m.createdAt)} · ${m.destination}'),
                trailing: Text('${m.isReturn ? '+' : '-'}${m.qty}'),
              )),
        ],
      ),
    );
  }
}
