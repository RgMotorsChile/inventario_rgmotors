import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/inventory_store.dart';
import '../theme.dart';
import 'alerts_screen.dart';
import 'assign_screen.dart';
import 'dashboard_screen.dart';
import 'inbound_screen.dart';
import 'inventory_screen.dart';
import 'movements_screen.dart';
import 'scan_box_screen.dart';
import 'tracking_screen.dart';
import 'units_screen.dart';
import 'use_item_screen.dart';

class ShellScreen extends StatefulWidget {
  const ShellScreen({super.key});

  @override
  State<ShellScreen> createState() => _ShellScreenState();
}

class _ShellScreenState extends State<ShellScreen> {
  int index = 0;

  @override
  Widget build(BuildContext context) {
    final pages = [
      const DashboardScreen(),
      const InventoryScreen(),
      const InboundScreen(),
      const UnitsScreen(),
      const MoreScreen(),
    ];

    return Scaffold(
      body: pages[index],
      floatingActionButton: index == 1
          ? FloatingActionButton.extended(
              backgroundColor: RgColors.red,
              foregroundColor: Colors.white,
              icon: const Icon(Icons.south_west),
              label: const Text('Salida'),
              onPressed: () => _salida(context),
            )
          : null,
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (value) => setState(() => index = value),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.space_dashboard_outlined), selectedIcon: Icon(Icons.space_dashboard), label: 'Panel'),
          NavigationDestination(icon: Icon(Icons.inventory_2_outlined), selectedIcon: Icon(Icons.inventory_2), label: 'Stock'),
          NavigationDestination(icon: Icon(Icons.qr_code_scanner), selectedIcon: Icon(Icons.qr_code_scanner), label: 'Cajas'),
          NavigationDestination(icon: Icon(Icons.directions_car_outlined), selectedIcon: Icon(Icons.directions_car), label: 'Unidades'),
          NavigationDestination(icon: Icon(Icons.more_horiz), selectedIcon: Icon(Icons.more_horiz), label: 'Más'),
        ],
      ),
    );
  }

  Future<void> _salida(BuildContext context) async {
    final choice = await showModalBottomSheet<String>(
      context: context,
      backgroundColor: RgColors.ink800,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.directions_car),
              title: const Text('Usar en una unidad'),
              subtitle: const Text('Queda amarrado a la patente'),
              onTap: () => Navigator.pop(context, 'unidad'),
            ),
            ListTile(
              leading: const Icon(Icons.badge_outlined),
              title: const Text('Asignar a un trabajador'),
              subtitle: const Text('Queda a su nombre hasta que lo devuelva'),
              onTap: () => Navigator.pop(context, 'trabajador'),
            ),
          ],
        ),
      ),
    );
    if (!context.mounted || choice == null) return;
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => choice == 'trabajador' ? const AssignScreen() : const UseItemScreen(),
      ),
    );
  }
}

class MoreScreen extends StatelessWidget {
  const MoreScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final store = context.watch<InventoryStore>();
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text(store.profile?.fullName ?? 'Bodega', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
          Text('${store.profile?.roleLabel ?? 'Encargado de bodega'} · Puerto Montt', style: const TextStyle(color: RgColors.muted)),
          const SizedBox(height: 16),
          ListTile(
            leading: const Icon(Icons.badge_outlined),
            title: const Text('Asignar a trabajador'),
            subtitle: const Text('Para que no se pierda: queda a su nombre'),
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AssignScreen())),
          ),
          ListTile(
            leading: const Icon(Icons.groups_outlined),
            title: const Text('En poder de trabajadores'),
            subtitle: Text('${store.openAssignments.length} asignaciones abiertas'),
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const TrackingScreen())),
          ),
          ListTile(
            leading: const Icon(Icons.history),
            title: const Text('Movimientos'),
            subtitle: const Text('Unidades, trabajadores, entradas y salidas'),
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const MovementsScreen())),
          ),
          ListTile(
            leading: const Icon(Icons.warning_amber_outlined),
            title: const Text('Alertas de stock'),
            subtitle: Text('${store.lowItems.length} críticos o bajos'),
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AlertsScreen())),
          ),
          ListTile(
            leading: const Icon(Icons.qr_code_2),
            title: const Text('Escanear caja'),
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ScanBoxScreen())),
          ),
          ListTile(
            leading: const Icon(Icons.logout, color: RgColors.red),
            title: const Text('Cerrar sesión'),
            onTap: () => store.signOut(),
          ),
        ],
      ),
    );
  }
}
