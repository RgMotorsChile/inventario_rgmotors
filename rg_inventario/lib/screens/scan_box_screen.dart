import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';

import '../models/models.dart';
import '../services/errors.dart';
import '../state/inventory_store.dart';
import '../theme.dart';

class ScanBoxScreen extends StatefulWidget {
  const ScanBoxScreen({super.key});

  @override
  State<ScanBoxScreen> createState() => _ScanBoxScreenState();
}

class _ScanBoxScreenState extends State<ScanBoxScreen> {
  final controller = MobileScannerController();
  final manual = TextEditingController();
  WarehouseBox? box;
  final skipped = <String>{};
  Uint8List? evidence;
  bool busy = false;
  String? error;

  @override
  void dispose() {
    controller.dispose();
    manual.dispose();
    super.dispose();
  }

  void _onDetect(BarcodeCapture capture) {
    if (capture.barcodes.isEmpty) return;
    final value = capture.barcodes.first.rawValue;
    if (value == null || box != null) return;
    _resolve(value);
  }

  void _resolve(String code) {
    final found = context.read<InventoryStore>().boxByCode(code);
    if (found == null) {
      setState(() => error = 'No hay una caja con el código $code');
      return;
    }
    if (found.received) {
      setState(() => error = 'La caja ${found.code} ya fue ingresada');
      return;
    }
    setState(() {
      box = found;
      error = null;
    });
    controller.stop();
  }

  Future<void> _confirm() async {
    final current = box;
    if (current == null) return;
    setState(() => busy = true);
    try {
      await context.read<InventoryStore>().receiveBox(
            code: current.code,
            skipped: skipped.toList(),
            evidenceBytes: evidence,
          );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('${current.code} subida al inventario en vivo.')),
      );
      Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(friendlyError(e))));
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final store = context.watch<InventoryStore>();
    return Scaffold(
      appBar: AppBar(title: const Text('Escanear caja')),
      body: box == null ? _camera(store) : _contents(store, box!),
    );
  }

  Widget _camera(InventoryStore store) {
    return Column(
      children: [
        Expanded(
          child: Stack(
            fit: StackFit.expand,
            children: [
              MobileScanner(controller: controller, onDetect: _onDetect),
              IgnorePointer(
                child: Center(
                  child: Container(
                    width: 240,
                    height: 160,
                    decoration: BoxDecoration(
                      border: Border.all(color: RgColors.brandMid, width: 2),
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'Apunta al código de barras o QR de la caja. El sistema abre el packing list de ese código.',
                style: TextStyle(color: RgColors.muted, height: 1.4),
              ),
              if (error != null) ...[
                const SizedBox(height: 8),
                Text(error!, style: const TextStyle(color: RgColors.red)),
              ],
              const SizedBox(height: 10),
              TextField(
                controller: manual,
                decoration: const InputDecoration(
                  labelText: 'O escribe el código',
                  hintText: 'RG-CAJA-00482 o 7804629004821',
                ),
              ),
              const SizedBox(height: 8),
              FilledButton(
                onPressed: () => _resolve(manual.text.trim()),
                child: const Text('Buscar caja'),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _contents(InventoryStore store, WarehouseBox current) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('Caja reconocida', style: TextStyle(color: RgColors.green, fontWeight: FontWeight.w700)),
        Text(current.code, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800)),
        Text('${current.supplier} · guía ${current.guide}', style: const TextStyle(color: RgColors.muted)),
        const SizedBox(height: 16),
        ...current.lines.map((line) {
          final item = store.itemBySku(line.itemSku);
          final skip = skipped.contains(line.itemSku);
          return Card(
            color: skip ? RgColors.ink900 : const Color(0x22173A79),
            child: ListTile(
              title: Text(item?.name ?? line.itemSku),
              subtitle: Text('${line.itemSku} · hoy ${item?.stock ?? 0} u. · ${item?.location ?? ''}'),
              trailing: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('+${line.qty}', style: const TextStyle(fontWeight: FontWeight.w800)),
                  TextButton(
                    onPressed: () => setState(() {
                      if (skip) {
                        skipped.remove(line.itemSku);
                      } else {
                        skipped.add(line.itemSku);
                      }
                    }),
                    child: Text(skip ? 'Incluir' : 'Falta / dañado', style: const TextStyle(fontSize: 11)),
                  ),
                ],
              ),
            ),
          );
        }),
        const SizedBox(height: 12),
        OutlinedButton.icon(
          onPressed: busy
              ? null
              : () async {
                  final shot = await ImagePicker().pickImage(
                    source: ImageSource.camera,
                    imageQuality: 70,
                  );
                  if (shot == null) return;
                  final bytes = await shot.readAsBytes();
                  if (!mounted) return;
                  setState(() => evidence = bytes);
                },
          icon: const Icon(Icons.photo_camera_outlined),
          label: Text(evidence == null ? 'Foto de evidencia (faltantes / daños)' : 'Foto lista'),
        ),
        const SizedBox(height: 12),
        const Text(
          'Al confirmar, cada línea se suma al stock en tiempo real.',
          style: TextStyle(color: RgColors.green, height: 1.4),
        ),
        const SizedBox(height: 12),
        FilledButton(
          onPressed: busy ? null : _confirm,
          child: Text(busy ? 'Subiendo…' : 'Subir caja al inventario'),
        ),
      ],
    );
  }
}
