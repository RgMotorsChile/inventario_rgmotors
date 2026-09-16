import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/inventory_store.dart';
import '../theme.dart';
import '../widgets/widgets.dart';
import 'alerts_screen.dart';
import 'units_screen.dart';
import 'assign_screen.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

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
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: RgColors.green.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(99),
                    border: Border.all(color: RgColors.green.withValues(alpha: 0.25)),
                  ),
                  child: const Text(
                    '●  EN VIVO',
                    style: TextStyle(color: RgColors.green, fontSize: 11, fontWeight: FontWeight.w800),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const SectionTitle(
              'PANEL DE CONTROL',
              subtitle: 'Lo que se usa en una patente se descuenta al segundo.',
            ),
            if (store.offlineCache)
              const Padding(
                padding: EdgeInsets.only(bottom: 10),
                child: Text(
                  'Sin conexión: mostrando el último stock guardado. Las salidas se registran cuando vuelva la red.',
                  style: TextStyle(color: RgColors.yellow, height: 1.4),
                ),
              ),
            FilledButton(
              style: FilledButton.styleFrom(backgroundColor: RgColors.red),
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AssignScreen())),
              child: const Text('Usar elemento'),
            ),
            const SizedBox(height: 12),
            if (store.loading && store.items.isEmpty)
              const Padding(
                padding: EdgeInsets.only(top: 40),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (store.error != null)
              Text(store.error!, style: const TextStyle(color: RgColors.red))
            else ...[
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 8,
                crossAxisSpacing: 8,
                childAspectRatio: 1.35,
                children: [
                  KpiCard(label: 'SKUs activos', value: '${store.items.length}', hint: 'Catálogo de bodega'),
                  KpiCard(label: 'Valor en bodega', value: clp.format(store.warehouseValue), hint: 'Costo de inventario', color: RgColors.green),
                  KpiCard(label: 'Críticos / bajos', value: '${store.lowItems.length}', hint: 'Bajo el mínimo', color: RgColors.yellow),
                  KpiCard(label: 'Usos de hoy', value: '${store.usesToday}', hint: 'Salidas con patente'),
                ],
              ),
              const SizedBox(height: 18),
              const Text('Últimos movimientos', style: TextStyle(fontWeight: FontWeight.w800)),
              const SizedBox(height: 8),
              ...store.movements.take(6).map((m) {
                return ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(itemName(store.items, m.itemSku)),
                  subtitle: Text(
                    '${prettyWhen(m.createdAt)} · ${m.isUse ? (m.plate ?? 'sin patente') : (m.note ?? 'Ingreso')}',
                    style: const TextStyle(color: RgColors.muted, fontSize: 12),
                  ),
                  trailing: StatusPill(
                    status: m.isUse ? 'uso' : 'in',
                    label: '${m.isUse ? '-' : '+'}${m.qty}',
                  ),
                );
              }),
              const SizedBox(height: 8),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Stock que pide reposición'),
                trailing: Text('${store.lowItems.length}', style: const TextStyle(color: RgColors.yellow)),
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AlertsScreen())),
              ),
              ...store.lowItems.take(3).map((item) {
                return Card(
                  child: ListTile(
                    title: Text(item.name),
                    subtitle: Text('${item.sku} · quedan ${item.stock} · mínimo ${item.minStock}'),
                    trailing: StatusPill(status: item.status, label: item.statusLabel),
                  ),
                );
              }),
              const SizedBox(height: 12),
              const Text('Unidades en preparación', style: TextStyle(fontWeight: FontWeight.w800)),
              const SizedBox(height: 8),
              ...store.preparing.map((v) {
                final used = store.movementsForPlate(v.plate).where((m) => m.isUse).length;
                return Card(
                  child: ListTile(
                    leading: PlateChip(plate: v.plate),
                    title: Text(v.title),
                    subtitle: Text('${v.year} · ${v.color} · $used elementos'),
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => UnitDetailScreen(plate: v.plate)),
                    ),
                  ),
                );
              }),
            ],
          ],
        ),
      ),
    );
  }
}
