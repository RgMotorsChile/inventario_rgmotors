import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/excel_export.dart';
import '../state/inventory_store.dart';
import '../theme.dart';
import '../widgets/widgets.dart';
import 'tracking_screen.dart';

class ManagementDashboard extends StatefulWidget {
  const ManagementDashboard({super.key});

  @override
  State<ManagementDashboard> createState() => _ManagementDashboardState();
}

class _ManagementDashboardState extends State<ManagementDashboard> {
  bool exporting = false;

  @override
  Widget build(BuildContext context) {
    final store = context.watch<InventoryStore>();
    return SafeArea(
      child: RefreshIndicator(
        onRefresh: store.refresh,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
          children: [
            Row(
              children: [
                const RgLogo(height: 42),
                const Spacer(),
                const StatusPill(status: 'in', label: 'JEFATURA'),
              ],
            ),
            const SizedBox(height: 16),
            const SectionTitle(
              'CONTROL DE JEFATURA',
              subtitle: 'Stock, alertas y rastro de cada elemento: vehículo o trabajador.',
            ),
            FilledButton.icon(
              onPressed: exporting ? null : () => _export(store),
              icon: const Icon(Icons.file_download_outlined),
              label: Text(exporting ? 'Generando Excel…' : 'Extraer stock completo a Excel'),
            ),
            const SizedBox(height: 12),
            if (store.loading && store.items.isEmpty)
              const Center(child: Padding(padding: EdgeInsets.all(32), child: CircularProgressIndicator()))
            else ...[
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 8,
                crossAxisSpacing: 8,
                childAspectRatio: 1.28,
                children: [
                  KpiCard(label: 'Valor bodega', value: clp.format(store.warehouseValue), hint: 'Inventario físico', color: RgColors.green),
                  KpiCard(label: 'En poder de gente', value: '${store.qtyInCustody}', hint: clp.format(store.custodyValue), color: RgColors.yellow),
                  KpiCard(label: 'Alertas stock', value: '${store.lowItems.length}', hint: 'Bajo mínimo o sin stock', color: RgColors.red),
                  KpiCard(label: 'Asig. 3+ días', value: '${store.staleAssignments.length}', hint: 'Riesgo de pérdida'),
                ],
              ),
              const SizedBox(height: 16),
              const Text('Alertas de cantidad', style: TextStyle(fontWeight: FontWeight.w800)),
              const SizedBox(height: 8),
              if (store.lowItems.isEmpty && store.staleAssignments.isEmpty)
                const Text('Sin alertas críticas.', style: TextStyle(color: RgColors.muted)),
              ...store.lowItems.map((item) => Card(
                    child: ListTile(
                      title: Text(item.name),
                      subtitle: Text('Quedan ${item.stock} · mínimo ${item.minStock}'),
                      trailing: StatusPill(status: item.status, label: item.statusLabel),
                    ),
                  )),
              ...store.staleAssignments.map((asg) {
                final worker = store.workerById(asg.workerId);
                return Card(
                  child: ListTile(
                    title: Text(itemName(store.items, asg.itemSku)),
                    subtitle: Text('${worker?.fullName ?? 'Trabajador'} · ${asg.daysOpen} días sin devolver · ${asg.qty} u.'),
                    trailing: const StatusPill(status: 'uso', label: 'Seguimiento'),
                  ),
                );
              }),
              const SizedBox(height: 16),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.manage_search),
                title: const Text('Rastro completo'),
                subtitle: const Text('Por vehículo y por trabajador'),
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const TrackingScreen())),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Future<void> _export(InventoryStore store) async {
    setState(() => exporting = true);
    try {
      await exportManagementExcel(store);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => exporting = false);
    }
  }
}
