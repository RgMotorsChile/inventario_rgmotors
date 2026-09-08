const vehicles = [
  { plate: "THZF 75", brand: "Mitsubishi", model: "KATANA 4X2", year: 2024, color: "Rojo", status: "En preparación" },
  { plate: "RGGZ 96", brand: "Mitsubishi", model: "KATANA WORK 4X2", year: 2022, color: "Blanco", status: "En preparación" },
  { plate: "PGBV 10", brand: "Mitsubishi", model: "L200 KATANA 4X4", year: 2020, color: "Rojo", status: "Disponible" },
  { plate: "RBFK 40", brand: "Mitsubishi", model: "L200 KATANA 4X2", year: 2021, color: "Rojo", status: "Disponible" },
  { plate: "PXSV 97", brand: "Mitsubishi", model: "L200 WORK 4X2", year: 2021, color: "Rojo", status: "Disponible" },
  { plate: "SWDV 33", brand: "Toyota", model: "HILUX 4X2", year: 2023, color: "Blanco", status: "En preparación" },
  { plate: "RWYR 12", brand: "Toyota", model: "HILUX SR 4X4", year: 2022, color: "Gris", status: "Disponible" },
  { plate: "TCGB 98", brand: "Nissan", model: "NAVARA XE 4X2", year: 2024, color: "Blanco", status: "Disponible" },
  { plate: "SBZC 70", brand: "Peugeot", model: "PARTNER HDI 92", year: 2022, color: "Blanco", status: "Disponible" },
  { plate: "SCDW 37", brand: "Peugeot", model: "EXPERT", year: 2022, color: "Gris", status: "Disponible" },
];

const items = [
  { id: "BAR-MIT-L200", name: "Barra antivuelco L200 / Katana", cat: "Barras", brand: "Mitsubishi", stock: 8, min: 4, loc: "Pasillo B · Estante A3", cost: 189000, compat: "L200, Katana 4x2/4x4" },
  { id: "PIS-MIT-L200", name: "Pisadera aluminio L200 / Katana", cat: "Pisaderas", brand: "Mitsubishi", stock: 12, min: 4, loc: "Pasillo B · Estante A1", cost: 145000, compat: "L200, Katana" },
  { id: "LON-MIT-L200", name: "Lona marítima Mitsubishi", cat: "Lonas", brand: "Mitsubishi", stock: 3, min: 4, loc: "Pasillo C · Rack 2", cost: 98000, compat: "L200, Katana" },
  { id: "CAP-MIT-L200", name: "Capota rígida L200", cat: "Capotas", brand: "Mitsubishi", stock: 2, min: 2, loc: "Zona patio · Cubierta", cost: 420000, compat: "L200 Katana" },
  { id: "LED-BAR-12", name: "Barra LED techo 12.000 lm", cat: "Iluminación", brand: "Universal", stock: 15, min: 6, loc: "Pasillo A · Cajón 4", cost: 79000, compat: "Camionetas 4x2/4x4" },
  { id: "ENG-2P", name: "Enganche remolque 2 pulgadas", cat: "Enganches", brand: "Universal", stock: 6, min: 3, loc: "Pasillo D · Estante B2", cost: 65000, compat: "L200, Hilux, Navara" },
  { id: "FIL-OIL-24", name: "Filtro de aceite 2.4 Diésel", cat: "Mantención", brand: "Mitsubishi", stock: 24, min: 10, loc: "Pasillo A · Cajón 1", cost: 12900, compat: "L200 / Katana 2.4" },
  { id: "NEU-265-17", name: "Neumático 265/65 R17", cat: "Neumáticos", brand: "Universal", stock: 8, min: 8, loc: "Bodega neumáticos", cost: 135000, compat: "L200, Hilux, Navara" },
  { id: "BAR-TOY-HIL", name: "Barra antivuelco Hilux", cat: "Barras", brand: "Toyota", stock: 5, min: 3, loc: "Pasillo B · Estante B3", cost: 195000, compat: "Hilux 4x2/4x4" },
  { id: "ALF-TOY-HIL", name: "Alfombra goma Hilux", cat: "Interior", brand: "Toyota", stock: 10, min: 4, loc: "Pasillo C · Estante C1", cost: 28000, compat: "Hilux" },
  { id: "PIS-PEU-PAR", name: "Pisadera Peugeot Partner", cat: "Pisaderas", brand: "Peugeot", stock: 4, min: 2, loc: "Pasillo B · Estante C2", cost: 89000, compat: "Partner / Expert" },
  { id: "RAD-AND-9", name: "Radio Android 9 pulgadas", cat: "Electrónica", brand: "Universal", stock: 7, min: 3, loc: "Pasillo A · Caja fuerte", cost: 159000, compat: "Universal DIN 2" },
];

