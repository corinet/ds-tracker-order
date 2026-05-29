import { useState, useMemo, useEffect, useCallback } from "react";

// ── Supabase config ──────────────────────────────────────────────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://odtpipzrxuryywmtvjpm.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kdHBpcHpyeHVyeXl3bXR2anBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNjM1NzQsImV4cCI6MjA5NTYzOTU3NH0.YiJcTywws5lOjM4WAHPmDaN-d-loT_nqsioJEqf41i4";
const TABLE = "ds_tracker_orders";

const sbHeaders = {
  "Content-Type": "application/json",
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Prefer": "return=representation",
};

async function sbFetch() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?select=*&order=created_at.desc`, { headers: sbHeaders });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function sbInsert(row) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, { method: "POST", headers: sbHeaders, body: JSON.stringify(row) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function sbDelete(id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?id=eq.${id}`, { method: "DELETE", headers: sbHeaders });
  if (!res.ok) throw new Error(await res.text());
}

// ── Constants ────────────────────────────────────────────────────────────────
const COMPONENTS = ["Button", "Input", "Modal", "Card", "Dropdown", "Badge", "Tooltip", "Tabs", "Avatar", "Checkbox"];
const CELLS      = ["Tienda", "Postventa", "Conectividad", "Entretenimiento"];
const PRIORITIES = [
  { label: "Alta",  value: "Alta",  color: "#EF4444", bg: "#FEF2F2", dot: "#EF4444" },
  { label: "Media", value: "Media", color: "#D97706", bg: "#FFFBEB", dot: "#F59E0B" },
  { label: "Baja",  value: "Baja",  color: "#6B7280", bg: "#F9FAFB", dot: "#9CA3AF" },
];
const TYPES = ["Ajuste visual","Corrección de accesibilidad","Ajuste de properties","Una evolución mayor"];
const TYPE_STYLES = {
  "Ajuste visual":               { bg: "#FFF7ED", color: "#C2410C", icon: "⬡" },
  "Corrección de accesibilidad": { bg: "#F0FDF4", color: "#15803D", icon: "◎" },
  "Ajuste de properties":        { bg: "#EFF6FF", color: "#1D4ED8", icon: "◈" },
  "Una evolución mayor":         { bg: "#FAF5FF", color: "#7E22CE", icon: "⬢" },
};
const MOCK_FALLBACK = [
  { id: 1, component: "Button",   type: "Corrección de accesibilidad", problem: "El estado :focus no muestra el outline correcto en Safari.",         need: "Accesibilidad comprometida en flujos de checkout.",               cell: "Tienda",          priority: "Alta",  requester_name: "Lucía Fernández", figma_link: "", created_at: "2025-05-20T00:00:00Z" },
  { id: 2, component: "Modal",    type: "Una evolución mayor",         problem: "El prop onClose no se dispara al presionar la tecla Escape.",        need: "Usuarios atrapados sin poder cerrar modales de confirmación.",   cell: "Postventa",       priority: "Alta",  requester_name: "Martín Gómez",    figma_link: "", created_at: "2025-05-21T00:00:00Z" },
  { id: 3, component: "Input",    type: "Ajuste visual",               problem: "El label flotante se superpone con el placeholder en Firefox.",      need: "Formularios de alta de servicios con problemas de legibilidad.", cell: "Conectividad",    priority: "Media", requester_name: "Sofía Rodríguez", figma_link: "", created_at: "2025-05-22T00:00:00Z" },
  { id: 4, component: "Card",     type: "Ajuste de properties",        problem: "El slot de footer no renderiza contenido en modo skeleton.",         need: "Las cards de contenidos premium no muestran su CTA.",           cell: "Entretenimiento", priority: "Media", requester_name: "Diego Herrera",   figma_link: "", created_at: "2025-05-23T00:00:00Z" },
  { id: 5, component: "Dropdown", type: "Ajuste visual",               problem: "El panel flotante no respeta el z-index dentro de un Modal.",       need: "Selects de filtros de planes inservibles en overlays.",         cell: "Tienda",          priority: "Baja",  requester_name: "Camila Torres",   figma_link: "", created_at: "2025-05-24T00:00:00Z" },
  { id: 6, component: "Badge",    type: "Corrección de accesibilidad", problem: "El color de texto no cumple contraste WCAG AA en variante warning.", need: "Inconsistencia en tags de estado en el módulo de reclamos.",   cell: "Postventa",       priority: "Baja",  requester_name: "Nicolás Pérez",   figma_link: "", created_at: "2025-05-25T00:00:00Z" },
];
const emptyForm = { component: "", type: "", problem: "", need: "", requester_name: "", cell: "", priority: "", figma_link: "" };

