import 'package:flutter/material.dart';

import '../theme.dart';
import 'assign_screen.dart';
import 'home_screen.dart';
import 'inbound_screen.dart';

class ShellScreen extends StatefulWidget {
  const ShellScreen({super.key});

  @override
  State<ShellScreen> createState() => _ShellScreenState();
}

class _ShellScreenState extends State<ShellScreen> {
  int index = 0;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFF0C1426), RgColors.ink950],
        ),
      ),
      child: Scaffold(
        backgroundColor: Colors.transparent,
        body: IndexedStack(
          index: index,
          children: [
            HomeScreen(
              onReceive: () => setState(() => index = 1),
              onDeliver: () => setState(() => index = 2),
            ),
            const InboundScreen(asPage: false),
            const AssignScreen(embedded: true),
          ],
        ),
        bottomNavigationBar: NavigationBar(
          selectedIndex: index,
          onDestinationSelected: (value) => setState(() => index = value),
          destinations: const [
            NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Hoy'),
            NavigationDestination(icon: Icon(Icons.add_box_outlined), selectedIcon: Icon(Icons.add_box), label: 'Recibir'),
            NavigationDestination(icon: Icon(Icons.outbox_outlined), selectedIcon: Icon(Icons.outbox), label: 'Entregar'),
          ],
        ),
      ),
    );
  }
}
