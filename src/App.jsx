import { useState, useMemo, useEffect, useCallback } from "react";

// ── Supabase config ──────────────────────────────────────────────────────────
const SUPABASE_URL = "https://odtpipzrxuryywmtvjpm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kdHBpcHpyeHVyeXl3bXR2anBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNjM1NzQsImV4cCI6MjA5NTYzOTU3NH0.YiJcTywws5lOjM4WAHPmDaN-d-loT_nqsioJEqf41i4";
const TABLE = "ds_tracker_orders";

const sbHeaders = {
  "Content-Type": "application/json",
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Prefer": "return=representation",
};

async function sbFetch(orders) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${TABLE}?select=*&order=created_at.desc`,
    { headers: sbHeaders }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function sbInsert(row) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
    method: "POST",
    headers: sbHeaders,
    body: JSON.stringify(row),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Constants ────────────────────────────────────────────────────────────────
const COMPONENTS = ["Button", "Input", "Modal", "Card", "Dropdown", "Badge", "Tooltip", "Tabs", "Avatar", "Checkbox"];
const CELLS      = ["Tienda", "Postventa", "Conectividad", "Entretenimiento"];
const PRIORITIES = [
  { label: "Alta",  value: "Alta",  color: "#EF4444", bg: "#FEF2F2", dot: "#EF4444" },
  { label: "Media", value: "Media", color: "#D97706", bg: "#FFFBEB", dot: "#F59E0B" },
  { label: "Baja",  value: "Baja",  color: "#6B7280", bg: "#F9FAFB", dot: "#9CA3AF" },
];
const TYPES = [
  "Ajuste visual",
  "Corrección de accesibilidad",
  "Ajuste de properties",
  "Una evolución mayor",
];
const TYPE_STYLES = {
  "Ajuste visual":               { bg: "#FFF7ED", color: "#C2410C", icon: "⬡" },
  "Corrección de accesibilidad": { bg: "#F0FDF4", color: "#15803D", icon: "◎" },
  "Ajuste de properties":        { bg: "#EFF6FF", color: "#1D4ED8", icon: "◈" },
  "Una evolución mayor":         { bg: "#FAF5FF", color: "#7E22CE", icon: "⬢" },
};

// ── Sub-components ───────────────────────────────────────────────────────────
function PriorityBadge({ value }) {
  const p = PRIORITIES.find(x => x.value === value);
  if (!p) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20,
      background: p.bg, color: p.color,
      fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
      fontFamily: "DM Mono, monospace",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: p.dot, display: "inline-block", flexShrink: 0 }} />
      {p.label}
    </span>
  );
}

function TypeBadge({ value }) {
  const s = TYPE_STYLES[value] || { bg: "#F3F4F6", color: "#6B7280", icon: "○" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px", borderRadius: 4,
      background: s.bg, color: s.color,
      fontSize: 11, fontWeight: 600, letterSpacing: "0.03em", whiteSpace: "nowrap",
    }}>
      {s.icon} {value}
    </span>
  );
}

function SelectField({ label, value, onChange, options, placeholder, required = true }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--label)" }}>
        {label}{required && <span style={{ color: "#EF4444", marginLeft: 3 }}>*</span>}
      </label>
      <div style={{ position: "relative" }}>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%", appearance: "none", WebkitAppearance: "none",
            background: "var(--input-bg)", border: `1.5px solid ${focused ? "var(--accent)" : "var(--border)"}`,
            borderRadius: 8, padding: "10px 36px 10px 14px",
            fontSize: 13, color: value ? "var(--text)" : "var(--muted)",
            fontFamily: "inherit", cursor: "pointer", outline: "none",
            transition: "border-color 0.15s", lineHeight: 1.4,
          }}
        >
          <option value="" disabled>{placeholder || "Seleccionar…"}</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--muted)", fontSize: 11 }}>▾</span>
      </div>
    </div>
  );
}

function TextareaField({ label, value, onChange, placeholder, rows = 3 }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--label)" }}>
        {label} <span style={{ color: "#EF4444" }}>*</span>
      </label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%", boxSizing: "border-box",
          background: "var(--input-bg)", border: `1.5px solid ${focused ? "var(--accent)" : "var(--border)"}`,
          borderRadius: 8, padding: "10px 14px",
          fontSize: 13, color: "var(--text)", fontFamily: "inherit",
          resize: "vertical", outline: "none", lineHeight: 1.6,
          transition: "border-color 0.15s",
        }}
      />
    </div>
  );
}

function PrioritySelector({ value, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--label)" }}>
        Prioridad <span style={{ color: "#EF4444" }}>*</span>
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        {PRIORITIES.map(p => (
          <button
            key={p.value}
            type="button"
            onClick={() => onChange(p.value)}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "9px 0", borderRadius: 8, cursor: "pointer", fontFamily: "inherit",
              fontSize: 13, fontWeight: 600, transition: "all 0.15s",
              border: value === p.value ? `2px solid ${p.color}` : "1.5px solid var(--border)",
              background: value === p.value ? p.bg : "var(--input-bg)",
              color: value === p.value ? p.color : "var(--muted)",
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.dot, flexShrink: 0 }} />
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}


// ── Export to .xlsx using SheetJS ────────────────────────────────────────────
async function exportToExcel(orders) {
  // Carga SheetJS dinámicamente desde CDN
  if (!window.XLSX) {
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  const XLSX = window.XLSX;

  const COLS = [
    { key: "id",             label: "ID"                  },
    { key: "component",      label: "Componente"          },
    { key: "type",           label: "Tipo de Evolutivo"   },
    { key: "problem",        label: "Tipo de Problema"    },
    { key: "need",           label: "Necesidad o Problema"},
    { key: "requester_name", label: "Nombre y Apellido"   },
    { key: "cell",           label: "Célula Solicitante"  },
    { key: "priority",       label: "Prioridad"           },
    { key: "figma_link",     label: "Figma Link"          },
    { key: "created_at",     label: "Fecha"               },
  ];

  // Construir array de objetos para SheetJS
  const data = orders.map(o => {
    const row = {};
    COLS.forEach(c => {
      if (c.key === "created_at") {
        row[c.label] = o.created_at ? o.created_at.slice(0, 10) : "";
      } else {
        row[c.label] = o[c.key] ?? "";
      }
    });
    return row;
  });

  // Crear workbook y worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data, { header: COLS.map(c => c.label) });

  // Ancho de columnas (en caracteres)
  ws["!cols"] = [
    { wch: 6  },  // ID
    { wch: 14 },  // Componente
    { wch: 26 },  // Tipo de Evolutivo
    { wch: 48 },  // Tipo de Problema
    { wch: 48 },  // Necesidad o Problema
    { wch: 22 },  // Nombre y Apellido
    { wch: 20 },  // Célula Solicitante
    { wch: 10 },  // Prioridad
    { wch: 40 },  // Figma Link
    { wch: 12 },  // Fecha
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Pedidos DS Tracker");

  // Descargar como .xlsx
  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `ds-tracker-orders_${date}.xlsx`);
}

// ── Main App ─────────────────────────────────────────────────────────────────

const MOCK_FALLBACK = [
  { id: 1, component: "Button",   type: "Corrección de accesibilidad", problem: "El estado :focus no muestra el outline correcto en Safari.",         need: "Accesibilidad comprometida en flujos de checkout.",               cell: "Tienda",          priority: "Alta",  requester_name: "Lucía Fernández", figma_link: "", created_at: "2025-05-20T00:00:00Z" },
  { id: 2, component: "Modal",    type: "Una evolución mayor",         problem: "El prop onClose no se dispara al presionar la tecla Escape.",        need: "Usuarios atrapados sin poder cerrar modales de confirmación.",   cell: "Postventa",       priority: "Alta",  requester_name: "Martín Gómez",    figma_link: "", created_at: "2025-05-21T00:00:00Z" },
  { id: 3, component: "Input",    type: "Ajuste visual",               problem: "El label flotante se superpone con el placeholder en Firefox.",      need: "Formularios de alta de servicios con problemas de legibilidad.", cell: "Conectividad",    priority: "Media", requester_name: "Sofía Rodríguez", figma_link: "", created_at: "2025-05-22T00:00:00Z" },
  { id: 4, component: "Card",     type: "Ajuste de properties",        problem: "El slot de footer no renderiza contenido en modo skeleton.",         need: "Las cards de contenidos premium no muestran su CTA.",           cell: "Entretenimiento", priority: "Media", requester_name: "Diego Herrera",   figma_link: "", created_at: "2025-05-23T00:00:00Z" },
  { id: 5, component: "Dropdown", type: "Ajuste visual",               problem: "El panel flotante no respeta el z-index dentro de un Modal.",       need: "Selects de filtros de planes inservibles en overlays.",         cell: "Tienda",          priority: "Baja",  requester_name: "Camila Torres",   figma_link: "", created_at: "2025-05-24T00:00:00Z" },
  { id: 6, component: "Badge",    type: "Corrección de accesibilidad", problem: "El color de texto no cumple contraste WCAG AA en variante warning.", need: "Inconsistencia en tags de estado en el módulo de reclamos.",   cell: "Postventa",       priority: "Baja",  requester_name: "Nicolás Pérez",   figma_link: "", created_at: "2025-05-25T00:00:00Z" },
];

const emptyForm = { component: "", type: "", problem: "", need: "", requester_name: "", cell: "", priority: "", figma_link: "" };

export default function App() {
  const [darkMode,         setDarkMode]         = useState(false);
  const [form,             setForm]              = useState(emptyForm);
  const [orders,           setOrders]            = useState([]);
  const [loading,          setLoading]           = useState(true);
  const [loadError,        setLoadError]         = useState(null);
  const [submitting,       setSubmitting]        = useState(false);
  const [submitStatus,     setSubmitStatus]      = useState(null); // "ok" | "error"
  const [usingFallback,    setUsingFallback]     = useState(false);
  const [exporting,        setExporting]         = useState(false);
  const [filterComponent,  setFilterComponent]   = useState("");
  const [filterCell,       setFilterCell]        = useState("");

  // ── Fetch from Supabase on mount ──
  const loadOrders = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await sbFetch();
      setOrders(data);
    } catch (e) {
      // En entornos con restricciones de red (ej: preview de Claude)
      // cargamos el mock data local como fallback
      console.warn("Supabase no disponible, usando mock data local.", e);
      setOrders(MOCK_FALLBACK);
      setUsingFallback(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  // ── Derived ──
  const isValid = form.component && form.type && form.problem.trim() &&
                  form.need.trim() && form.requester_name.trim() && form.cell && form.priority;

  const filtered = useMemo(() => orders.filter(o =>
    (!filterComponent || o.component === filterComponent) &&
    (!filterCell      || o.cell      === filterCell)
  ), [orders, filterComponent, filterCell]);

  // ── Submit ──
  async function handleSubmit() {
    if (!isValid || submitting) return;
    setSubmitting(true);
    setSubmitStatus(null);
    try {
      if (usingFallback) {
        // Modo preview: solo agrega al estado local
        const newOrder = {
          id: Date.now(),
          component:      form.component,
          type:           form.type,
          problem:        form.problem,
          need:           form.need,
          requester_name: form.requester_name,
          cell:           form.cell,
          priority:       form.priority,
          figma_link:     form.figma_link || "",
          created_at:     new Date().toISOString(),
        };
        setOrders(prev => [newOrder, ...prev]);
        setForm(emptyForm);
        setSubmitStatus("fallback");
        setTimeout(() => setSubmitStatus(null), 4000);
      } else {
        const [inserted] = await sbInsert({
          component:      form.component,
          type:           form.type,
          problem:        form.problem,
          need:           form.need,
          requester_name: form.requester_name,
          cell:           form.cell,
          priority:       form.priority,
          figma_link:     form.figma_link,
        });
        setOrders(prev => [inserted, ...prev]);
        setForm(emptyForm);
        setSubmitStatus("ok");
        setTimeout(() => setSubmitStatus(null), 3000);
      }
    } catch (e) {
      setSubmitStatus("error");
      setTimeout(() => setSubmitStatus(null), 4000);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Theme tokens ──
  const theme = {
    "--bg":           darkMode ? "#0D0F18" : "#F1F3F9",
    "--surface":      darkMode ? "#181B27" : "#FFFFFF",
    "--surface2":     darkMode ? "#1E2235" : "#F8F9FC",
    "--text":         darkMode ? "#E4E6F0" : "#111827",
    "--label":        darkMode ? "#7B7F9E" : "#6B7280",
    "--muted":        darkMode ? "#4A4E6A" : "#9CA3AF",
    "--border":       darkMode ? "#292D45" : "#E5E7EB",
    "--input-bg":     darkMode ? "#111320" : "#FFFFFF",
    "--accent":       darkMode ? "#818CF8" : "#4F46E5",
    "--accent-light": darkMode ? "#1C1F3A" : "#EEF2FF",
    "--accent-text":  darkMode ? "#A5B4FC" : "#4338CA",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text)}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px}
        table{border-collapse:collapse;width:100%}
        th{text-align:left}
        tbody tr{transition:background 0.1s}
        tbody tr:hover{background:var(--surface2)}
        .btn-submit:hover:not(:disabled){filter:brightness(1.1);transform:translateY(-1px)}
        .btn-submit:active:not(:disabled){transform:translateY(0)}
        .row-new{animation:slideIn 0.35s ease}
        @keyframes slideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      <div style={{ minHeight: "100vh", background: "var(--bg)", ...theme }}>

        {/* ── HEADER ── */}
        <header style={{
          background: "var(--surface)", borderBottom: "1px solid var(--border)",
          padding: "0 28px", height: 62,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 100,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 9, flexShrink: 0,
              background: "linear-gradient(135deg, var(--accent) 0%, #7C3AED 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, color: "#fff",
            }}>◈</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                DS Tracker Order
              </div>
              <div style={{ fontSize: 10, color: "var(--label)", letterSpacing: "0.06em", textTransform: "uppercase", lineHeight: 1.3 }}>
                Evolutivos & Bugs · NOVA DS
              </div>
              <div style={{ fontSize: 10, color: "var(--muted)", fontStyle: "italic", lineHeight: 1.3 }}>
                El ciclo de vida de nuestros componentes, bajo control
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Supabase status pill */}
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "var(--surface2)", border: "1px solid var(--border)",
              padding: "4px 12px", borderRadius: 20, fontSize: 11, color: "var(--label)",
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                background: loading ? "#F59E0B" : usingFallback ? "#F59E0B" : "#22C55E",
              }} />
              {loading ? "Cargando…" : usingFallback ? `${orders.length} registros · modo preview` : `${orders.length} registros · Supabase`}
            </div>

            {/* Export Excel */}
            <button
              onClick={async () => {
                setExporting(true);
                await exportToExcel(orders);
                setExporting(false);
              }}
              disabled={orders.length === 0 || loading || exporting}
              title="Descargar todos los pedidos como .xlsx"
              style={{
                background: orders.length > 0 && !loading && !exporting ? "#16A34A" : "var(--border)",
                color: orders.length > 0 && !loading && !exporting ? "#fff" : "var(--muted)",
                border: "none", borderRadius: 8,
                padding: "6px 14px",
                cursor: orders.length > 0 && !loading && !exporting ? "pointer" : "not-allowed",
                fontSize: 12, fontFamily: "inherit", fontWeight: 600,
                display: "flex", alignItems: "center", gap: 6,
                transition: "all 0.15s",
                boxShadow: orders.length > 0 && !loading && !exporting ? "0 2px 8px rgba(22,163,74,0.2)" : "none",
              }}
            >
              {exporting
                ? <><span style={{ display: "inline-block", animation: "spin 0.7s linear infinite" }}>↻</span> Generando…</>
                : "⬇ Exportar .xlsx"
              }
            </button>

            <button
              onClick={() => setDarkMode(d => !d)}
              style={{
                background: "var(--surface2)", border: "1px solid var(--border)",
                borderRadius: 8, padding: "6px 14px", cursor: "pointer",
                fontSize: 12, color: "var(--label)", fontFamily: "inherit", fontWeight: 500,
                display: "flex", alignItems: "center", gap: 6,
              }}
            >{darkMode ? "☀ Light" : "◑ Dark"}</button>
          </div>
        </header>

        {/* ── BODY ── */}
        <div style={{ display: "grid", gridTemplateColumns: "368px 1fr", height: "calc(100vh - 62px)" }}>

          {/* ── FORM ── */}
          <aside style={{
            background: "var(--surface)", borderRight: "1px solid var(--border)",
            overflowY: "auto", padding: "26px 22px 48px",
          }}>
            <div style={{ marginBottom: 22 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>
                Nuevo Pedido
              </span>
              <p style={{ fontSize: 12, color: "var(--label)", lineHeight: 1.6, marginTop: 4 }}>
                Registrá un evolutivo o bug de un componente del sistema de diseño.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <SelectField
                label="Componente"
                value={form.component}
                onChange={v => setForm(f => ({ ...f, component: v }))}
                options={COMPONENTS}
                placeholder="Elegí un componente…"
              />
              <SelectField
                label="Tipo de Evolutivo"
                value={form.type}
                onChange={v => setForm(f => ({ ...f, type: v }))}
                options={TYPES}
                placeholder="Tipo de evolutivo…"
              />
              <TextareaField
                label="Tipo de Problema"
                value={form.problem}
                onChange={v => setForm(f => ({ ...f, problem: v }))}
                placeholder="Describí técnicamente el comportamiento observado…"
                rows={3}
              />
              <TextareaField
                label="Necesidad o Problema"
                value={form.need}
                onChange={v => setForm(f => ({ ...f, need: v }))}
                placeholder="Contexto de negocio o experiencia de usuario afectada…"
                rows={3}
              />

              {/* Nombre y Apellido */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--label)" }}>
                  Nombre y Apellido <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.requester_name}
                  onChange={e => setForm(f => ({ ...f, requester_name: e.target.value }))}
                  placeholder="Ej: Lucía Fernández"
                  style={{
                    width: "100%", background: "var(--input-bg)",
                    border: "1.5px solid var(--border)", borderRadius: 8,
                    padding: "10px 14px", fontSize: 13, color: "var(--text)",
                    fontFamily: "inherit", outline: "none", transition: "border-color 0.15s",
                  }}
                  onFocus={e => e.target.style.borderColor = "var(--accent)"}
                  onBlur={e  => e.target.style.borderColor = "var(--border)"}
                />
              </div>

              <SelectField
                label="Célula Solicitante"
                value={form.cell}
                onChange={v => setForm(f => ({ ...f, cell: v }))}
                options={CELLS}
                placeholder="Elegí la célula…"
              />
              <PrioritySelector
                value={form.priority}
                onChange={v => setForm(f => ({ ...f, priority: v }))}
              />

              {/* Figma Link */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--label)" }}>
                  Figma Link
                  <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 500, color: "var(--muted)", textTransform: "none", letterSpacing: 0 }}>(opcional)</span>
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{
                    position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                    fontSize: 14, pointerEvents: "none", opacity: 0.5,
                  }}>🔗</span>
                  <input
                    type="url"
                    value={form.figma_link}
                    onChange={e => setForm(f => ({ ...f, figma_link: e.target.value }))}
                    placeholder="https://figma.com/design/…"
                    style={{
                      width: "100%", background: "var(--input-bg)",
                      border: "1.5px solid var(--border)", borderRadius: 8,
                      padding: "10px 14px 10px 34px", fontSize: 13, color: "var(--text)",
                      fontFamily: "inherit", outline: "none", transition: "border-color 0.15s",
                    }}
                    onFocus={e => e.target.style.borderColor = "var(--accent)"}
                    onBlur={e  => e.target.style.borderColor = "var(--border)"}
                  />
                </div>
              </div>

              <div style={{ height: 1, background: "var(--border)", marginTop: 4 }} />

              <button
                className="btn-submit"
                onClick={handleSubmit}
                disabled={!isValid || submitting}
                style={{
                  width: "100%", padding: "13px 0", transition: "all 0.2s",
                  background: isValid && !submitting
                    ? "linear-gradient(135deg, var(--accent) 0%, #7C3AED 100%)"
                    : "var(--border)",
                  color: isValid && !submitting ? "#FFFFFF" : "var(--muted)",
                  border: "none", borderRadius: 10,
                  cursor: isValid && !submitting ? "pointer" : "not-allowed",
                  fontSize: 14, fontWeight: 700, fontFamily: "inherit",
                  letterSpacing: "0.01em",
                  boxShadow: isValid && !submitting ? "0 4px 16px rgba(79,70,229,0.28)" : "none",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                {submitting && (
                  <span style={{
                    width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)",
                    borderTopColor: "#fff", borderRadius: "50%",
                    display: "inline-block", animation: "spin 0.7s linear infinite",
                  }} />
                )}
                {submitting ? "Guardando…" : "Enviar Pedido →"}
              </button>

              {submitStatus === "ok" && (
                <div style={{
                  background: "#F0FDF4", border: "1px solid #BBF7D0",
                  borderRadius: 8, padding: "10px 14px",
                  fontSize: 12, color: "#15803D", fontWeight: 500, textAlign: "center",
                }}>
                  ✓ Pedido guardado en Supabase correctamente.
                </div>
              )}
              {submitStatus === "fallback" && (
                <div style={{
                  background: "#FFFBEB", border: "1px solid #FDE68A",
                  borderRadius: 8, padding: "10px 14px",
                  fontSize: 12, color: "#92400E", fontWeight: 500, textAlign: "center",
                }}>
                  ⚡ Pedido agregado en modo preview. En producción se guardará en Supabase.
                </div>
              )}
              {submitStatus === "error" && (
                <div style={{
                  background: "#FEF2F2", border: "1px solid #FECACA",
                  borderRadius: 8, padding: "10px 14px",
                  fontSize: 12, color: "#DC2626", fontWeight: 500, textAlign: "center",
                }}>
                  ✕ Error al guardar. Revisá la conexión e intentá de nuevo.
                </div>
              )}

              <p style={{ fontSize: 11, color: "var(--muted)", textAlign: "center" }}>
                <span style={{ color: "#EF4444" }}>*</span> Todos los campos son obligatorios
              </p>
            </div>
          </aside>

          {/* ── DASHBOARD ── */}
          <main style={{ overflowY: "auto", padding: "26px 28px 48px" }}>

            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
              {[
                { label: "Total pedidos",       value: orders.length,                                                       icon: "◈", color: "var(--accent)",  bg: "var(--accent-light)" },
                { label: "Prioridad Alta",       value: orders.filter(o => o.priority === "Alta").length,                    icon: "●", color: "#EF4444",        bg: "#FEF2F2" },
                { label: "Evoluciones mayores",  value: orders.filter(o => o.type === "Una evolución mayor").length,         icon: "⬢", color: "#7E22CE",        bg: "#FAF5FF" },
                { label: "Accesibilidad",        value: orders.filter(o => o.type === "Corrección de accesibilidad").length, icon: "◎", color: "#15803D",        bg: "#F0FDF4" },
              ].map(s => (
                <div key={s.label} style={{
                  background: "var(--surface)", border: "1px solid var(--border)",
                  borderRadius: 12, padding: "16px 18px",
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, background: s.bg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, color: s.color, flexShrink: 0,
                  }}>{s.icon}</div>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", fontFamily: "DM Mono, monospace", lineHeight: 1.1 }}>
                      {loading ? "…" : s.value}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--label)", letterSpacing: "0.03em", lineHeight: 1.3 }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Filters bar */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 14, flexWrap: "wrap", gap: 10,
            }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em" }}>
                  Dashboard de Pedidos
                </h2>
                <p style={{ fontSize: 12, color: "var(--label)", marginTop: 1 }}>
                  Mostrando {filtered.length} de {orders.length} registros
                  {(filterComponent || filterCell) && (
                    <span style={{ color: "var(--accent)", marginLeft: 6 }}>· Filtros activos</span>
                  )}
                </p>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                {[
                  { label: "Componente", val: filterComponent, set: setFilterComponent, opts: COMPONENTS },
                  { label: "Célula",     val: filterCell,      set: setFilterCell,      opts: CELLS },
                ].map(f => (
                  <div key={f.label} style={{ position: "relative" }}>
                    <select
                      value={f.val}
                      onChange={e => f.set(e.target.value)}
                      style={{
                        appearance: "none", WebkitAppearance: "none",
                        background: "var(--surface)",
                        border: `1.5px solid ${f.val ? "var(--accent)" : "var(--border)"}`,
                        borderRadius: 8, padding: "7px 30px 7px 12px",
                        fontSize: 13, color: f.val ? "var(--text)" : "var(--label)",
                        fontFamily: "inherit", cursor: "pointer", minWidth: 155,
                        fontWeight: f.val ? 600 : 400, outline: "none",
                        transition: "border-color 0.15s",
                      }}
                    >
                      <option value="">{f.label}: Todos</option>
                      {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <span style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--muted)", fontSize: 10 }}>▾</span>
                  </div>
                ))}
                {(filterComponent || filterCell) && (
                  <button
                    onClick={() => { setFilterComponent(""); setFilterCell(""); }}
                    style={{
                      background: "transparent", border: "1.5px solid var(--border)",
                      borderRadius: 8, padding: "6px 12px", cursor: "pointer",
                      fontSize: 12, color: "var(--label)", fontFamily: "inherit",
                    }}
                  >✕ Limpiar</button>
                )}
                <button
                  onClick={loadOrders}
                  disabled={loading}
                  title="Refrescar datos"
                  style={{
                    background: "var(--surface2)", border: "1.5px solid var(--border)",
                    borderRadius: 8, padding: "6px 12px", cursor: loading ? "not-allowed" : "pointer",
                    fontSize: 13, color: "var(--label)", fontFamily: "inherit",
                    display: "flex", alignItems: "center", gap: 4,
                    opacity: loading ? 0.5 : 1,
                  }}
                >
                  <span style={loading ? { display: "inline-block", animation: "spin 0.8s linear infinite" } : {}}>↻</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div style={{
              background: "var(--surface)", borderRadius: 12,
              border: "1px solid var(--border)", overflow: "hidden",
            }}>
              {loading ? (
                <div style={{ padding: "52px 16px", textAlign: "center" }}>
                  <div style={{ fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <span style={{ display: "inline-block", animation: "spin 0.8s linear infinite", fontSize: 16 }}>↻</span>
                    Cargando pedidos desde Supabase…
                  </div>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr style={{ background: "var(--surface2)", borderBottom: "1px solid var(--border)" }}>
                      {["ID", "Componente", "Tipo", "Descripción", "Solicitante", "Célula", "Prioridad", "Figma", "Fecha"].map(h => (
                        <th key={h} style={{
                          padding: "10px 14px", fontSize: 10, fontWeight: 700,
                          color: "var(--label)", letterSpacing: "0.08em", textTransform: "uppercase",
                          fontFamily: "DM Mono, monospace", whiteSpace: "nowrap",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: "52px 16px", textAlign: "center" }}>
                          <div style={{ fontSize: 28, marginBottom: 10 }}>◎</div>
                          <div style={{ fontSize: 14, color: "var(--muted)", fontWeight: 500 }}>
                            No hay pedidos que coincidan con los filtros.
                          </div>
                          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                            Probá limpiando los filtros aplicados.
                          </div>
                        </td>
                      </tr>
                    ) : filtered.map((o, i) => (
                      <tr key={o.id}
                        style={{ borderBottom: "1px solid var(--border)" }}
                        className={i === 0 && !loading ? "row-new" : ""}
                      >
                        <td style={{ padding: "13px 14px" }}>
                          <span style={{ fontSize: 11, fontFamily: "DM Mono, monospace", color: "var(--muted)", fontWeight: 500 }}>
                            #{String(o.id).padStart(3, "0")}
                          </span>
                        </td>
                        <td style={{ padding: "13px 14px" }}>
                          <span style={{
                            background: "var(--accent-light)", color: "var(--accent-text)",
                            padding: "4px 10px", borderRadius: 6,
                            fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
                          }}>{o.component}</span>
                        </td>
                        <td style={{ padding: "13px 14px" }}>
                          <TypeBadge value={o.type} />
                        </td>
                        <td style={{ padding: "13px 14px", maxWidth: 260 }}>
                          <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.5, marginBottom: 3 }}>
                            {o.problem.length > 68 ? o.problem.slice(0, 68) + "…" : o.problem}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--label)", lineHeight: 1.4 }}>
                            {o.need.length > 56 ? o.need.slice(0, 56) + "…" : o.need}
                          </div>
                        </td>
                        <td style={{ padding: "13px 14px" }}>
                          <span style={{ fontSize: 13, color: "var(--text)", whiteSpace: "nowrap" }}>
                            {o.requester_name || "—"}
                          </span>
                        </td>
                        <td style={{ padding: "13px 14px" }}>
                          <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 500, whiteSpace: "nowrap" }}>{o.cell}</span>
                        </td>
                        <td style={{ padding: "13px 14px" }}>
                          <PriorityBadge value={o.priority} />
                        </td>
                        <td style={{ padding: "13px 14px" }}>
                          {o.figma_link ? (
                            <a
                              href={o.figma_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "inline-flex", alignItems: "center", gap: 5,
                                background: "#F5F0FF", color: "#7C3AED",
                                padding: "4px 10px", borderRadius: 6,
                                fontSize: 11, fontWeight: 600, textDecoration: "none",
                                whiteSpace: "nowrap", transition: "opacity 0.15s",
                              }}
                              onMouseEnter={e => e.currentTarget.style.opacity = "0.75"}
                              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                            >
                              ✦ Ver diseño
                            </a>
                          ) : (
                            <span style={{ fontSize: 12, color: "var(--muted)" }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: "13px 14px" }}>
                          <span style={{ fontSize: 11, fontFamily: "DM Mono, monospace", color: "var(--muted)", whiteSpace: "nowrap" }}>
                            {o.created_at ? o.created_at.slice(0, 10) : "—"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
