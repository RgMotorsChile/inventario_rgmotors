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
            style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800, letterSpacing: 0.4),
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
