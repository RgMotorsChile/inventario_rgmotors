import 'dart:math' as math;

import 'package:flutter/material.dart';

class CategoryMark extends StatelessWidget {
  const CategoryMark({super.key, required this.category, this.size = 26});

  final String category;
  final double size;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(painter: _MarkPainter(category.toLowerCase())),
    );
  }
}

class _MarkPainter extends CustomPainter {
  _MarkPainter(this.keyName);
  final String keyName;

  @override
  void paint(Canvas canvas, Size size) {
    final stroke = Paint()
      ..color = const Color(0xFFE8ECF4)
      ..style = PaintingStyle.stroke
      ..strokeWidth = size.width * 0.072
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;
    final fill = Paint()
      ..color = const Color(0xFFE8ECF4)
      ..style = PaintingStyle.fill;

    final s = size.shortestSide;
    void line(double x1, double y1, double x2, double y2) {
      canvas.drawLine(Offset(x1 * s, y1 * s), Offset(x2 * s, y2 * s), stroke);
    }

    switch (keyName) {
      case 'parachoques':
        canvas.drawPath(
          Path()
            ..moveTo(0.12 * s, 0.42 * s)
            ..quadraticBezierTo(0.50 * s, 0.78 * s, 0.88 * s, 0.42 * s)
            ..moveTo(0.18 * s, 0.38 * s)
            ..lineTo(0.82 * s, 0.38 * s),
          stroke,
        );
        line(0.22, 0.38, 0.22, 0.28);
        line(0.78, 0.38, 0.78, 0.28);
      case 'bigotes':
        canvas.drawPath(
          Path()
            ..moveTo(0.12 * s, 0.28 * s)
            ..quadraticBezierTo(0.22 * s, 0.62 * s, 0.46 * s, 0.72 * s)
            ..moveTo(0.88 * s, 0.28 * s)
            ..quadraticBezierTo(0.78 * s, 0.62 * s, 0.54 * s, 0.72 * s),
          stroke,
        );
      case 'pisaderas':
        line(0.16, 0.72, 0.84, 0.72);
        line(0.22, 0.52, 0.78, 0.52);
        line(0.30, 0.32, 0.70, 0.32);
        line(0.16, 0.72, 0.30, 0.32);
        line(0.84, 0.72, 0.70, 0.32);
      case 'barras':
        canvas.drawPath(
          Path()
            ..moveTo(0.18 * s, 0.78 * s)
            ..lineTo(0.18 * s, 0.32 * s)
            ..quadraticBezierTo(0.50 * s, 0.08 * s, 0.82 * s, 0.32 * s)
            ..lineTo(0.82 * s, 0.78 * s),
          stroke,
        );
        line(0.18, 0.48, 0.82, 0.48);
      case 'lonas':
        canvas.drawPath(
          Path()
            ..moveTo(0.16 * s, 0.30 * s)
            ..lineTo(0.84 * s, 0.30 * s)
            ..lineTo(0.78 * s, 0.74 * s)
            ..lineTo(0.22 * s, 0.74 * s)
            ..close(),
          stroke,
        );
        line(0.16, 0.30, 0.28, 0.18);
        line(0.28, 0.18, 0.72, 0.18);
        line(0.72, 0.18, 0.84, 0.30);
      case 'kit de levante':
        line(0.50, 0.16, 0.50, 0.58);
        line(0.34, 0.32, 0.50, 0.16);
        line(0.66, 0.32, 0.50, 0.16);
        line(0.22, 0.70, 0.78, 0.70);
        line(0.28, 0.70, 0.28, 0.82);
        line(0.72, 0.70, 0.72, 0.82);
      case 'guardafangos':
        canvas.drawArc(Rect.fromCircle(center: Offset(0.50 * s, 0.62 * s), radius: 0.28 * s), 3.4, 2.6, false, stroke);
        canvas.drawCircle(Offset(0.50 * s, 0.68 * s), 0.14 * s, stroke);
      case 'pernos':
        final hex = Path();
        for (var i = 0; i < 6; i++) {
          final a = (i * 60 - 30) * math.pi / 180;
          final x = 0.50 * s + 0.30 * s * math.cos(a);
          final y = 0.50 * s + 0.30 * s * math.sin(a);
          if (i == 0) {
            hex.moveTo(x, y);
          } else {
            hex.lineTo(x, y);
          }
        }
        hex.close();
        canvas.drawPath(hex, stroke);
        canvas.drawCircle(Offset(0.50 * s, 0.50 * s), 0.10 * s, stroke);
      case 'cubre pickup':
        line(0.14, 0.38, 0.86, 0.38);
        line(0.14, 0.38, 0.14, 0.72);
        line(0.86, 0.38, 0.86, 0.72);
        line(0.14, 0.72, 0.86, 0.72);
        line(0.14, 0.52, 0.86, 0.52);
        line(0.50, 0.38, 0.50, 0.72);
      case 'botaguas':
        canvas.drawPath(
          Path()
            ..moveTo(0.50 * s, 0.18 * s)
            ..quadraticBezierTo(0.22 * s, 0.48 * s, 0.50 * s, 0.82 * s)
            ..quadraticBezierTo(0.78 * s, 0.48 * s, 0.50 * s, 0.18 * s),
          stroke,
        );
      case 'polarizado':
        canvas.drawPath(
          Path()
            ..moveTo(0.18 * s, 0.28 * s)
            ..lineTo(0.82 * s, 0.28 * s)
            ..lineTo(0.74 * s, 0.78 * s)
            ..lineTo(0.26 * s, 0.78 * s)
            ..close(),
          stroke,
        );
        line(0.34, 0.40, 0.58, 0.66);
        line(0.46, 0.40, 0.68, 0.62);
      case 'kit cromados':
        line(0.18, 0.70, 0.82, 0.70);
        line(0.26, 0.58, 0.74, 0.58);
        canvas.drawCircle(Offset(0.50 * s, 0.32 * s), 0.07 * s, fill);
        line(0.50, 0.16, 0.50, 0.22);
        line(0.34, 0.32, 0.40, 0.32);
        line(0.60, 0.32, 0.66, 0.32);
      case 'llantas':
        canvas.drawCircle(Offset(0.50 * s, 0.50 * s), 0.34 * s, stroke);
        canvas.drawCircle(Offset(0.50 * s, 0.50 * s), 0.10 * s, stroke);
        for (var i = 0; i < 5; i++) {
          final a = i * 1.2566;
          line(0.50 + 0.10 * math.cos(a), 0.50 + 0.10 * math.sin(a), 0.50 + 0.30 * math.cos(a), 0.50 + 0.30 * math.sin(a));
        }
      case 'neumáticos':
      case 'neumaticos':
        canvas.drawCircle(Offset(0.50 * s, 0.50 * s), 0.34 * s, stroke);
        canvas.drawCircle(Offset(0.50 * s, 0.50 * s), 0.20 * s, stroke);
        for (var i = 0; i < 8; i++) {
          final a = i * 0.785;
          line(0.50 + 0.22 * math.cos(a), 0.50 + 0.22 * math.sin(a), 0.50 + 0.34 * math.cos(a), 0.50 + 0.34 * math.sin(a));
        }
      case 'amortiguadores':
        line(0.50, 0.14, 0.50, 0.30);
        line(0.38, 0.30, 0.62, 0.30);
        line(0.38, 0.30, 0.62, 0.42);
        line(0.62, 0.42, 0.38, 0.54);
        line(0.38, 0.54, 0.62, 0.66);
        line(0.38, 0.66, 0.62, 0.66);
        line(0.50, 0.66, 0.50, 0.86);
      case 'focos':
        canvas.drawCircle(Offset(0.50 * s, 0.42 * s), 0.22 * s, stroke);
        line(0.50, 0.68, 0.50, 0.86);
        line(0.38, 0.86, 0.62, 0.86);
        line(0.18, 0.28, 0.08, 0.20);
        line(0.82, 0.28, 0.92, 0.20);
        line(0.50, 0.12, 0.50, 0.04);
      case 'radios':
        canvas.drawCircle(Offset(0.42 * s, 0.58 * s), 0.16 * s, stroke);
        canvas.drawCircle(Offset(0.42 * s, 0.58 * s), 0.055 * s, fill);
        line(0.54, 0.48, 0.78, 0.18);
        line(0.78, 0.18, 0.70, 0.18);
        line(0.78, 0.18, 0.78, 0.26);
      case 'máquinas':
      case 'maquinas':
        canvas.drawCircle(Offset(0.50 * s, 0.50 * s), 0.16 * s, stroke);
        for (var i = 0; i < 6; i++) {
          final a = i * 1.047;
          canvas.drawCircle(Offset(0.50 * s + 0.32 * s * math.cos(a), 0.50 * s + 0.32 * s * math.sin(a)), 0.065 * s, stroke);
        }
      case 'insumos':
        line(0.38, 0.18, 0.62, 0.18);
        line(0.42, 0.18, 0.42, 0.30);
        line(0.58, 0.18, 0.58, 0.30);
        canvas.drawPath(
          Path()
            ..moveTo(0.34 * s, 0.30 * s)
            ..lineTo(0.66 * s, 0.30 * s)
            ..lineTo(0.70 * s, 0.82 * s)
            ..lineTo(0.30 * s, 0.82 * s)
            ..close(),
          stroke,
        );
      default:
        canvas.drawRRect(
          RRect.fromRectAndRadius(
            Rect.fromLTWH(0.22 * s, 0.22 * s, 0.56 * s, 0.56 * s),
            Radius.circular(0.08 * s),
          ),
          stroke,
        );
    }
  }

  @override
  bool shouldRepaint(covariant _MarkPainter oldDelegate) => oldDelegate.keyName != keyName;
}
