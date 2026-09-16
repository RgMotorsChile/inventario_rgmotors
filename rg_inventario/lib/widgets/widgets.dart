import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../models/models.dart';
import '../theme.dart';

final clp = NumberFormat.currency(locale: 'es_CL', symbol: '\$', decimalDigits: 0);

class RgLogo extends StatelessWidget {
  const RgLogo({super.key, this.height = 72});
  final double height;

  @override
  Widget build(BuildContext context) {
    return Image.asset('assets/logo.png', height: height, fit: BoxFit.contain);
  }
}

class StatusPill extends StatelessWidget {
  const StatusPill({super.key, required this.status, required this.label});

  final String status;
  final String label;

  @override
  Widget build(BuildContext context) {
    final color = switch (status) {
      'ok' => RgColors.green,
      'low' => RgColors.yellow,
      'in' => RgColors.brandLight,
      'uso' => RgColors.red,
      'asig' => RgColors.yellow,
      _ => RgColors.red,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(99),
      ),
      child: Text(
        label,
        style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w700),
      ),
    );
  }
}

class PlateChip extends StatelessWidget {
  const PlateChip({super.key, required this.plate});
  final String plate;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(8, 4, 8, 5),
      decoration: BoxDecoration(
        color: const Color(0xFFF3F4F2),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: const Color(0xFFC9CCD3)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'CHILE',
            style: TextStyle(
              color: RgColors.brand,
              fontSize: 8,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.4,
            ),
          ),
          Text(
            plate,
            style: const TextStyle(
              color: Color(0xFF111111),
              fontSize: 14,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.2,
            ),
          ),
        ],
      ),
    );
  }
}

class KpiCard extends StatelessWidget {
  const KpiCard({
    super.key,
    required this.label,
    required this.value,
    required this.hint,
    this.color,
  });

  final String label;
  final String value;
  final String hint;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(color: RgColors.muted, fontSize: 12, fontWeight: FontWeight.w600)),
            const SizedBox(height: 6),
            Text(
              value,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w800,
                color: color ?? Colors.white,
              ),
            ),
            const SizedBox(height: 4),
            Text(hint, style: const TextStyle(color: RgColors.muted, fontSize: 11)),
          ],
        ),
      ),
    );
  }
}

class SectionTitle extends StatelessWidget {
  const SectionTitle(this.text, {super.key, this.subtitle});
  final String text;
  final String? subtitle;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            text,
            style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800, letterSpacing: -0.6, height: 1.1),
          ),
          if (subtitle != null) ...[
            const SizedBox(height: 4),
            Text(subtitle!, style: const TextStyle(color: RgColors.muted, fontSize: 13)),
          ],
        ],
      ),
    );
  }
}

class CategoryStyle {
  const CategoryStyle(this.icon, this.color);
  final IconData icon;
  final Color color;
}

CategoryStyle categoryStyle(String category) {
  switch (category.toLowerCase()) {
    case 'parachoques':
      return const CategoryStyle(Icons.directions_car_filled_outlined, Color(0xFF2E62B8));
    case 'bigotes':
      return const CategoryStyle(Icons.air, Color(0xFF38BDF8));
    case 'pisaderas':
      return const CategoryStyle(Icons.stairs_outlined, Color(0xFF94A3B8));
    case 'barras':
      return const CategoryStyle(Icons.horizontal_rule, Color(0xFFE11D2E));
    case 'lonas':
      return const CategoryStyle(Icons.web_asset, Color(0xFFD4A017));
    case 'kit de levante':
      return const CategoryStyle(Icons.height, Color(0xFFF97316));
    case 'guardafangos':
      return const CategoryStyle(Icons.shield_outlined, Color(0xFF22C55E));
    case 'pernos':
      return const CategoryStyle(Icons.handyman_outlined, Color(0xFFA1A1AA));
    case 'cubre pickup':
      return const CategoryStyle(Icons.inventory_2_outlined, Color(0xFFB45309));
    case 'botaguas':
      return const CategoryStyle(Icons.water_drop_outlined, Color(0xFF0EA5E9));
    case 'polarizado':
      return const CategoryStyle(Icons.brightness_6_outlined, Color(0xFF8B5CF6));
    case 'kit cromados':
      return const CategoryStyle(Icons.auto_awesome, Color(0xFFEAB308));
    case 'llantas':
      return const CategoryStyle(Icons.album_outlined, Color(0xFF64748B));
    case 'neumáticos':
    case 'neumaticos':
      return const CategoryStyle(Icons.tire_repair, Color(0xFFF59E0B));
    case 'amortiguadores':
      return const CategoryStyle(Icons.swap_vert, Color(0xFF14B8A6));
    case 'focos':
      return const CategoryStyle(Icons.lightbulb_outline, Color(0xFFFBBF24));
    case 'radios':
      return const CategoryStyle(Icons.radio_outlined, Color(0xFFEC4899));
    case 'máquinas':
    case 'maquinas':
      return const CategoryStyle(Icons.precision_manufacturing_outlined, Color(0xFFFB7185));
    case 'insumos':
      return const CategoryStyle(Icons.science_outlined, Color(0xFF34D399));
    default:
      return const CategoryStyle(Icons.category_outlined, Color(0xFF9CBDF2));
  }
}

IconData categoryIcon(String category) => categoryStyle(category).icon;

String itemName(List<StockItem> items, String sku) {
  for (final item in items) {
    if (item.sku == sku) return item.name;
  }
  return sku;
}

String prettyWhen(DateTime date) {
  final now = DateTime.now();
  final sameDay = date.year == now.year && date.month == now.month && date.day == now.day;
  final time = DateFormat('HH:mm').format(date);
  if (sameDay) return 'Hoy $time';
  final yesterday = now.subtract(const Duration(days: 1));
  if (date.year == yesterday.year && date.month == yesterday.month && date.day == yesterday.day) {
    return 'Ayer $time';
  }
  return DateFormat("d MMM HH:mm", 'es').format(date);
}
