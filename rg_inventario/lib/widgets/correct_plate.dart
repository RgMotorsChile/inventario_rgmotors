import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/models.dart';
import '../services/errors.dart';
import '../state/inventory_store.dart';
import '../theme.dart';

class CorrectPlateAction extends StatelessWidget {
  const CorrectPlateAction({super.key, required this.movement});
  final StockMovement movement;

  @override
  Widget build(BuildContext context) {
    if (!movement.canCorrectPlate()) return const SizedBox.shrink();
    return TextButton(
      onPressed: () => showCorrectPlateSheet(context, movement),
      child: const Text('Corregir'),
    );
  }
}

Future<void> showCorrectPlateSheet(BuildContext context, StockMovement m) async {
  if (!m.canCorrectPlate()) return;
  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => _CorrectPlateSheet(movement: m),
  );
}

class _CorrectPlateSheet extends StatefulWidget {
  const _CorrectPlateSheet({required this.movement});
  final StockMovement movement;

  @override
  State<_CorrectPlateSheet> createState() => _CorrectPlateSheetState();
}

class _CorrectPlateSheetState extends State<_CorrectPlateSheet> {
  final _plate = TextEditingController();
  final _note = TextEditingController();
  bool _busy = false;
  String? _err;

  @override
  void dispose() {
    _plate.dispose();
    _note.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() {
      _busy = true;
      _err = null;
    });
    try {
      await context.read<InventoryStore>().correctDeliveryPlate(
            movementId: widget.movement.id,
            plate: _plate.text.trim(),
            note: _note.text.trim().isEmpty ? null : _note.text.trim(),
          );
      if (!mounted) return;
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Patente corregida. El stock no cambió.')),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _busy = false;
        _err = friendlyError(e);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final m = widget.movement;
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: Material(
        color: RgColors.ink800,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 18, 20, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Corregir destino', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 6),
              Text(
                'La entrega de ${m.itemSku} queda en la patente correcta. No se toca el stock.',
                style: const TextStyle(color: RgColors.muted, fontSize: 13),
              ),
              const SizedBox(height: 14),
              InputDecorator(
                decoration: const InputDecoration(labelText: 'Patente actual'),
                child: Text(m.plate ?? '—'),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: _plate,
                textCapitalization: TextCapitalization.characters,
                decoration: const InputDecoration(
                  labelText: 'Patente correcta',
                  hintText: 'THZF 75',
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: _note,
                decoration: const InputDecoration(
                  labelText: 'Nota (opcional)',
                  hintText: 'Se asignó a la patente equivocada',
                ),
              ),
              if (_err != null) ...[
                const SizedBox(height: 10),
                Text(_err!, style: const TextStyle(color: RgColors.red)),
              ],
              const SizedBox(height: 16),
              FilledButton(
                onPressed: _busy ? null : _save,
                child: _busy
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Guardar patente'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
