import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/excel_export.dart';
import '../state/inventory_store.dart';
import '../theme.dart';
import 'inventory_screen.dart';
import 'management_dashboard.dart';
import 'movements_screen.dart';
import 'shell_screen.dart';
import 'tracking_screen.dart';

class ManagementShell extends StatefulWidget {
  const ManagementShell({super.key});

  @override
  State<ManagementShell> createState() => _ManagementShellState();
}

class _ManagementShellState extends State<ManagementShell> {
  int index = 0;

  @override
  Widget build(BuildContext context) {
    final pages = const [
      ManagementDashboard(),
      TrackingScreen(embedded: true),
      InventoryScreen(),
      ManagementMoreScreen(),
    ];

    return Scaffold(
      body: pages[index],
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (value) => setState(() => index = value),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.analytics_outlined), selectedIcon: Icon(Icons.analytics), label: 'Métricas'),
          NavigationDestination(icon: Icon(Icons.manage_search), selectedIcon: Icon(Icons.manage_search), label: 'Rastro'),
          NavigationDestination(icon: Icon(Icons.inventory_2_outlined), selectedIcon: Icon(Icons.inventory_2), label: 'Stock'),
          NavigationDestination(icon: Icon(Icons.more_horiz), label: 'Más'),
        ],
      ),
    );
  }
}

class ManagementMoreScreen extends StatelessWidget {
  const ManagementMoreScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final store = context.watch<InventoryStore>();
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text(store.profile?.fullName ?? 'Jefatura', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
          Text(store.profile?.roleLabel ?? 'Jefatura', style: const TextStyle(color: RgColors.muted)),
          const SizedBox(height: 16),
          ListTile(
            leading: const Icon(Icons.file_download_outlined),
            title: const Text('Exportar Excel completo'),
            subtitle: const Text('Stock, alertas, vehículos y trabajadores'),
            onTap: () async {
              try {
                await exportManagementExcel(store);
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
                }
              }
            },
          ),
          ListTile(
            leading: const Icon(Icons.history),
            title: const Text('Movimientos'),
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const MovementsScreen())),
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

class RoleShell extends StatelessWidget {
  const RoleShell({super.key});

  @override
  Widget build(BuildContext context) {
    final store = context.watch<InventoryStore>();
    if (store.loading && store.items.isEmpty && store.profile == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (store.isManagement) return const ManagementShell();
    return const ShellScreen();
  }
}