const movements = [
  { t: "Hoy 09:14", type: "uso", item: "Barra antivuelco L200 / Katana", qty: 1, plate: "THZF 75", vehicle: "Mitsubishi Katana 4X2 2024", user: "Carlos Soto" },
  { t: "Hoy 08:42", type: "uso", item: "Barra LED techo 12.000 lm", qty: 1, plate: "RGGZ 96", vehicle: "Mitsubishi Katana Work 2022", user: "Carlos Soto" },
  { t: "Hoy 08:10", type: "ingreso", item: "Filtro de aceite 2.4 Diésel", qty: 12, plate: "—", vehicle: "Guía 00481 · Autopartes Sur", user: "Carlos Soto" },
  { t: "Ayer 17:21", type: "uso", item: "Lona marítima Mitsubishi", qty: 1, plate: "PGBV 10", vehicle: "Mitsubishi L200 Katana 4x4", user: "Diego Muñoz" },
  { t: "Ayer 15:03", type: "uso", item: "Pisadera aluminio L200 / Katana", qty: 1, plate: "PXSV 97", vehicle: "Mitsubishi L200 Work 4X2", user: "Carlos Soto" },
  { t: "Ayer 11:40", type: "uso", item: "Barra antivuelco Hilux", qty: 1, plate: "SWDV 33", vehicle: "Toyota Hilux 4X2 2023", user: "Diego Muñoz" },
  { t: "Lun 16:12", type: "ingreso", item: "Barra antivuelco L200 / Katana", qty: 4, plate: "—", vehicle: "Guía 00477 · Offroad PM", user: "Carlos Soto" },
];

const unitHistory = {
  "THZF 75": [
    { when: "Hoy 09:14", item: "Barra antivuelco L200 / Katana", qty: 1, user: "Carlos Soto" },
    { when: "Ayer 10:05", item: "Filtro de aceite 2.4 Diésel", qty: 1, user: "Carlos Soto" },
  ],
  "RGGZ 96": [
    { when: "Hoy 08:42", item: "Barra LED techo 12.000 lm", qty: 1, user: "Carlos Soto" },
  ],
  "PGBV 10": [
    { when: "Ayer 17:21", item: "Lona marítima Mitsubishi", qty: 1, user: "Diego Muñoz" },
  ],
  "SWDV 33": [
    { when: "Ayer 11:40", item: "Barra antivuelco Hilux", qty: 1, user: "Diego Muñoz" },
  ],
  "PXSV 97": [
    { when: "Ayer 15:03", item: "Pisadera aluminio L200 / Katana", qty: 1, user: "Carlos Soto" },
  ],
};

const boxes = [
  {
    code: "RG-CAJA-00482",
    barcode: "7804629004821",
    supplier: "Offroad Puerto Montt",
    guide: "00482",
    eta: "Llegó hoy 13:20",
    received: false,
    lines: [
      { id: "BAR-MIT-L200", qty: 4 },
      { id: "PIS-MIT-L200", qty: 2 },
      { id: "LON-MIT-L200", qty: 3 },
      { id: "LED-BAR-12", qty: 6 },
    ],
  },
  {
    code: "RG-CAJA-00481",
    barcode: "7804629004814",
    supplier: "Autopartes Sur",
    guide: "00481",
    eta: "Ingresada esta mañana",
    received: true,
    lines: [{ id: "FIL-OIL-24", qty: 12 }],
  },
];

const state = {
  view: "dashboard",
  itemFilter: "Todos",
  q: "",
  selectedItem: null,
  wizard: { step: 1, itemId: "BAR-MIT-L200", plate: "", qty: 1, note: "" },
  selectedUnit: "THZF 75",
  scan: { phase: "camera", boxCode: null, skipped: {} },
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];
const money = (n) => n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
const stockState = (it) => it.stock === 0 ? "out" : it.stock <= it.min ? "low" : "ok";
const stockLabel = (s) => s === "out" ? "Sin stock" : s === "low" ? "Stock bajo" : "En nivel";

