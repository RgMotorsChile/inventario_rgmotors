import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../models/models.dart';
import '../services/errors.dart';
import '../state/inventory_store.dart';
import '../theme.dart';
import '../widgets/widgets.dart';

class InboundScreen extends StatefulWidget {
  const InboundScreen({super.key, this.asPage = true, this.initialSku});
  final bool asPage;
  final String? initialSku;

  @override
  State<InboundScreen> createState() => _InboundScreenState();
}

class _InboundScreenState extends State<InboundScreen> {
  final search = TextEditingController();
  final qty = TextEditingController(text: '1');
  StockItem? selected;
  String? newItemName;
  String category = 'General';
  Uint8List? photoBytes;
  bool busy = false;
  bool primed = false;

  @override
  void dispose() {
    search.dispose();
    qty.dispose();
    super.dispose();
  }

  List<StockItem> _matches(InventoryStore store) {
    final q = search.text.trim().toLowerCase();
    final items = store.items;
    if (q.isEmpty) return items;
    return items.where((item) {
      return item.name.toLowerCase().contains(q) ||
          item.brand.toLowerCase().contains(q) ||
          item.sku.toLowerCase().contains(q) ||
          item.compatible.toLowerCase().contains(q) ||
          item.category.toLowerCase().contains(q);
    }).toList();
  }

  Future<void> _takePhoto() async {
    final picker = ImagePicker();
    XFile? shot;
    try {
      shot = await picker.pickImage(
        source: kIsWeb ? ImageSource.gallery : ImageSource.camera,
        imageQuality: 70,
      );
    } catch (_) {
      shot = await picker.pickImage(source: ImageSource.gallery, imageQuality: 70);
    }
    if (shot == null) return;
    final bytes = await shot.readAsBytes();
    if (!mounted) return;
    setState(() => photoBytes = bytes);
  }

  void _bump(int delta) {
    final current = int.tryParse(qty.text.trim()) ?? 1;
    final next = (current + delta).clamp(1, 9999);
    qty.text = '$next';
    setState(() {});
  }

  Future<void> _openNewItem() async {
    final store = context.read<InventoryStore>();
    final draft = await showDialog<_NewItemDraft>(
      context: context,
      builder: (_) => _NewItemDialog(categories: store.categories),
    );
    if (draft == null || !mounted) return;
    setState(() {
      selected = null;
      newItemName = draft.name;
      search.text = draft.name;
      category = draft.category;
    });
  }

