import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:package_info_plus/package_info_plus.dart';

import '../services/app_update.dart';
import '../theme.dart';

class AppUpdateGate extends StatefulWidget {
  const AppUpdateGate({super.key, required this.child});
  final Widget child;

  @override
  State<AppUpdateGate> createState() => _AppUpdateGateState();
}

class _AppUpdateGateState extends State<AppUpdateGate> with WidgetsBindingObserver {
  final AppUpdateController _update = AppUpdateController();
  Timer? _poll;
  int _currentCode = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _update.addListener(_onUpdate);
    _boot();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _poll?.cancel();
    _update.removeListener(_onUpdate);
    _update.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) _refresh();
  }

  Future<void> _boot() async {
    if (kIsWeb || defaultTargetPlatform != TargetPlatform.android) return;
    final info = await PackageInfo.fromPlatform();
    _currentCode = int.tryParse(info.buildNumber) ?? 0;
    await _refresh();
    _poll = Timer.periodic(const Duration(minutes: 15), (_) => _refresh());
  }

  Future<void> _refresh() => _update.check(currentCode: _currentCode);

  void _onUpdate() {
    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        widget.child,
        if (_update.hasUpdate) _UpdateCard(controller: _update),
      ],
    );
  }
}

class _UpdateCard extends StatelessWidget {
  const _UpdateCard({required this.controller});
  final AppUpdateController controller;

  @override
  Widget build(BuildContext context) {
    final release = controller.available!;
    return Material(
      color: const Color(0xE607080C),
      child: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: RgColors.ink800,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
                ),
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 22, 20, 18),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Text('Hay una actualización', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
                      const SizedBox(height: 8),
                      Text(
                        'Inventario RG ${release.versionName} ya está lista. Actualiza para seguir con la última versión.',
                        style: const TextStyle(color: RgColors.muted, height: 1.45),
                      ),
                      if (release.notes != null && release.notes!.trim().isNotEmpty) ...[
                        const SizedBox(height: 10),
                        Text(release.notes!, style: const TextStyle(height: 1.4)),
                      ],
                      if (controller.progress != null) ...[
                        const SizedBox(height: 16),
                        LinearProgressIndicator(value: controller.progress == 0 ? null : controller.progress),
                        const SizedBox(height: 6),
                        Text(
                          controller.progress! >= 1
                              ? 'Abriendo el instalador…'
                              : 'Descargando ${(controller.progress! * 100).round()}%',
                          style: const TextStyle(color: RgColors.muted, fontSize: 13),
                        ),
                      ],
                      if (controller.permissionNeeded) ...[
                        const SizedBox(height: 12),
                        const Text(
                          'Permite instalar apps de Inventario RG y vuelve a apretar Actualizar.',
                          style: TextStyle(color: RgColors.yellow, height: 1.4),
                        ),
                      ],
                      if (controller.error != null) ...[
                        const SizedBox(height: 12),
                        Text(controller.error!, style: const TextStyle(color: RgColors.red)),
                      ],
                      const SizedBox(height: 18),
                      FilledButton(
                        onPressed: controller.busy ? null : controller.apply,
                        child: Text(controller.busy ? 'Actualizando…' : 'Actualizar'),
                      ),
                      if (!release.forceUpdate) ...[
                        const SizedBox(height: 8),
                        TextButton(
                          onPressed: controller.busy ? null : controller.dismiss,
                          child: const Text('Después'),
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
    );
  }
}