function icon(name) {
  const paths = {
    panel: '<path d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z" fill="none" stroke="currentColor" stroke-width="1.8"/>',
    box: '<path d="M4 8l8-4 8 4-8 4-8-4zM4 8v8l8 4 8-4V8" fill="none" stroke="currentColor" stroke-width="1.8"/>',
    use: '<path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    in: '<path d="M12 4v12M7 11l5 5 5-5M5 20h14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    hist: '<path d="M5 6h14M5 12h14M5 18h9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    car: '<path d="M4 15h16l-1.5-5H6L4 15zm2 0v3m12-3v3M7 10l1.2-3h7.6L17 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
    alert: '<path d="M12 4l9 16H3L12 4zm0 6v4m0 3h.01" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  };
  return `<svg viewBox="0 0 24 24">${paths[name]}</svg>`;
}

function plateHtml(p) {
  return `<span class="plate"><small>CHILE</small><b>${p}</b></span>`;
}

function showToast(title, text) {
  const el = $("#toast");
  el.innerHTML = `<b>${title}</b><div>${text}</div>`;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 4200);
}

function go(view, extra) {
  state.view = view;
  if (extra?.itemId) state.selectedItem = extra.itemId;
  if (extra?.plate) state.selectedUnit = extra.plate;
  if (extra?.wizardItem) {
    state.wizard = { step: extra.step || 2, itemId: extra.wizardItem, plate: extra.plate || "", qty: 1, note: "" };
  }
  $$(".nav button").forEach((b) => b.classList.toggle("active", b.dataset.view === view));
  $$(".view").forEach((v) => v.classList.toggle("active", v.id === `view-${view}`));
  render();
}

function render() {
  $("#clock").textContent = new Date().toLocaleString("es-CL", { weekday: "short", hour: "2-digit", minute: "2-digit" });
  renderDashboard();
  renderInventory();
  renderDetail();
  renderWizard();
  renderMoves();
  renderUnits();
  renderUnitDetail();
  renderAlerts();
  renderScan();
  renderBoxes();
}

function renderDashboard() {
  const low = items.filter((i) => stockState(i) !== "ok").length;
  const value = items.reduce((a, i) => a + i.stock * i.cost, 0);
  const usosHoy = movements.filter((m) => m.type === "uso" && m.t.startsWith("Hoy")).length + (state._usedToday || 0);
  $("#kpi-skus").textContent = items.length;
  $("#kpi-value").textContent = money(value);
  $("#kpi-low").textContent = low;
  $("#kpi-uses").textContent = usosHoy;

  $("#dash-alerts").innerHTML = items.filter((i) => stockState(i) !== "ok").map((i) => `
    <div class="alert-card ${i.stock <= 2 ? "crit" : ""}">
      <div>
        <strong>${i.name}</strong>
        <div class="sku-sub">${i.id} · mínimo ${i.min} · quedan ${i.stock}</div>
      </div>
      <button class="btn btn-soft" onclick="go('detail',{itemId:'${i.id}'})">Ver</button>
    </div>
  `).join("") || `<div class="empty">Sin alertas. Bodega en nivel.</div>`;

  $("#dash-moves").innerHTML = movements.slice(0, 6).map((m) => `
    <div class="row-item">
      <div>
        <div class="sku-name">${m.item}</div>
        <div class="sku-sub">${m.t} · ${m.type === "uso" ? m.vehicle + " · " + m.plate : m.vehicle}</div>
      </div>
      <span class="pill ${m.type === "uso" ? "pill-use" : "pill-in"}">${m.type === "uso" ? "−" + m.qty : "+" + m.qty}</span>
    </div>
  `).join("");

  $("#dash-units").innerHTML = vehicles.filter((v) => v.status === "En preparación").map((v) => `
    <div class="choice" onclick="go('unit',{plate:'${v.plate}'})">
      ${plateHtml(v.plate)}
      <div>
        <div class="sku-name">${v.brand} ${v.model}</div>
        <div class="sku-sub">${v.year} · ${v.color} · ${(unitHistory[v.plate] || []).length} elementos instalados</div>
      </div>
    </div>
  `).join("");
}

function filteredItems() {
  const q = (state.q || $("#global-search")?.value || "").toLowerCase();
  return items.filter((i) => {
    const catOk = state.itemFilter === "Todos" || i.cat === state.itemFilter || i.brand === state.itemFilter;
    const text = `${i.name} ${i.id} ${i.brand} ${i.cat} ${i.compat}`.toLowerCase();
    return catOk && (!q || text.includes(q));
  });
}

