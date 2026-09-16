import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/models.dart';
import '../services/errors.dart';
import '../state/inventory_store.dart';
import '../theme.dart';
import '../widgets/widgets.dart';

class AssignScreen extends StatefulWidget {
  const AssignScreen({super.key, this.initialSku, this.initialPlate, this.embedded = false});
  final String? initialSku;
  final String? initialPlate;
  final bool embedded;

  @override
  State<AssignScreen> createState() => _AssignScreenState();
}

class _AssignScreenState extends State<AssignScreen> {
  String? sku;
  String? workerId;
  String? plate;
  bool otherUse = false;
  int qty = 1;
  int step = 0;
  bool busy = false;
  final itemSearch = TextEditingController();
  final plateSearch = TextEditingController();
  final note = TextEditingController();

  @override
  void initState() {
    super.initState();
    sku = widget.initialSku;
    plate = widget.initialPlate;
    if (sku != null) {
      step = 1;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        _openWorkerPicker(context.read<InventoryStore>());
      });
    }
  }

  @override
  void dispose() {
    itemSearch.dispose();
    plateSearch.dispose();
    note.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final store = context.watch<InventoryStore>();
    final item = sku == null ? null : store.itemBySku(sku!);
    final body = ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
      children: [
        if (widget.embedded) ...[
          const Text('SALIDA', style: TextStyle(color: RgColors.brandLight, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 1.6)),
          const SizedBox(height: 4),
          const Text('Entregar', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, letterSpacing: -0.6)),
          const SizedBox(height: 6),
        ],
        const Text(
          'Elemento, responsable y destino: patente u observación.',
          style: TextStyle(color: RgColors.muted, height: 1.4),
        ),
        const SizedBox(height: 16),
        _Steps(step: step),
        const SizedBox(height: 18),
        if (step == 0) ..._itemStep(store),
        if (step == 1) ..._workerStep(store, item),
        if (step == 2) ..._destinationStep(store, item),
      ],
    );

    if (widget.embedded) {
      return SafeArea(child: body);
    }
    return Scaffold(
      appBar: AppBar(title: const Text('Entregar')),
      body: body,
    );
  }

  List<Widget> _itemStep(InventoryStore store) {
    final q = itemSearch.text.toLowerCase();
    final items = store.items.where((it) {
      return '${it.name} ${it.sku} ${it.brand} ${it.category}'.toLowerCase().contains(q);
    }).where((it) => it.stock > 0).toList();

    return [
      const Text('1. Qué se entrega', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
      const SizedBox(height: 8),
      TextField(
        controller: itemSearch,
        decoration: const InputDecoration(prefixIcon: Icon(Icons.search), hintText: 'barra hilux, pisadera…'),
        onChanged: (_) => setState(() {}),
      ),
      const SizedBox(height: 8),
      if (items.isEmpty)
        const Text('No hay stock de ese elemento. Primero recíbelo.', style: TextStyle(color: RgColors.yellow))
      else
        ...items.take(q.isEmpty ? 10 : 20).map((it) {
          return Card(
            child: ListTile(
              title: Text(it.name),
              subtitle: Text('Stock ${it.stock}'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {
                setState(() {
                  sku = it.sku;
                  qty = 1;
                  step = 1;
                });
                WidgetsBinding.instance.addPostFrameCallback((_) {
                  if (mounted) _openWorkerPicker(context.read<InventoryStore>());
                });
              },
            ),
          );
        }),
    ];
  }

  List<Widget> _workerStep(InventoryStore store, StockItem? item) {
    final workers = store.workers.where((w) => w.active).toList();
    final selected = workerId == null ? null : store.workerById(workerId!);
    return [
      TextButton.icon(
        onPressed: () => setState(() => step = 0),
        icon: const Icon(Icons.arrow_back),
        label: Text(item?.name ?? 'Cambiar elemento'),
      ),
      const Text('2. Trabajador que lo recibió', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
      const SizedBox(height: 8),
      Text(
        'Abre la lista, elige a la persona y sigue. No hace falta bajar toda la pantalla.',
        style: const TextStyle(color: RgColors.muted, height: 1.35),
      ),
      const SizedBox(height: 16),
      if (workers.isEmpty)
        const Text('Jefatura aún no carga trabajadores.', style: TextStyle(color: RgColors.yellow))
      else ...[
        if (selected != null) ...[
          Card(
            color: const Color(0x33173A79),
            child: ListTile(
              leading: _WorkerAvatar(name: selected.fullName, selected: true),
              title: Text(selected.fullName, style: const TextStyle(fontWeight: FontWeight.w800)),
              subtitle: Text(selected.jobTitle),
              trailing: const Icon(Icons.check_circle, color: RgColors.green),
            ),
          ),
          const SizedBox(height: 12),
        ],
        FilledButton.icon(
          style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52)),
          onPressed: () => _openWorkerPicker(store),
          icon: Icon(selected == null ? Icons.person_add_alt_1 : Icons.swap_horiz),
          label: Text(selected == null ? 'Asignar trabajador' : 'Cambiar trabajador'),
        ),
        if (selected != null) ...[
          const SizedBox(height: 10),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: RgColors.red,
              minimumSize: const Size.fromHeight(52),
            ),
            onPressed: () => setState(() => step = 2),
            child: const Text('Continuar'),
          ),
        ],
      ],
    ];
  }

  Future<void> _openWorkerPicker(InventoryStore store) async {
    final workers = store.workers.where((w) => w.active).toList();
    if (workers.isEmpty) return;
    final chosen = await showDialog<Worker>(
      context: context,
      barrierColor: Colors.black.withValues(alpha: 0.62),
      builder: (ctx) => _WorkerPickerDialog(workers: workers),
    );
    if (chosen == null || !mounted) return;
    setState(() {
      workerId = chosen.id;
      step = 2;
    });
  }

  List<Widget> _destinationStep(InventoryStore store, StockItem? item) {
    final q = plateSearch.text.toLowerCase();
    final units = store.vehicles.where((v) {
      return '${v.plate} ${v.brand} ${v.model}'.toLowerCase().contains(q);
    }).toList();
    final worker = workerId == null ? null : store.workerById(workerId!);
    final noteOk = note.text.trim().isNotEmpty;
    final canSave = item != null && workerId != null && (otherUse ? noteOk : plate != null);

    return [
      TextButton.icon(
        onPressed: () => setState(() => step = 1),
        icon: const Icon(Icons.arrow_back),
        label: Text(worker?.fullName ?? 'Cambiar responsable'),
      ),
      const Text('3. Dónde se usa', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
      const SizedBox(height: 8),
      const Text(
        'Si va a una patente, búscalo. Si no es un vehículo, deja la observación.',
        style: TextStyle(color: RgColors.muted, height: 1.35),
      ),
      const SizedBox(height: 14),
      Row(
        children: [
          Expanded(
            child: _UseChoice(
              selected: !otherUse,
              icon: Icons.directions_car_outlined,
              label: 'Vehículo',
              onTap: () => setState(() {
                otherUse = false;
                note.clear();
              }),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: _UseChoice(
              selected: otherUse,
              icon: Icons.notes_outlined,
              label: 'Otro uso',
              onTap: () => setState(() {
                otherUse = true;
                plate = null;
                plateSearch.clear();
              }),
            ),
          ),
        ],
      ),
      const SizedBox(height: 16),
      if (otherUse) ...[
        TextField(
          controller: note,
          minLines: 3,
          maxLines: 5,
          textCapitalization: TextCapitalization.sentences,
          decoration: const InputDecoration(
            labelText: 'Observación',
            hintText: 'Ej. limpieza de patio, muestra en vitrina, uso en taller…',
          ),
          onChanged: (_) => setState(() {}),
        ),
      ] else ...[
        TextField(
          controller: plateSearch,
          textCapitalization: TextCapitalization.characters,
          decoration: const InputDecoration(
            prefixIcon: Icon(Icons.search),
            hintText: 'Patente, Hilux, Katana…',
          ),
          onChanged: (_) => setState(() {}),
        ),
        const SizedBox(height: 8),
        if (store.vehicles.isEmpty)
          const Text('Aún no hay patentes. Espera la lectura de RG MOTORS.', style: TextStyle(color: RgColors.yellow))
        else if (q.isEmpty)
          Text(
            '${store.vehicles.length} patentes. Escribe para encontrar la unidad.',
            style: const TextStyle(color: RgColors.muted, fontSize: 13),
          ),
        ...units.take(q.isEmpty ? 6 : 40).map((v) {
          final on = v.plate == plate;
          return Card(
            color: on ? const Color(0x33173A79) : null,
            child: ListTile(
              leading: PlateChip(plate: v.plate),
              title: Text(v.title, maxLines: 1, overflow: TextOverflow.ellipsis),
              subtitle: Text('${v.year} · ${v.status}'),
              trailing: on ? const Icon(Icons.check_circle, color: RgColors.green) : null,
              onTap: () => setState(() => plate = v.plate),
            ),
          );
        }),
      ],
      if (item != null && workerId != null) ...[
        const SizedBox(height: 16),
        const Text('Cantidad', style: TextStyle(fontWeight: FontWeight.w800)),
        Row(
          children: [
            IconButton.filledTonal(
              onPressed: qty > 1 ? () => setState(() => qty--) : null,
              icon: const Icon(Icons.remove),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text('$qty', style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800)),
            ),
            IconButton.filledTonal(
              onPressed: qty < item.stock ? () => setState(() => qty++) : null,
              icon: const Icon(Icons.add),
            ),
          ],
        ),
        const SizedBox(height: 12),
        FilledButton(
          style: FilledButton.styleFrom(backgroundColor: RgColors.red, minimumSize: const Size.fromHeight(52)),
          onPressed: busy || !canSave ? null : () => _save(store, item),
          child: Text(busy ? 'Entregando…' : 'Entregar $qty ${item.name}'),
        ),
        if (!canSave)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(
              otherUse ? 'Escribe dónde se usó para poder entregar.' : 'Elige la patente para poder entregar.',
              style: const TextStyle(color: RgColors.muted, fontSize: 13),
            ),
          ),
      ],
    ];
  }

  Future<void> _save(InventoryStore store, StockItem item) async {
    if (workerId == null) return;
    if (!otherUse && plate == null) return;
    if (otherUse && note.text.trim().isEmpty) return;
    setState(() => busy = true);
    try {
      await store.deliverItem(
        sku: item.sku,
        qty: qty,
        workerId: workerId!,
        plate: otherUse ? null : plate,
        outcome: 'usado',
        note: otherUse ? note.text.trim() : null,
      );
      if (!mounted) return;
      final worker = store.workerById(workerId!);
      final where = otherUse ? note.text.trim() : plate;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('${item.name} · ${worker?.fullName} · $where')),
      );
      setState(() {
        sku = null;
        workerId = null;
        plate = null;
        otherUse = false;
        qty = 1;
        step = 0;
        itemSearch.clear();
        plateSearch.clear();
        note.clear();
      });
      if (!widget.embedded) Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(friendlyError(e))));
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }
}

