import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../theme.dart';
import '../widgets/widgets.dart';

const defaultSuspendedMessage = 'Servicio suspendido temporalmente.';

class AppSuspensionStatus {
  const AppSuspensionStatus({required this.suspended, required this.message});

  final bool suspended;
  final String message;

  static const active = AppSuspensionStatus(suspended: false, message: '');

  static AppSuspensionStatus fromRow(dynamic row) {
    final map = row is List ? (row.isEmpty ? null : row.first) : row;
    if (map is! Map) return active;
    if (map['suspendido'] != true) return active;
    final raw = '${map['mensaje'] ?? ''}'.trim();
    return AppSuspensionStatus(
      suspended: true,
      message: raw.isEmpty ? defaultSuspendedMessage : raw,
    );
  }
}

Future<AppSuspensionStatus> loadAppSuspensionStatus() async {
  try {
    final row = await Supabase.instance.client
        .from('app_status')
        .select('suspendido, mensaje')
        .eq('app', 'inventario')
        .maybeSingle();
    return AppSuspensionStatus.fromRow(row);
  } catch (_) {
    return AppSuspensionStatus.active;
  }
}

class SuspendedScreen extends StatelessWidget {
  const SuspendedScreen({
    super.key,
    required this.message,
    this.onRetry,
    this.busy = false,
  });

  final String message;
  final VoidCallback? onRetry;
  final bool busy;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: RadialGradient(
            center: Alignment(-0.8, -1.1),
            radius: 1.2,
            colors: [Color(0x73173A79), RgColors.ink950],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 440),
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(24, 28, 24, 22),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const RgLogo(height: 78),
                        const SizedBox(height: 12),
                        const Text(
                          'BODEGA · PUERTO MONTT',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            letterSpacing: 2.4,
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: RgColors.muted,
                          ),
                        ),
                        const SizedBox(height: 20),
                        const Text(
                          'Servicio suspendido temporalmente',
                          style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800),
                        ),
                        const SizedBox(height: 10),
                        Text(
                          message.isEmpty ? defaultSuspendedMessage : message,
                          style: const TextStyle(color: RgColors.muted, height: 1.5),
                        ),
                        if (onRetry != null) ...[
                          const SizedBox(height: 18),
                          FilledButton(
                            onPressed: busy ? null : onRetry,
                            child: Text(busy ? 'Verificando…' : 'Reintentar'),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