function renderInventory() {
  const cats = ["Todos", "Barras", "Pisaderas", "Lonas", "Mitsubishi", "Toyota", "Peugeot"];
  $("#inv-filters").innerHTML = cats.map((c) =>
    `<button class="filter ${state.itemFilter === c ? "on" : ""}" onclick="state.itemFilter='${c}';render()">${c}</button>`
  ).join("");

  $("#inv-rows").innerHTML = filteredItems().map((i) => {
    const s = stockState(i);
    const pct = Math.min(100, Math.round((i.stock / Math.max(i.min * 2.2, 1)) * 100));
    const color = s === "ok" ? "var(--green)" : s === "low" ? "var(--yellow)" : "var(--red)";
    return `
      <div class="sku-row" onclick="go('detail',{itemId:'${i.id}'})">
        <div>
          <div class="sku-name">${i.name}</div>
          <div class="sku-sub">${i.id} · ${i.loc}</div>
        </div>
        <div>${i.cat}<div class="sku-sub">${i.brand}</div></div>
        <div>
          <strong>${i.stock} u.</strong>
          <div class="stock-bar"><i style="width:${pct}%;background:${color}"></i></div>
        </div>
        <div class="sku-sub">${i.compat}</div>
        <div><span class="pill pill-${s}">${stockLabel(s)}</span></div>
        <button class="btn btn-danger" onclick="event.stopPropagation();go('use',{wizardItem:'${i.id}',step:2})">Usar</button>
      </div>`;
  }).join("") || `<div class="empty">No hay coincidencias en bodega.</div>`;
}

function renderDetail() {
  const i = items.find((x) => x.id === (state.selectedItem || "BAR-MIT-L200"));
  if (!i) return;
  const s = stockState(i);
  const hist = movements.filter((m) => m.item === i.name);
  $("#detail-card").innerHTML = `
    <div class="mark"><img src="assets/logo-transparent.png" alt="" style="height:72px;opacity:.9"></div>
    <div class="sku-sub">${i.id}</div>
    <h3>${i.name}</h3>
    <span class="pill pill-${s}">${stockLabel(s)} · ${i.stock} unidades</span>
    <div class="meta-list">
      <div><span>Categoría</span><b>${i.cat}</b></div>
      <div><span>Marca / línea</span><b>${i.brand}</b></div>
      <div><span>Ubicación</span><b>${i.loc}</b></div>
      <div><span>Compatible</span><b>${i.compat}</b></div>
      <div><span>Costo unitario</span><b>${money(i.cost)}</b></div>
      <div><span>Valor en bodega</span><b>${money(i.cost * i.stock)}</b></div>
      <div><span>Mínimo operativo</span><b>${i.min} u.</b></div>
    </div>
    <div style="display:flex;gap:8px;margin-top:16px">
      <button class="btn btn-danger" style="flex:1" onclick="go('use',{wizardItem:'${i.id}',step:2})">Usar en unidad</button>
      <button class="btn btn-ghost" style="flex:1" onclick="go('inbound')">Ingresar</button>
    </div>`;

  $("#detail-hist").innerHTML = hist.map((m) => `
    <div class="move-row">
      <div class="sku-sub">${m.t}</div>
      <div>${m.type === "uso" ? "Instalado en unidad" : "Ingreso a bodega"}</div>
      <div>${m.type === "uso" ? plateHtml(m.plate) + `<div class="sku-sub">${m.vehicle}</div>` : m.vehicle}</div>
      <div class="pill ${m.type === "uso" ? "pill-use" : "pill-in"}">${m.type === "uso" ? "−" : "+"}${m.qty}</div>
      <div class="sku-sub">${m.user}</div>
    </div>
  `).join("") || `<div class="empty">Aún no hay movimientos de este SKU.</div>`;
}