  Future<void> _receive() async {
    final item = selected;
    final typed = (newItemName ?? search.text).trim();
    if (item == null && typed.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Elige un elemento o crea uno nuevo')));
      return;
    }
    if (photoBytes == null && !kIsWeb) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Saca una foto del elemento que llegó')));
      return;
    }
    final parsed = int.tryParse(qty.text.trim());
    if (parsed == null || parsed < 1) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Indica cuántas unidades llegaron')));
      return;
    }

    setState(() => busy = true);
    try {
      await context.read<InventoryStore>().receiveStock(
            sku: item?.sku,
            name: item == null ? typed : item.name,
            category: category,
            qty: parsed,
            photoBytes: photoBytes,
          );
      if (!mounted) return;
      final label = item?.name ?? typed;
      setState(() {
        selected = null;
        newItemName = null;
        photoBytes = null;
        qty.text = '1';
        search.clear();
        category = 'General';
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('+$parsed $label al inventario')),
      );
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
    if (!primed && widget.initialSku != null) {
      selected = store.itemBySku(widget.initialSku!);
      primed = true;
    }
    final matches = _matches(store);
    final body = SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('BODEGA', style: TextStyle(color: RgColors.brandLight, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 1.6)),
          const SizedBox(height: 4),
          const SectionTitle(
            'Recibir',
            subtitle: 'Foto, nombre y cantidad. Si no está en la lista, usá Elemento nuevo.',
          ),
          GestureDetector(
            onTap: busy ? null : _takePhoto,
            child: Container(
              height: 200,
              decoration: BoxDecoration(
                color: RgColors.ink800,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF2A3144)),
              ),
              clipBehavior: Clip.antiAlias,
              child: photoBytes == null
                  ? Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.photo_camera_outlined, size: 42, color: RgColors.brandLight),
                        const SizedBox(height: 8),
                        Text(
                          kIsWeb ? 'Adjuntar foto de lo que llegó' : 'Sacar foto de lo que llegó',
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          kIsWeb ? 'En el celular del encargado es con cámara' : 'Toca para abrir la cámara',
                          style: const TextStyle(color: RgColors.muted),
                        ),
                      ],
                    )
                  : Stack(
                      fit: StackFit.expand,
                      children: [
                        Image.memory(photoBytes!, fit: BoxFit.cover),
                        Align(
                          alignment: Alignment.bottomRight,
                          child: Padding(
                            padding: const EdgeInsets.all(8),
                            child: FilledButton.tonal(
                              onPressed: _takePhoto,
                              child: const Text('Otra foto'),
                            ),
                          ),
                        ),
                      ],
                    ),
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: search,
            textCapitalization: TextCapitalization.words,
            decoration: const InputDecoration(
              labelText: 'Buscar en la lista',
              hintText: 'barra hilux, barra maxus, pisadera…',
              prefixIcon: Icon(Icons.search),
            ),
            onChanged: (_) => setState(() {
              if (selected != null && search.text.trim().toLowerCase() != selected!.name.toLowerCase()) {
                selected = null;
              }
              if (newItemName != null && search.text.trim().toLowerCase() != newItemName!.toLowerCase()) {
                newItemName = null;
              }
            }),
          ),
          const SizedBox(height: 10),
          OutlinedButton.icon(
            onPressed: busy ? null : _openNewItem,
            icon: const Icon(Icons.add_circle_outline),
            label: const Text('Elemento nuevo'),
          ),
          const SizedBox(height: 10),
          if (newItemName != null)
            Card(
              color: const Color(0x33173A79),
              child: ListTile(
                leading: const Icon(Icons.new_label_outlined, color: RgColors.brandLight),
                title: Text(newItemName!, style: const TextStyle(fontWeight: FontWeight.w800)),
                subtitle: Text('Nuevo · $category. Se crea al sumar.'),
                trailing: IconButton(
                  tooltip: 'Quitar',
                  onPressed: () => setState(() {
                    newItemName = null;
                    search.clear();
                  }),
                  icon: const Icon(Icons.close),
                ),
              ),
            ),
          if (store.items.isEmpty)
            const Text('No hay catálogo todavía. Usá Elemento nuevo para crear el primero.', style: TextStyle(color: RgColors.muted))
          else
            ...matches.take(12).map((item) {
              final on = selected?.sku == item.sku;
              return Card(
                color: on ? const Color(0x33173A79) : null,
                child: ListTile(
                  title: Text(item.name, style: const TextStyle(fontWeight: FontWeight.w700)),
                  subtitle: Text('${item.brand} · stock ${item.stock} · ${item.location}'),
                  trailing: on ? const Icon(Icons.check_circle, color: RgColors.green) : null,
                  onTap: () => setState(() {
                    selected = item;
                    newItemName = null;
                    search.text = item.name;
                    category = item.category.isEmpty ? 'General' : item.category;
                  }),
                ),
              );
            }),
          if (matches.isEmpty && search.text.trim().isNotEmpty && newItemName == null)
            Card(
              color: const Color(0x33173A79),
              child: ListTile(
                title: Text('«${search.text.trim()}» no está en la lista'),
                subtitle: const Text('Usá Elemento nuevo para crearlo con su categoría.'),
                trailing: IconButton(
                  onPressed: _openNewItem,
                  icon: const Icon(Icons.add_circle_outline, color: RgColors.green),
                ),
              ),
            ),
          if (store.categories.isNotEmpty) ...[
            const SizedBox(height: 8),
            const Text('Categoría', style: TextStyle(fontWeight: FontWeight.w800)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: [
                ...store.categories,
                if (!store.categories.contains('General')) 'General',
              ].map((c) {
                final on = category == c;
                return ChoiceChip(
                  label: Text(c),
                  selected: on,
                  onSelected: (_) => setState(() => category = c),
                  selectedColor: RgColors.brand,
                  labelStyle: TextStyle(color: on ? Colors.white : RgColors.muted),
                );
              }).toList(),
            ),
          ],
          const SizedBox(height: 16),
          const Text('Cantidad que llegó', style: TextStyle(fontWeight: FontWeight.w800)),
          const SizedBox(height: 8),
          Row(
            children: [
              IconButton.filledTonal(onPressed: () => _bump(-1), icon: const Icon(Icons.remove)),
              Expanded(
                child: TextField(
                  controller: qty,
                  textAlign: TextAlign.center,
                  keyboardType: TextInputType.number,
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800),
                  decoration: const InputDecoration(labelText: 'Unidades'),
                ),
              ),
              IconButton.filledTonal(onPressed: () => _bump(1), icon: const Icon(Icons.add)),
            ],
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: busy ? null : _receive,
            icon: const Icon(Icons.add_box_outlined),
            label: Text(busy
                ? 'Sumando…'
                : 'Sumar ${qty.text} ${selected?.name ?? newItemName ?? (search.text.trim().isEmpty ? 'al inventario' : search.text.trim())}'),
          ),
        ],
      ),
    );

    if (!widget.asPage) return body;
    return Scaffold(
      appBar: AppBar(title: const Text('Sumar al inventario')),
      body: body,
    );
  }
}

