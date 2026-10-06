import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../config.dart';
import '../state/inventory_store.dart';
import '../theme.dart';
import '../widgets/app_update_gate.dart';
import '../widgets/widgets.dart';
import 'shell_screen.dart';

class RoleShell extends StatelessWidget {
  const RoleShell({super.key});

  @override
  Widget build(BuildContext context) {
    final store = context.watch<InventoryStore>();
    if (store.loading && store.profile == null && store.items.isEmpty) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (store.isManagement) return const UseWebScreen();
    if (store.profile != null && !store.profile!.active) {
      return const PendingAccessScreen();
    }
    return const AppUpdateGate(child: ShellScreen());
  }
}

class UseWebScreen extends StatelessWidget {
  const UseWebScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final store = context.watch<InventoryStore>();
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const RgLogo(height: 56),
              const SizedBox(height: 28),
              const Text('Jefatura usa la web', style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800)),
              const SizedBox(height: 10),
              const Text(
                'Esta aplicación móvil es solo para el encargado de bodega. El control, las métricas y el Excel están en la versión web, con más seguridad.',
                style: TextStyle(color: RgColors.muted, height: 1.5),
              ),
              const SizedBox(height: 20),
              FilledButton.icon(
                onPressed: () => launchUrl(
                  Uri.parse(AppConfig.jefaturaWebUrl),
                  mode: LaunchMode.externalApplication,
                ),
                icon: const Icon(Icons.open_in_new),
                label: const Text('Abrir panel de jefatura'),
              ),
              const SizedBox(height: 12),
              TextButton(
                onPressed: store.signOut,
                child: const Text('Cerrar sesión'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class PendingAccessScreen extends StatelessWidget {
  const PendingAccessScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final store = context.watch<InventoryStore>();
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const RgLogo(height: 56),
              const SizedBox(height: 28),
              const Text('Cuenta pendiente', style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800)),
              const SizedBox(height: 10),
              const Text(
                'El código no es válido o jefatura aún no activó tu usuario. Pide un código nuevo e inténtalo otra vez.',
                style: TextStyle(color: RgColors.muted, height: 1.5),
              ),
              const SizedBox(height: 20),
              TextButton(onPressed: store.signOut, child: const Text('Cerrar sesión')),
            ],
          ),
        ),
      ),
    );
  }
}