function renderWizard() {
  const w = state.wizard;
  const item = items.find((x) => x.id === w.itemId) || items[0];
  const q = ($("#wizard-plate")?.value || w.plate || "").toLowerCase();
  const matches = vehicles.filter((v) =>
    `${v.plate} ${v.brand} ${v.model}`.toLowerCase().includes(q)
  );
  $$(".step").forEach((el, idx) => el.classList.toggle("on", idx + 1 === w.step));

  $("#wiz-items").innerHTML = items.map((i) => `
    <button class="choice ${i.id === item.id ? "sel" : ""}" onclick="state.wizard.itemId='${i.id}';render()">
      <div style="flex:1">
        <div class="sku-name">${i.name}</div>
        <div class="sku-sub">${i.id} · stock ${i.stock} · ${i.loc}</div>
      </div>
      <span class="pill pill-${stockState(i)}">${i.stock} u.</span>
    </button>
  `).join("");

  $("#wiz-units").innerHTML = matches.map((v) => `
    <button class="choice ${w.plate === v.plate ? "sel" : ""}" onclick="state.wizard.plate='${v.plate}';state.wizard.step=3;render()">
      ${plateHtml(v.plate)}
      <div>
        <div class="sku-name">${v.brand} ${v.model}</div>
        <div class="sku-sub">${v.year} · ${v.color} · ${v.status} · sincronizado desde planilla</div>
      </div>
    </button>
  `).join("") || `<div class="empty">Escribe patente, marca o modelo. Las unidades vienen de la hoja de inventario en tiempo real.</div>`;

  const unit = vehicles.find((v) => v.plate === w.plate);
  $("#wiz-confirm").innerHTML = unit ? `
    <div class="confirm-box">
      <h2>Confirmar descuento</h2>
      <div class="meta-list">
        <div><span>Elemento</span><b>${item.name}</b></div>
        <div><span>SKU</span><b>${item.id}</b></div>
        <div><span>Unidad</span><b>${unit.brand} ${unit.model} ${unit.year}</b></div>
        <div><span>Patente</span><b>${unit.plate}</b></div>
        <div><span>Stock actual</span><b>${item.stock} u.</b></div>
        <div><span>Quedará en bodega</span><b>${Math.max(0, item.stock - w.qty)} u.</b></div>
      </div>
      <div class="qty-box" style="margin:16px 0">
        <button onclick="state.wizard.qty=Math.max(1,state.wizard.qty-1);render()">−</button>
        <strong>${w.qty}</strong>
        <button onclick="state.wizard.qty=Math.min(item.stock,state.wizard.qty+1);render()">+</button>
        <span class="sku-sub">unidades a descontar</span>
      </div>
      <div class="field">
        <label>Nota de instalación (opcional)</label>
        <input value="${w.note}" oninput="state.wizard.note=this.value" placeholder="Ej: instalada en taller, queda para entrega">
      </div>
      <div class="after">Al confirmar, el inventario baja al instante y queda el rastro: quién, cuándo, en qué camioneta y con qué patente.</div>
      <div style="display:flex;gap:8px;margin-top:14px">
        <button class="btn btn-ghost" onclick="state.wizard.step=2;render()">Volver</button>
        <button class="btn btn-danger" style="flex:1" onclick="confirmUse()">Descontar de bodega</button>
      </div>
    </div>` : `<div class="empty">Selecciona una patente para cerrar el movimiento.</div>`;

  $("#wiz-pane-1").style.display = w.step === 1 ? "block" : "none";
  $("#wiz-pane-2").style.display = w.step === 2 ? "block" : "none";
  $("#wiz-pane-3").style.display = w.step === 3 ? "block" : "none";
}

function confirmUse() {
  const w = state.wizard;
  const item = items.find((x) => x.id === w.itemId);
  const unit = vehicles.find((v) => v.plate === w.plate);
  if (!item || !unit || item.stock < w.qty) return;
  item.stock -= w.qty;
  movements.unshift({
    t: "Ahora",
    type: "uso",
    item: item.name,
    qty: w.qty,
    plate: unit.plate,
    vehicle: `${unit.brand} ${unit.model} ${unit.year}`,
    user: "Carlos Soto",
  });
  unitHistory[unit.plate] = unitHistory[unit.plate] || [];
  unitHistory[unit.plate].unshift({ when: "Ahora", item: item.name, qty: w.qty, user: "Carlos Soto" });
  state._usedToday = (state._usedToday || 0) + 1;
  showToast("Inventario actualizado", `${item.name} (−${w.qty}) quedó registrada en ${unit.brand} ${unit.model} · ${unit.plate}`);
  go("unit", { plate: unit.plate });
}

