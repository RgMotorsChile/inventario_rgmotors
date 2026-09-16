import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/inventory_store.dart';
import '../theme.dart';
import '../widgets/category_marks.dart';
import '../widgets/widgets.dart';
import 'alerts_screen.dart';
import 'inventory_screen.dart';
import 'tracking_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key, required this.onReceive, required this.onDeliver});

  final VoidCallback onReceive;
  final VoidCallback onDeliver;

  @override
  Widget build(BuildContext context) {
    final store = context.watch<InventoryStore>();
    final width = MediaQuery.sizeOf(context).width;
    final cols = width < 420 ? 4 : width < 700 ? 4 : width < 1000 ? 5 : 6;

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(14, 6, 14, 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const RgLogo(height: 26),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    store.profile?.fullName ?? 'Bodega',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16, letterSpacing: -0.3),
                  ),
                ),
                if (store.offlineCache)
                  const Text('Sin red', style: TextStyle(color: RgColors.yellow, fontSize: 11, fontWeight: FontWeight.w700)),
                IconButton(
                  visualDensity: VisualDensity.compact,
                  onPressed: store.signOut,
                  icon: const Icon(Icons.logout_rounded, size: 20),
                  tooltip: 'Cerrar sesión',
                ),
              ],
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                Expanded(
                  child: _ActionTile(
                    label: 'Recibir',
                    tone: RgColors.brandMid,
                    onTap: onReceive,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _ActionTile(
                    label: 'Entregar',
                    tone: RgColors.red,
                    onTap: onDeliver,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              'Inventario · ${store.stockedCategories.length} familias',
              style: const TextStyle(color: RgColors.muted, fontSize: 11, letterSpacing: 0.2),
            ),
            const SizedBox(height: 6),
            Expanded(
              child: store.stockedCategories.isEmpty
                  ? const Center(child: Text('Aún no hay categorías con stock.', style: TextStyle(color: RgColors.muted)))
                  : LayoutBuilder(
                      builder: (context, constraints) {
                        final n = store.stockedCategories.length;
                        final rows = (n / cols).ceil().clamp(1, 20);
                        const gap = 6.0;
                        final available = constraints.maxHeight;
                        if (!available.isFinite || available <= 0) {
                          return const SizedBox.shrink();
                        }
                        final tileH = ((available - gap * (rows - 1)) / rows).clamp(1.0, 96.0);
                        return GridView.builder(
                          physics: const NeverScrollableScrollPhysics(),
                          padding: EdgeInsets.zero,
                          itemCount: n,
                          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: cols,
                            mainAxisExtent: tileH,
                            mainAxisSpacing: gap,
                            crossAxisSpacing: gap,
                          ),
                          itemBuilder: (context, i) {
                            final cat = store.stockedCategories[i];
                            final units = store.itemsInCategory(cat).fold<int>(0, (sum, item) => sum + item.stock);
                            return _CategoryButton(
                              name: cat,
                              units: units,
                              compact: tileH < 78,
                              onTap: () => Navigator.push(
                                context,
                                MaterialPageRoute(builder: (_) => CategoryStockScreen(category: cat)),
                              ),
                            );
                          },
                        );
                      },
                    ),
            ),
            if (store.lowItems.isNotEmpty || store.openAssignments.isNotEmpty) ...[
              const SizedBox(height: 6),
              Row(
                children: [
                  if (store.lowItems.isNotEmpty)
                    Expanded(
                      child: _SlimAlert(
                        text: '${store.lowItems.length} stock bajo',
                        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AlertsScreen())),
                      ),
                    ),
                  if (store.lowItems.isNotEmpty && store.openAssignments.isNotEmpty) const SizedBox(width: 8),
                  if (store.openAssignments.isNotEmpty)
                    Expanded(
                      child: _SlimAlert(
                        text: '${store.openAssignments.length} en personas',
                        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const TrackingScreen())),
                      ),
                    ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  const _ActionTile({required this.label, required this.tone, required this.onTap});

  final String label;
  final Color tone;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: const Color(0xFF10141C),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(11),
        side: BorderSide(color: tone.withValues(alpha: 0.55)),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(11),
        onTap: onTap,
        child: SizedBox(
          height: 40,
          child: Center(
            child: Text(
              label,
              style: TextStyle(color: tone, fontWeight: FontWeight.w700, fontSize: 14, letterSpacing: 0.2),
            ),
          ),
        ),
      ),
    );
  }
}

class _SlimAlert extends StatelessWidget {
  const _SlimAlert({required this.text, required this.onTap});

  final String text;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: const Color(0xFF10141C),
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        borderRadius: BorderRadius.circular(10),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
          child: Text(text, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 11, color: RgColors.muted, fontWeight: FontWeight.w600)),
        ),
      ),
    );
  }
}

class _CategoryButton extends StatelessWidget {
  const _CategoryButton({
    required this.name,
    required this.units,
    required this.compact,
    required this.onTap,
  });

  final String name;
  final int units;
  final bool compact;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: const Color(0xFF10141C),
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.white.withValues(alpha: 0.07)),
      ),
      child: InkWell(
        onTap: onTap,
        child: FittedBox(
          fit: BoxFit.scaleDown,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                CategoryMark(category: name, size: compact ? 20 : 24),
                const SizedBox(height: 4),
                Text(
                  name,
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 10.5, height: 1.15, letterSpacing: -0.1),
                ),
                Text(
                  '$units',
                  style: const TextStyle(color: RgColors.muted, fontSize: 10, fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