class _NewItemDraft {
  const _NewItemDraft({required this.name, required this.category});
  final String name;
  final String category;
}

class _NewItemDialog extends StatefulWidget {
  const _NewItemDialog({required this.categories});
  final List<String> categories;

  @override
  State<_NewItemDialog> createState() => _NewItemDialogState();
}

class _NewItemDialogState extends State<_NewItemDialog> {
  final name = TextEditingController();
  final newCategory = TextEditingController();
  String? category;
  bool creatingCategory = false;

  @override
  void initState() {
    super.initState();
    if (widget.categories.isNotEmpty) {
      category = widget.categories.first;
    } else {
      creatingCategory = true;
    }
  }

  @override
  void dispose() {
    name.dispose();
    newCategory.dispose();
    super.dispose();
  }

  void _submit() {
    final itemName = name.text.trim();
    final typedCat = newCategory.text.trim();
    final chosen = creatingCategory ? typedCat : (category ?? typedCat);
    if (itemName.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Escribí el nombre del elemento')));
      return;
    }
    if (chosen.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Elegí o creá una categoría')));
      return;
    }
    final existing = widget.categories.cast<String?>().firstWhere(
          (c) => c!.toLowerCase() == chosen.toLowerCase(),
          orElse: () => null,
        );
    Navigator.pop(context, _NewItemDraft(name: itemName, category: existing ?? chosen));
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: RgColors.ink800,
      insetPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 24),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(22),
        side: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
      ),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(18, 16, 18, 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                const Expanded(
                  child: Text('Elemento nuevo', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
                ),
                IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close)),
              ],
            ),
            const Text(
              'Nombre y familia. Si la categoría no existe, se crea y queda asignada a este elemento.',
              style: TextStyle(color: RgColors.muted, height: 1.35),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: name,
              autofocus: true,
              textCapitalization: TextCapitalization.words,
              decoration: const InputDecoration(
                labelText: 'Nombre',
                hintText: 'Pisadera Amarok, barra L200…',
              ),
            ),
            const SizedBox(height: 14),
            const Text('Categoría', style: TextStyle(fontWeight: FontWeight.w800)),
            const SizedBox(height: 8),
            if (!creatingCategory && widget.categories.isNotEmpty)
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: widget.categories.map((c) {
                  final on = category == c;
                  return ChoiceChip(
                    label: Text(c),
                    selected: on,
                    onSelected: (_) => setState(() => category = c),
                    selectedColor: RgColors.brand,
                    labelStyle: TextStyle(color: on ? Colors.white : RgColors.muted),
                  );
                }).toList(),
              ),
            if (creatingCategory) ...[
              TextField(
                controller: newCategory,
                textCapitalization: TextCapitalization.words,
                decoration: const InputDecoration(
                  labelText: 'Nueva categoría',
                  hintText: 'Capotas, Enganches…',
                ),
              ),
              TextButton(
                onPressed: () => setState(() => creatingCategory = false),
                child: const Text('Usar una categoría existente'),
              ),
            ] else
              TextButton.icon(
                onPressed: () => setState(() => creatingCategory = true),
                icon: const Icon(Icons.create_new_folder_outlined),
                label: const Text('Crear categoría'),
              ),
            const SizedBox(height: 8),
            FilledButton(
              onPressed: _submit,
              child: const Text('Usar este elemento'),
            ),
          ],
        ),
      ),
    );
  }
}