function renderMoves() {
  const type = $("#move-filter")?.value || "todos";
  const rows = movements.filter((m) => type === "todos" || m.type === type);
  $("#move-rows").innerHTML = rows.map((m) => `
    <div class="move-row">
      <div class="sku-sub">${m.t}</div>
      <div>
        <div class="sku-name">${m.item}</div>
        <div class="sku-sub">${m.user}</div>
      </div>
      <div>${m.type === "uso" ? plateHtml(m.plate) + `<div class="sku-sub">${m.vehicle}</div>` : `<div class="sku-sub">${m.vehicle}</div>`}</div>
      <div><span class="pill ${m.type === "uso" ? "pill-use" : "pill-in"}">${m.type === "uso" ? "Salida" : "Ingreso"}</span></div>
      <div><strong>${m.type === "uso" ? "−" : "+"}${m.qty}</strong></div>
    </div>
  `).join("");
}

function renderUnits() {
  $("#unit-rows").innerHTML = vehicles.map((v) => {
    const n = (unitHistory[v.plate] || []).length;
    return `
      <div class="unit-row" onclick="go('unit',{plate:'${v.plate}'})">
        ${plateHtml(v.plate)}
        <div><div class="sku-name">${v.brand} ${v.model}</div><div class="sku-sub">${v.year} · ${v.color}</div></div>
        <div>${v.status}</div>
        <div>${n} ítem${n === 1 ? "" : "s"}</div>
        <div class="sku-sub">Planilla viva</div>
        <button class="btn btn-soft" onclick="event.stopPropagation();go('use',{wizardItem:'BAR-MIT-L200',plate:'${v.plate}',step:3})">Usar</button>
      </div>`;
  }).join("");
}

function renderUnitDetail() {
  const v = vehicles.find((x) => x.plate === state.selectedUnit) || vehicles[0];
  const hist = unitHistory[v.plate] || [];
  $("#unit-hero").innerHTML = `
    <div style="display:flex;gap:16px;align-items:center;margin-bottom:16px">
      ${plateHtml(v.plate)}
      <div>
        <h3 style="font-size:22px">${v.brand} ${v.model}</h3>
        <div class="sku-sub">${v.year} · ${v.color} · ${v.status}</div>
      </div>
    </div>
    <div class="meta-list">
      <div><span>Origen</span><b>Hoja inventario RG Motors</b></div>
      <div><span>Ubicación</span><b>Puerto Montt · patio</b></div>
      <div><span>Elementos usados</span><b>${hist.length}</b></div>
      <div><span>Costo accesorios</span><b>${money(hist.reduce((a, h) => {
        const it = items.find((i) => i.name === h.item);
        return a + (it ? it.cost * h.qty : 0);
      }, 0))}</b></div>
    </div>
    <button class="btn btn-danger" style="width:100%;margin-top:16px" onclick="go('use',{wizardItem:'BAR-MIT-L200',plate:'${v.plate}',step:2})">Registrar uso en esta patente</button>`;

  $("#unit-tl").innerHTML = hist.length ? hist.map((h) => `
    <div class="tl">
      <i></i>
      <div class="body">
        <div class="when">${h.when} · ${h.user}</div>
        <div class="sku-name">${h.item}</div>
        <div class="sku-sub">${h.qty} unidad descontada de bodega en tiempo real</div>
      </div>
    </div>
  `).join("") : `<div class="empty">Esta unidad todavía no tiene elementos de bodega.</div>`;
}

function renderAlerts() {
  $("#alert-list").innerHTML = items.filter((i) => stockState(i) !== "ok").map((i) => `
    <div class="alert-card ${i.stock <= 2 ? "crit" : ""}">
      <div>
        <strong>${i.name}</strong>
        <div class="sku-sub">Quedan ${i.stock} · mínimo ${i.min} · ${i.loc}</div>
      </div>
      <button class="btn btn-ghost" onclick="go('inbound')">Reponer</button>
    </div>
  `).join("");
}

function renderBoxes() {
  const host = $("#box-list");
  if (!host) return;
  host.innerHTML = boxes.map((b) => {
    const n = b.lines.reduce((a, l) => a + l.qty, 0);
    return `
      <div class="choice ${b.received ? "" : "sel"}" onclick="${b.received ? "" : `openBox('${b.code}')`}">
        <div style="flex:1">
          <div class="sku-name">${b.code}</div>
          <div class="sku-sub">${b.supplier} · guía ${b.guide} · ${n} unidades · ${b.eta}</div>
        </div>
        <span class="pill ${b.received ? "pill-ok" : "pill-in"}">${b.received ? "Ingresada" : "Pendiente"}</span>
      </div>`;
  }).join("");
}