// ── Export xlsx ───────────────────────────────────────────────────────────────
async function exportToExcel(orders) {
  if (!window.XLSX) {
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
      s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  const XLSX = window.XLSX;
  const COLS = [
    { key: "id",             label: "ID" },
    { key: "component",      label: "Componente" },
    { key: "type",           label: "Tipo de Evolutivo" },
    { key: "problem",        label: "Tipo de Problema" },
    { key: "need",           label: "Necesidad o Problema" },
    { key: "requester_name", label: "Nombre y Apellido" },
    { key: "cell",           label: "Célula Solicitante" },
    { key: "priority",       label: "Prioridad" },
    { key: "figma_link",     label: "Figma Link" },
    { key: "created_at",     label: "Fecha" },
  ];
  const data = orders.map(o => {
    const row = {};
    COLS.forEach(c => { row[c.label] = c.key === "created_at" ? (o.created_at ? o.created_at.slice(0,10) : "") : (o[c.key] ?? ""); });
    return row;
  });
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data, { header: COLS.map(c => c.label) });
  ws["!cols"] = [{ wch:6 },{ wch:14 },{ wch:26 },{ wch:48 },{ wch:48 },{ wch:22 },{ wch:20 },{ wch:10 },{ wch:40 },{ wch:12 }];
  XLSX.utils.book_append_sheet(wb, ws, "Pedidos DS Tracker");
  XLSX.writeFile(wb, `ds-tracker-orders_${new Date().toISOString().slice(0,10)}.xlsx`);
}