class _WorkerPickerDialog extends StatefulWidget {
  const _WorkerPickerDialog({required this.workers});
  final List<Worker> workers;

  @override
  State<_WorkerPickerDialog> createState() => _WorkerPickerDialogState();
}

class _WorkerPickerDialogState extends State<_WorkerPickerDialog> {
  final search = TextEditingController();

  @override
  void dispose() {
    search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final q = search.text.trim().toLowerCase();
    final people = widget.workers.where((w) {
      if (q.isEmpty) return true;
      return '${w.fullName} ${w.jobTitle}'.toLowerCase().contains(q);
    }).toList()
      ..sort((a, b) => a.fullName.toLowerCase().compareTo(b.fullName.toLowerCase()));

    return Dialog(
      backgroundColor: RgColors.ink800,
      insetPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 28),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(22),
        side: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
      ),
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.sizeOf(context).height * 0.72,
          maxWidth: 440,
        ),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  const Expanded(
                    child: Text('Asignar trabajador', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
              const Text(
                'Quién lo recibe y queda como responsable.',
                style: TextStyle(color: RgColors.muted, height: 1.35),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: search,
                autofocus: widget.workers.length > 6,
                decoration: const InputDecoration(
                  prefixIcon: Icon(Icons.search),
                  hintText: 'Buscar por nombre o área',
                ),
                onChanged: (_) => setState(() {}),
              ),
              const SizedBox(height: 10),
              Expanded(
                child: people.isEmpty
                    ? const Padding(
                        padding: EdgeInsets.symmetric(vertical: 28),
                        child: Text('Nadie coincide con esa búsqueda.', textAlign: TextAlign.center, style: TextStyle(color: RgColors.muted)),
                      )
                    : ListView.separated(
                        shrinkWrap: true,
                        itemCount: people.length,
                        separatorBuilder: (_, _) => const SizedBox(height: 8),
                        itemBuilder: (_, i) {
                          final w = people[i];
                          return Material(
                            color: RgColors.ink700,
                            borderRadius: BorderRadius.circular(14),
                            child: InkWell(
                              borderRadius: BorderRadius.circular(14),
                              onTap: () => Navigator.pop(context, w),
                              child: Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                child: Row(
                                  children: [
                                    _WorkerAvatar(name: w.fullName),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(w.fullName, style: const TextStyle(fontWeight: FontWeight.w800)),
                                          Text(w.jobTitle, style: const TextStyle(color: RgColors.muted, fontSize: 13)),
                                        ],
                                      ),
                                    ),
                                    const Icon(Icons.chevron_right, color: RgColors.muted),
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _WorkerAvatar extends StatelessWidget {
  const _WorkerAvatar({required this.name, this.selected = false});
  final String name;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    final parts = name.trim().split(RegExp(r'\s+'));
    final initials = parts.take(2).map((p) => p.isEmpty ? '' : p[0]).join().toUpperCase();
    return CircleAvatar(
      radius: 20,
      backgroundColor: selected ? RgColors.brandMid : RgColors.brand,
      child: Text(initials, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
    );
  }
}

class _UseChoice extends StatelessWidget {
  const _UseChoice({
    required this.selected,
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final bool selected;
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? const Color(0x33173A79) : RgColors.ink800,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: selected ? RgColors.brandMid : Colors.white.withValues(alpha: 0.1),
            ),
          ),
          child: Column(
            children: [
              Icon(icon, color: selected ? RgColors.brandLight : RgColors.muted),
              const SizedBox(height: 6),
              Text(label, style: TextStyle(fontWeight: FontWeight.w800, color: selected ? Colors.white : RgColors.muted)),
            ],
          ),
        ),
      ),
    );
  }
}

class _Steps extends StatelessWidget {
  const _Steps({required this.step});
  final int step;

  @override
  Widget build(BuildContext context) {
    const labels = ['Elemento', 'Trabajador', 'Destino'];
    return Row(
      children: [
        for (var i = 0; i < labels.length; i++) ...[
          if (i > 0) const Expanded(child: Divider()),
          Column(
            children: [
              CircleAvatar(
                radius: 12,
                backgroundColor: i <= step ? RgColors.brandMid : RgColors.ink700,
                child: Text('${i + 1}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800)),
              ),
              const SizedBox(height: 4),
              Text(labels[i], style: TextStyle(fontSize: 11, color: i <= step ? Colors.white : RgColors.muted)),
            ],
          ),
        ],
      ],
    );
  }
}