function renderScan() {
  const box = boxes.find((b) => b.code === state.scan.boxCode);
  const cam = $("#scan-camera");
  const found = $("#scan-found");
  const contents = $("#scan-contents");
  if (!cam || !found || !contents) return;
  cam.style.display = state.scan.phase === "camera" ? "block" : "none";
  found.style.display = state.scan.phase === "found" ? "block" : "none";
  contents.style.display = state.scan.phase === "contents" ? "block" : "none";
  if (!box) return;
  $("#scan-code").textContent = box.code;
  $("#scan-meta").textContent = `${box.supplier} · guía ${box.guide}`;
  $("#scan-lines").innerHTML = box.lines.map((l) => {
    const it = items.find((i) => i.id === l.id);
    const skip = !!state.scan.skipped[l.id];
    return `
      <div class="choice ${skip ? "" : "sel"}">
        <div style="flex:1">
          <div class="sku-name">${it.name}</div>
          <div class="sku-sub">${it.id} · hoy en bodega ${it.stock} u. · ${it.loc}</div>
        </div>
        <div style="text-align:right">
          <strong>+${l.qty}</strong>
          <div><button class="btn btn-ghost" style="padding:4px 8px;margin-top:6px;font-size:11px" onclick="toggleSkip('${l.id}')">${skip ? "Incluir" : "Falta / dañado"}</button></div>
        </div>
      </div>`;
  }).join("");
}

function openScan() {
  state.scan = { phase: "camera", boxCode: null, skipped: {} };
  go("scan");
}

function simulateScan() {
  state.scan.phase = "found";
  state.scan.boxCode = "RG-CAJA-00482";
  render();
  setTimeout(() => {
    state.scan.phase = "contents";
    render();
  }, 700);
}

function openBox(code) {
  state.scan = { phase: "contents", boxCode: code, skipped: {} };
  go("scan");
}

function toggleSkip(id) {
  state.scan.skipped[id] = !state.scan.skipped[id];
  render();
}

function confirmBox() {
  const box = boxes.find((b) => b.code === state.scan.boxCode);
  if (!box || box.received) return;
  let added = 0;
  box.lines.forEach((l) => {
    if (state.scan.skipped[l.id]) return;
    const it = items.find((i) => i.id === l.id);
    if (!it) return;
    it.stock += l.qty;
    added += l.qty;
    movements.unshift({
      t: "Ahora",
      type: "ingreso",
      item: it.name,
      qty: l.qty,
      plate: "—",
      vehicle: `Caja ${box.code} · ${box.supplier}`,
      user: "Carlos Soto",
    });
  });
  box.received = true;
  showToast("Caja ingresada al inventario", `${box.code}: +${added} unidades leídas del código de barras. Stock actualizado en vivo.`);
  go("inventory");
}

function receiveStock() {
  const id = $("#in-sku").value;
  const qty = Number($("#in-qty").value || 0);
  const item = items.find((x) => x.id === id);
  if (!item || qty < 1) return;
  item.stock += qty;
  movements.unshift({
    t: "Ahora",
    type: "ingreso",
    item: item.name,
    qty,
    plate: "—",
    vehicle: `Guía ${$("#in-guide").value || "s/n"} · ${$("#in-sup").value || "Proveedor"}`,
    user: "Carlos Soto",
  });
  showToast("Ingreso registrado", `${item.name} +${qty}. Stock actual: ${item.stock}`);
  go("inventory");
}

function bootApp() {
  $("#login").classList.add("app-hidden");
  $("#app").classList.remove("app-hidden");
  go("dashboard");
}

window.go = go;
window.state = state;
window.render = render;
window.confirmUse = confirmUse;
window.receiveStock = receiveStock;
window.bootApp = bootApp;
window.openScan = openScan;
window.simulateScan = simulateScan;
window.openBox = openBox;
window.toggleSkip = toggleSkip;
window.confirmBox = confirmBox;

document.addEventListener("DOMContentLoaded", () => {
  $("#in-sku").innerHTML = items.map((i) => `<option value="${i.id}">${i.name}</option>`).join("");
  $("#global-search").addEventListener("input", (e) => {
    state.q = e.target.value;
    if (state.view === "inventory" || state.view === "dashboard") render();
  });
  setInterval(() => {
    $("#clock").textContent = new Date().toLocaleString("es-CL", { weekday: "short", hour: "2-digit", minute: "2-digit" });
  }, 30000);
});