// ── Sub-components ────────────────────────────────────────────────────────────
function PriorityBadge({ value }) {
  const p = PRIORITIES.find(x => x.value === value);
  if (!p) return null;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px", borderRadius:20, background:p.bg, color:p.color, fontSize:11, fontWeight:700, letterSpacing:"0.04em", fontFamily:"DM Mono, monospace", whiteSpace:"nowrap" }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:p.dot, display:"inline-block", flexShrink:0 }} />{p.label}
    </span>
  );
}
function TypeBadge({ value }) {
  const s = TYPE_STYLES[value] || { bg:"#F3F4F6", color:"#6B7280", icon:"○" };
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 10px", borderRadius:4, background:s.bg, color:s.color, fontSize:11, fontWeight:600, letterSpacing:"0.03em", whiteSpace:"nowrap" }}>
      {s.icon} {value}
    </span>
  );
}
function SelectField({ label, value, onChange, options, placeholder, required=true }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      <label style={{ fontSize:11, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:"var(--label)" }}>
        {label}{required && <span style={{ color:"#EF4444", marginLeft:3 }}>*</span>}
      </label>
      <div style={{ position:"relative" }}>
        <select value={value} onChange={e => onChange(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ width:"100%", appearance:"none", WebkitAppearance:"none", background:"var(--input-bg)", border:`1.5px solid ${focused?"var(--accent)":"var(--border)"}`, borderRadius:8, padding:"10px 36px 10px 14px", fontSize:13, color:value?"var(--text)":"var(--muted)", fontFamily:"inherit", cursor:"pointer", outline:"none", transition:"border-color 0.15s" }}>
          <option value="" disabled>{placeholder||"Seleccionar…"}</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <span style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:"var(--muted)", fontSize:11 }}>▾</span>
      </div>
    </div>
  );
}
function TextareaField({ label, value, onChange, placeholder, rows=3 }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      <label style={{ fontSize:11, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:"var(--label)" }}>
        {label} <span style={{ color:"#EF4444" }}>*</span>
      </label>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width:"100%", boxSizing:"border-box", background:"var(--input-bg)", border:`1.5px solid ${focused?"var(--accent)":"var(--border)"}`, borderRadius:8, padding:"10px 14px", fontSize:13, color:"var(--text)", fontFamily:"inherit", resize:"vertical", outline:"none", lineHeight:1.6, transition:"border-color 0.15s" }} />
    </div>
  );
}
function PrioritySelector({ value, onChange }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      <label style={{ fontSize:11, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:"var(--label)" }}>
        Prioridad <span style={{ color:"#EF4444" }}>*</span>
      </label>
      <div style={{ display:"flex", gap:8 }}>
        {PRIORITIES.map(p => (
          <button key={p.value} type="button" onClick={() => onChange(p.value)}
            style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"9px 0", borderRadius:8, cursor:"pointer", fontFamily:"inherit", fontSize:13, fontWeight:600, transition:"all 0.15s", border:value===p.value?`2px solid ${p.color}`:"1.5px solid var(--border)", background:value===p.value?p.bg:"var(--input-bg)", color:value===p.value?p.color:"var(--muted)" }}>
            <span style={{ width:8, height:8, borderRadius:"50%", background:p.dot, flexShrink:0 }} />{p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Delete Confirmation Modal ─────────────────────────────────────────────────
function DeleteModal({ order, onConfirm, onCancel, deleting }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      {/* Overlay */}
      <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.5)", backdropFilter:"blur(4px)" }} />
      {/* Modal — fondo blanco en light, gris oscuro en dark */}
      <div style={{ position:"relative", background:"var(--modal-bg)", borderRadius:16, padding:"32px 28px", width:"100%", maxWidth:440, boxShadow:"0 24px 60px rgba(0,0,0,0.3)", border:"1px solid var(--border)", animation:"modalIn 0.2s ease" }}>
        {/* Cruz de cierre */}
        <button onClick={onCancel} disabled={deleting}
          style={{ position:"absolute", top:14, right:14, background:"transparent", border:"none", cursor:"pointer", fontSize:18, color:"var(--muted)", lineHeight:1, padding:"4px 6px", borderRadius:6, transition:"all 0.15s" }}
          onMouseEnter={e=>{e.currentTarget.style.background="var(--surface2)";e.currentTarget.style.color="var(--text)";}}
          onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="var(--muted)";}}>
          ✕
        </button>
        {/* Icon */}
        <div style={{ width:52, height:52, borderRadius:14, background:"#FEF2F2", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, margin:"0 auto 20px" }}>
          🗑️
        </div>
        <h3 style={{ fontSize:17, fontWeight:700, color:"var(--text)", textAlign:"center", marginBottom:8, letterSpacing:"-0.02em" }}>
          Eliminar pedido
        </h3>
        <p style={{ fontSize:13, color:"var(--label)", textAlign:"center", lineHeight:1.6, marginBottom:6 }}>
          ¿Estás seguro que querés eliminar este pedido?
        </p>
        {/* Order summary */}
        <div style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:10, padding:"12px 16px", margin:"16px 0 24px", textAlign:"left" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
            <span style={{ background:"var(--accent-light)", color:"var(--accent-text)", padding:"3px 10px", borderRadius:6, fontSize:12, fontWeight:600 }}>{order.component}</span>
            <PriorityBadge value={order.priority} />
          </div>
          <div style={{ fontSize:12, color:"var(--text)", lineHeight:1.5, marginBottom:4 }}>
            {order.problem.length > 80 ? order.problem.slice(0,80)+"…" : order.problem}
          </div>
          <div style={{ fontSize:11, color:"var(--muted)" }}>
            {order.requester_name} · {order.cell} · {order.created_at ? order.created_at.slice(0,10) : "—"}
          </div>
        </div>
        <p style={{ fontSize:12, color:"#EF4444", textAlign:"center", marginBottom:24, fontWeight:500 }}>
          Esta acción no se puede deshacer.
        </p>
        {/* Actions */}
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onCancel} disabled={deleting}
            style={{ flex:1, padding:"11px 0", background:"var(--surface2)", border:"1.5px solid var(--border)", borderRadius:10, cursor:"pointer", fontSize:14, fontWeight:600, color:"var(--label)", fontFamily:"inherit", transition:"all 0.15s" }}>
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={deleting}
            style={{ flex:1, padding:"11px 0", background:deleting?"var(--border)":"#EF4444", border:"none", borderRadius:10, cursor:deleting?"not-allowed":"pointer", fontSize:14, fontWeight:700, color:deleting?"var(--muted)":"#fff", fontFamily:"inherit", transition:"all 0.15s", display:"flex", alignItems:"center", justifyContent:"center", gap:6, boxShadow:deleting?"none":"0 4px 14px rgba(239,68,68,0.3)" }}>
            {deleting
              ? <><span style={{ display:"inline-block", animation:"spin 0.7s linear infinite" }}>↻</span> Eliminando…</>
              : "Sí, eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Mobile Order Card ─────────────────────────────────────────────────────────
function OrderCard({ order, onDelete }) {
  return (
    <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"16px", display:"flex", flexDirection:"column", gap:10 }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          <span style={{ background:"var(--accent-light)", color:"var(--accent-text)", padding:"4px 10px", borderRadius:6, fontSize:12, fontWeight:600 }}>{order.component}</span>
          <PriorityBadge value={order.priority} />
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
          <span style={{ fontSize:11, fontFamily:"DM Mono, monospace", color:"var(--muted)" }}>
            #{String(order.id).padStart(3,"0")}
          </span>
          <button onClick={() => onDelete(order)}
            style={{ background:"transparent", border:"none", padding:"4px 6px", cursor:"pointer", fontSize:15, color:"var(--muted)", lineHeight:1 }}
            title="Eliminar pedido">
            🗑
          </button>
        </div>
      </div>
      <TypeBadge value={order.type} />
      <div>
        <div style={{ fontSize:12, color:"var(--text)", lineHeight:1.5, marginBottom:3 }}>{order.problem}</div>
        <div style={{ fontSize:11, color:"var(--label)", lineHeight:1.4 }}>{order.need}</div>
      </div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:"6px 16px", paddingTop:6, borderTop:"1px solid var(--border)" }}>
        <span style={{ fontSize:11, color:"var(--label)" }}>👤 {order.requester_name || "—"}</span>
        <span style={{ fontSize:11, color:"var(--label)" }}>🏢 {order.cell}</span>
        <span style={{ fontSize:11, color:"var(--muted)", fontFamily:"DM Mono, monospace" }}>{order.created_at ? order.created_at.slice(0,10) : "—"}</span>
      </div>
      {order.figma_link && (
        <a href={order.figma_link} target="_blank" rel="noopener noreferrer"
          style={{ display:"inline-flex", alignItems:"center", gap:5, background:"#F5F0FF", color:"#7C3AED", padding:"5px 12px", borderRadius:6, fontSize:11, fontWeight:600, textDecoration:"none", alignSelf:"flex-start" }}>
          ✦ Ver diseño en Figma
        </a>
      )}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [darkMode,        setDarkMode]        = useState(false);
  const [form,            setForm]            = useState(emptyForm);
  const [orders,          setOrders]          = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [submitting,      setSubmitting]      = useState(false);
  const [submitStatus,    setSubmitStatus]    = useState(null);
  const [usingFallback,   setUsingFallback]   = useState(false);
  const [exporting,       setExporting]       = useState(false);
  const [filterComponent, setFilterComponent] = useState("");
  const [filterCell,      setFilterCell]      = useState("");
  const [deleteTarget,    setDeleteTarget]    = useState(null); // order to delete
  const [deleting,        setDeleting]        = useState(false);
  const [mobileTab,       setMobileTab]       = useState("form"); // "form" | "dashboard"
  const [isMobile,        setIsMobile]        = useState(window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await sbFetch();
      setOrders(data);
    } catch (e) {
      console.warn("Supabase no disponible, usando mock data local.", e);
      setOrders(MOCK_FALLBACK);
      setUsingFallback(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const isValid = form.component && form.type && form.problem.trim() && form.need.trim() && form.requester_name.trim() && form.cell && form.priority;

  const filtered = useMemo(() => orders.filter(o =>
    (!filterComponent || o.component === filterComponent) &&
    (!filterCell      || o.cell      === filterCell)
  ), [orders, filterComponent, filterCell]);

  async function handleSubmit() {
    if (!isValid || submitting) return;
    setSubmitting(true); setSubmitStatus(null);
    try {
      if (usingFallback) {
        const newOrder = { id: Date.now(), ...form, figma_link: form.figma_link||"", created_at: new Date().toISOString() };
        setOrders(prev => [newOrder, ...prev]);
        setForm(emptyForm); setSubmitStatus("fallback");
        if (isMobile) setMobileTab("dashboard");
      } else {
        const [inserted] = await sbInsert({ component:form.component, type:form.type, problem:form.problem, need:form.need, requester_name:form.requester_name, cell:form.cell, priority:form.priority, figma_link:form.figma_link });
        setOrders(prev => [inserted, ...prev]);
        setForm(emptyForm); setSubmitStatus("ok");
        if (isMobile) setMobileTab("dashboard");
      }
    } catch { setSubmitStatus("error"); }
    finally { setSubmitting(false); setTimeout(() => setSubmitStatus(null), 3500); }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      if (!usingFallback) await sbDelete(deleteTarget.id);
      setOrders(prev => prev.filter(o => o.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch { alert("Error al eliminar. Intentá de nuevo."); }
    finally { setDeleting(false); }
  }

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
    "--modal-bg":     darkMode ? "#1E2235" : "#FFFFFF",
  };

  // ── Form panel ──
  const FormPanel = (
    <aside style={{ background:"var(--surface)", ...(isMobile ? {} : { borderRight:"1px solid var(--border)" }), overflowY:"auto", padding: isMobile ? "20px 16px 80px" : "26px 22px 48px" }}>
      <div style={{ marginBottom:22 }}>
        <span style={{ fontSize:16, fontWeight:700, color:"var(--text)", letterSpacing:"-0.02em" }}>Nuevo Pedido</span>
        <p style={{ fontSize:12, color:"var(--label)", lineHeight:1.6, marginTop:4 }}>Registrá un evolutivo o bug de un componente del sistema de diseño.</p>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
        <SelectField label="Componente" value={form.component} onChange={v => setForm(f=>({...f,component:v}))} options={COMPONENTS} placeholder="Elegí un componente…" />
        <SelectField label="Tipo de Evolutivo" value={form.type} onChange={v => setForm(f=>({...f,type:v}))} options={TYPES} placeholder="Tipo de evolutivo…" />
        <TextareaField label="Tipo de Problema" value={form.problem} onChange={v => setForm(f=>({...f,problem:v}))} placeholder="Describí técnicamente el comportamiento observado…" rows={3} />
        <TextareaField label="Necesidad" value={form.need} onChange={v => setForm(f=>({...f,need:v}))} placeholder="Contexto de negocio o experiencia de usuario afectada…" rows={3} />
        {/* Nombre y Apellido */}
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          <label style={{ fontSize:11, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:"var(--label)" }}>
            Nombre y Apellido <span style={{ color:"#EF4444" }}>*</span>
          </label>
          <input type="text" value={form.requester_name} onChange={e => setForm(f=>({...f,requester_name:e.target.value}))} placeholder="Ej: Lucía Fernández"
            style={{ width:"100%", background:"var(--input-bg)", border:"1.5px solid var(--border)", borderRadius:8, padding:"10px 14px", fontSize:13, color:"var(--text)", fontFamily:"inherit", outline:"none", transition:"border-color 0.15s", boxSizing:"border-box" }}
            onFocus={e=>e.target.style.borderColor="var(--accent)"} onBlur={e=>e.target.style.borderColor="var(--border)"} />
        </div>
        <SelectField label="Célula Solicitante" value={form.cell} onChange={v => setForm(f=>({...f,cell:v}))} options={CELLS} placeholder="Elegí la célula…" />
        <PrioritySelector value={form.priority} onChange={v => setForm(f=>({...f,priority:v}))} />
        {/* Figma Link */}
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          <label style={{ fontSize:11, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:"var(--label)" }}>
            Figma Link <span style={{ marginLeft:6, fontSize:10, fontWeight:500, color:"var(--muted)", textTransform:"none", letterSpacing:0 }}>(opcional)</span>
          </label>
          <div style={{ position:"relative" }}>
            <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:14, pointerEvents:"none", opacity:0.5 }}>🔗</span>
            <input type="url" value={form.figma_link} onChange={e => setForm(f=>({...f,figma_link:e.target.value}))} placeholder="https://figma.com/design/…"
              style={{ width:"100%", background:"var(--input-bg)", border:"1.5px solid var(--border)", borderRadius:8, padding:"10px 14px 10px 34px", fontSize:13, color:"var(--text)", fontFamily:"inherit", outline:"none", transition:"border-color 0.15s", boxSizing:"border-box" }}
              onFocus={e=>e.target.style.borderColor="var(--accent)"} onBlur={e=>e.target.style.borderColor="var(--border)"} />
          </div>
        </div>
        <div style={{ height:1, background:"var(--border)", marginTop:4 }} />
        <button className="btn-submit" onClick={handleSubmit} disabled={!isValid||submitting}
          style={{ width:"100%", padding:"13px 0", transition:"all 0.2s", background:isValid&&!submitting?"linear-gradient(135deg, var(--accent) 0%, #7C3AED 100%)":"var(--border)", color:isValid&&!submitting?"#fff":"var(--muted)", border:"none", borderRadius:10, cursor:isValid&&!submitting?"pointer":"not-allowed", fontSize:14, fontWeight:700, fontFamily:"inherit", letterSpacing:"0.01em", boxShadow:isValid&&!submitting?"0 4px 16px rgba(79,70,229,0.28)":"none", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          {submitting && <span style={{ width:14, height:14, border:"2px solid rgba(255,255,255,0.4)", borderTopColor:"#fff", borderRadius:"50%", display:"inline-block", animation:"spin 0.7s linear infinite" }} />}
          {submitting ? "Guardando…" : "Enviar Pedido →"}
        </button>
        {submitStatus==="ok"      && <div style={{ background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:8, padding:"10px 14px", fontSize:12, color:"#15803D", fontWeight:500, textAlign:"center" }}>✓ Pedido guardado en Supabase correctamente.</div>}
        {submitStatus==="fallback" && <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:8, padding:"10px 14px", fontSize:12, color:"#92400E", fontWeight:500, textAlign:"center" }}>⚡ Pedido agregado en modo preview.</div>}
        {submitStatus==="error"   && <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"10px 14px", fontSize:12, color:"#DC2626", fontWeight:500, textAlign:"center" }}>✕ Error al guardar. Revisá la conexión.</div>}
        <p style={{ fontSize:11, color:"var(--muted)", textAlign:"center" }}><span style={{ color:"#EF4444" }}>*</span> Todos los campos son obligatorios</p>
      </div>
    </aside>
  );

  // ── Dashboard panel ──
  const DashboardPanel = (
    <main style={{ overflowY:"auto", padding: isMobile ? "20px 16px 80px" : "26px 28px 48px" }}>
      {/* Stat cards */}
      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap:12, marginBottom:24 }}>
        {[
          { label:"Total pedidos",      value:orders.length,                                                        icon:"◈", color:"var(--accent)",  bg:"var(--accent-light)" },
          { label:"Prioridad Alta",      value:orders.filter(o=>o.priority==="Alta").length,                         icon:"●", color:"#EF4444",        bg:"#FEF2F2" },
          { label:"Evoluciones mayores", value:orders.filter(o=>o.type==="Una evolución mayor").length,              icon:"⬢", color:"#7E22CE",        bg:"#FAF5FF" },
          { label:"Accesibilidad",       value:orders.filter(o=>o.type==="Corrección de accesibilidad").length,      icon:"◎", color:"#15803D",        bg:"#F0FDF4" },
        ].map(s => (
          <div key={s.label} style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"14px 16px", display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:8, background:s.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, color:s.color, flexShrink:0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize:20, fontWeight:700, color:"var(--text)", fontFamily:"DM Mono, monospace", lineHeight:1.1 }}>{loading?"…":s.value}</div>
              <div style={{ fontSize:10, color:"var(--label)", letterSpacing:"0.03em", lineHeight:1.3 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:"flex", alignItems: isMobile?"flex-start":"center", justifyContent:"space-between", marginBottom:14, flexDirection: isMobile?"column":"row", gap:12 }}>
        <div>
          <h2 style={{ fontSize:15, fontWeight:700, color:"var(--text)", letterSpacing:"-0.01em" }}>Dashboard de Pedidos</h2>
          <p style={{ fontSize:12, color:"var(--label)", marginTop:1 }}>
            Mostrando {filtered.length} de {orders.length} registros
            {(filterComponent||filterCell) && <span style={{ color:"var(--accent)", marginLeft:6 }}>· Filtros activos</span>}
          </p>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
          {[
            { label:"Componente", val:filterComponent, set:setFilterComponent, opts:COMPONENTS },
            { label:"Célula",     val:filterCell,      set:setFilterCell,      opts:CELLS },
          ].map(f => (
            <div key={f.label} style={{ position:"relative" }}>
              <select value={f.val} onChange={e=>f.set(e.target.value)}
                style={{ appearance:"none", WebkitAppearance:"none", background:"var(--surface)", border:`1.5px solid ${f.val?"var(--accent)":"var(--border)"}`, borderRadius:8, padding:"7px 28px 7px 12px", fontSize:13, color:f.val?"var(--text)":"var(--label)", fontFamily:"inherit", cursor:"pointer", minWidth: isMobile?120:155, fontWeight:f.val?600:400, outline:"none" }}>
                <option value="">{f.label}: Todos</option>
                {f.opts.map(o=><option key={o} value={o}>{o}</option>)}
              </select>
              <span style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:"var(--muted)", fontSize:10 }}>▾</span>
            </div>
          ))}
          {(filterComponent||filterCell) && (
            <button onClick={()=>{setFilterComponent("");setFilterCell("");}} style={{ background:"transparent", border:"1.5px solid var(--border)", borderRadius:8, padding:"6px 10px", cursor:"pointer", fontSize:12, color:"var(--label)", fontFamily:"inherit" }}>✕</button>
          )}
          <button onClick={loadOrders} disabled={loading} title="Refrescar"
            style={{ background:"var(--surface2)", border:"1.5px solid var(--border)", borderRadius:8, padding:"6px 10px", cursor:loading?"not-allowed":"pointer", fontSize:13, color:"var(--label)", fontFamily:"inherit", opacity:loading?0.5:1 }}>
            <span style={loading?{display:"inline-block",animation:"spin 0.8s linear infinite"}:{}}> ↻</span>
          </button>
        </div>
      </div>

      {/* Mobile: cards | Desktop: table */}
      {isMobile ? (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {loading ? (
            <div style={{ textAlign:"center", padding:"40px 0", color:"var(--muted)", fontSize:13 }}>
              <span style={{ display:"inline-block", animation:"spin 0.8s linear infinite", marginRight:8 }}>↻</span>Cargando pedidos…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:"center", padding:"40px 0" }}>
              <div style={{ fontSize:28, marginBottom:8 }}>◎</div>
              <div style={{ fontSize:14, color:"var(--muted)", fontWeight:500 }}>No hay pedidos que coincidan.</div>
            </div>
          ) : filtered.map(o => <OrderCard key={o.id} order={o} onDelete={setDeleteTarget} />)}
        </div>
      ) : (
        <div style={{ background:"var(--surface)", borderRadius:12, border:"1px solid var(--border)", overflow:"hidden" }}>
          <table style={{ borderCollapse:"collapse", width:"100%" }}>
            <thead>
              <tr style={{ background:"var(--surface2)", borderBottom:"1px solid var(--border)" }}>
                {["ID","Componente","Tipo","Descripción","Solicitante","Célula","Prioridad","Figma","Fecha",""].map(h => (
                  <th key={h} style={{ padding:"10px 14px", fontSize:10, fontWeight:700, color:"var(--label)", letterSpacing:"0.08em", textTransform:"uppercase", fontFamily:"DM Mono, monospace", whiteSpace:"nowrap", textAlign:"left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} style={{ padding:"52px 16px", textAlign:"center", color:"var(--muted)", fontSize:13 }}>
                  <span style={{ display:"inline-block", animation:"spin 0.8s linear infinite", marginRight:8 }}>↻</span>Cargando pedidos desde Supabase…
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} style={{ padding:"52px 16px", textAlign:"center" }}>
                  <div style={{ fontSize:28, marginBottom:10 }}>◎</div>
                  <div style={{ fontSize:14, color:"var(--muted)", fontWeight:500 }}>No hay pedidos que coincidan con los filtros.</div>
                </td></tr>
              ) : filtered.map((o, i) => (
                <tr key={o.id} style={{ borderBottom:"1px solid var(--border)", transition:"background 0.1s" }}
                  onMouseEnter={e=>e.currentTarget.style.background="var(--surface2)"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{ padding:"13px 14px" }}><span style={{ fontSize:11, fontFamily:"DM Mono, monospace", color:"var(--muted)", fontWeight:500 }}>#{String(o.id).padStart(3,"0")}</span></td>
                  <td style={{ padding:"13px 14px" }}><span style={{ background:"var(--accent-light)", color:"var(--accent-text)", padding:"4px 10px", borderRadius:6, fontSize:12, fontWeight:600, whiteSpace:"nowrap" }}>{o.component}</span></td>
                  <td style={{ padding:"13px 14px" }}><TypeBadge value={o.type} /></td>
                  <td style={{ padding:"13px 14px", maxWidth:260 }}>
                    <div style={{ fontSize:13, color:"var(--text)", lineHeight:1.5, marginBottom:3 }}>{o.problem.length>68?o.problem.slice(0,68)+"…":o.problem}</div>
                    <div style={{ fontSize:11, color:"var(--label)", lineHeight:1.4 }}>{o.need.length>56?o.need.slice(0,56)+"…":o.need}</div>
                  </td>
                  <td style={{ padding:"13px 14px" }}><span style={{ fontSize:13, color:"var(--text)", whiteSpace:"nowrap" }}>{o.requester_name||"—"}</span></td>
                  <td style={{ padding:"13px 14px" }}><span style={{ fontSize:13, color:"var(--text)", fontWeight:500, whiteSpace:"nowrap" }}>{o.cell}</span></td>
                  <td style={{ padding:"13px 14px" }}><PriorityBadge value={o.priority} /></td>
                  <td style={{ padding:"13px 14px" }}>
                    {o.figma_link
                      ? <a href={o.figma_link} target="_blank" rel="noopener noreferrer" style={{ display:"inline-flex", alignItems:"center", gap:5, background:"#F5F0FF", color:"#7C3AED", padding:"4px 10px", borderRadius:6, fontSize:11, fontWeight:600, textDecoration:"none", whiteSpace:"nowrap" }}>✦ Ver diseño</a>
                      : <span style={{ fontSize:12, color:"var(--muted)" }}>—</span>}
                  </td>
                  <td style={{ padding:"13px 14px" }}><span style={{ fontSize:11, fontFamily:"DM Mono, monospace", color:"var(--muted)", whiteSpace:"nowrap" }}>{o.created_at?o.created_at.slice(0,10):"—"}</span></td>
                  <td style={{ padding:"13px 10px" }}>
                    <button onClick={() => setDeleteTarget(o)} title="Eliminar pedido"
                      style={{ background:"transparent", border:"1px solid transparent", borderRadius:7, padding:"5px 8px", cursor:"pointer", fontSize:14, color:"var(--muted)", transition:"all 0.15s", lineHeight:1 }}
                      onMouseEnter={e=>{e.currentTarget.style.background="#EEF2FF";e.currentTarget.style.color="#4F46E5";e.currentTarget.style.borderColor="#C7D2FE";}}
                      onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="var(--muted)";e.currentTarget.style.borderColor="transparent";}}>
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text)}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px}
        .btn-submit:hover:not(:disabled){filter:brightness(1.1);transform:translateY(-1px)}
        .btn-submit:active:not(:disabled){transform:translateY(0)}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes modalIn{from{opacity:0;transform:scale(0.95) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
      `}</style>

      <div style={{ minHeight:"100vh", background:"var(--bg)", ...theme }}>

        {/* HEADER */}
        <header style={{ background:"var(--surface)", borderBottom:"1px solid var(--border)", padding: isMobile?"0 16px":"0 28px", height: isMobile?54:62, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:8, flexShrink:0, background:"linear-gradient(135deg, var(--accent) 0%, #7C3AED 100%)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, color:"#fff" }}>◈</div>
            <div>
              <div style={{ fontSize: isMobile?15:17, fontWeight:700, color:"var(--text)", letterSpacing:"-0.02em", lineHeight:1.2 }}>DS Tracker Order</div>
              {!isMobile && <div style={{ fontSize:10, color:"var(--label)", letterSpacing:"0.06em", textTransform:"uppercase", lineHeight:1.3 }}>Evolutivos & Bugs · NOVA DS</div>}
              {!isMobile && <div style={{ fontSize:10, color:"var(--muted)", fontStyle:"italic", lineHeight:1.3 }}>El ciclo de vida de nuestros componentes, bajo control</div>}
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {!isMobile && (
              <div style={{ display:"flex", alignItems:"center", gap:5, background:"var(--surface2)", border:"1px solid var(--border)", padding:"4px 12px", borderRadius:20, fontSize:11, color:"var(--label)" }}>
                <span style={{ width:7, height:7, borderRadius:"50%", flexShrink:0, background:loading?"#F59E0B":usingFallback?"#F59E0B":"#22C55E" }} />
                {loading?"Cargando…":usingFallback?`${orders.length} · preview`:`${orders.length} · Supabase`}
              </div>
            )}
            <button onClick={async()=>{setExporting(true);await exportToExcel(orders);setExporting(false);}}
              disabled={orders.length===0||loading||exporting}
              style={{ background:orders.length>0&&!loading&&!exporting?"#16A34A":"var(--border)", color:orders.length>0&&!loading&&!exporting?"#fff":"var(--muted)", border:"none", borderRadius:8, padding: isMobile?"6px 10px":"6px 14px", cursor:orders.length>0&&!loading&&!exporting?"pointer":"not-allowed", fontSize: isMobile?11:12, fontFamily:"inherit", fontWeight:600, display:"flex", alignItems:"center", gap:5, transition:"all 0.15s", boxShadow:orders.length>0&&!loading&&!exporting?"0 2px 8px rgba(22,163,74,0.2)":"none", whiteSpace:"nowrap" }}>
              {exporting?<><span style={{display:"inline-block",animation:"spin 0.7s linear infinite"}}>↻</span>{isMobile?"…":"Generando…"}</>:isMobile?"⬇ Excel":"⬇ Exportar .xlsx"}
            </button>
            <button onClick={()=>setDarkMode(d=>!d)}
              style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontSize:12, color:"var(--label)", fontFamily:"inherit", fontWeight:500 }}>
              {darkMode?"☀":"◑"}
            </button>
          </div>
        </header>

        {/* BODY */}
        {isMobile ? (
          <div style={{ minHeight:"calc(100vh - 54px)", display:"flex", flexDirection:"column" }}>
            {/* Tab content */}
            <div style={{ flex:1, overflowY:"auto" }}>
              {mobileTab==="form" ? FormPanel : DashboardPanel}
            </div>
            {/* Bottom tab bar */}
            <nav style={{ position:"fixed", bottom:0, left:0, right:0, background:"var(--surface)", borderTop:"1px solid var(--border)", display:"flex", zIndex:50, height:68 }}>
              {[
                { id:"form",      label:"Nuevo Pedido", icon:"✦" },
                { id:"dashboard", label:"Dashboard",    icon:"◈" },
              ].map(tab => (
                <button key={tab.id} onClick={()=>setMobileTab(tab.id)}
                  style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4, background:"transparent", border:"none", cursor:"pointer", fontFamily:"inherit", color:mobileTab===tab.id?"var(--accent)":"var(--muted)", transition:"color 0.15s", paddingBottom:4 }}>
                  <span style={{ fontSize:20 }}>{tab.icon}</span>
                  <span style={{ fontSize:12, fontWeight:mobileTab===tab.id?700:600, letterSpacing:"0.01em" }}>{tab.label}</span>
                  {mobileTab===tab.id && <span style={{ position:"absolute", bottom:0, width:56, height:3, background:"var(--accent)", borderRadius:2 }} />}
                </button>
              ))}
            </nav>
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"368px 1fr", height:"calc(100vh - 62px)" }}>
            {FormPanel}
            {DashboardPanel}
          </div>
        )}
      </div>

      {/* DELETE MODAL */}
      {deleteTarget && (
        <DeleteModal
          order={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}
    </>
  );
}
