import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../supabase';

interface TercerosUnificadosProps {
  empresaId: number;
  canView?: boolean;
  canEdit?: boolean;
  modo?: 'general' | 'clientes' | 'proveedores';
}

type RolCodigo = 'cliente' | 'proveedor' | 'contacto';

interface TerceroCatalogo {
  id: number;
  empresa_id: number;
  codigo: string | null;
  tipo_identificacion: string | null;
  identificacion: string | null;
  razon_social: string;
  nombre_comercial: string | null;
  alias: string | null;
  email: string | null;
  telefono_1: string | null;
  telefono_2: string | null;
  activo: boolean;
  roles: string[];
}

interface TerceroForm {
  id: number | null;
  codigo: string;
  tipo_identificacion: string;
  identificacion: string;
  razon_social: string;
  nombre_comercial: string;
  alias: string;
  email: string;
  telefono_1: string;
  telefono_2: string;
  activo: boolean;
  notas: string;
}

interface ClienteParams {
  tercero_id: number;
  limite_credito: number;
  dias_credito: number;
  moneda_credito: 'CRC' | 'USD' | 'AMBAS';
  condicion_pago: string;
  clase_cliente: string;
  ubicacion: string;
  aplica_descuentos: boolean;
  descuento_maximo_pct: number;
  exonerado: boolean;
}

interface ProveedorParams {
  tercero_id: number;
  dias_credito: number;
  condicion_pago: string;
  clase_proveedor: string;
  ubicacion: string;
  aplica_retencion: boolean;
  retencion_pct: number;
  exonerado: boolean;
}

interface Contacto {
  id?: number;
  tercero_id: number;
  nombre: string;
  cargo: string;
  email: string;
  telefono: string;
  es_principal: boolean;
  activo: boolean;
}

const styles = `
  .ter-wrap { padding:0; }
  .ter-title { font-size:20px; font-weight:600; color:#1f2937; margin-bottom:6px; }
  .ter-sub { font-size:12px; color:#6b7280; margin-bottom:12px; }
  .ter-msg-ok { margin-bottom:10px; border:1px solid #bbf7d0; background:#dcfce7; color:#166534; border-radius:8px; padding:10px 12px; font-size:12px; }
  .ter-msg-err { margin-bottom:10px; border:1px solid #fecaca; background:#fee2e2; color:#991b1b; border-radius:8px; padding:10px 12px; font-size:12px; }
  .ter-layout { display:grid; grid-template-columns: 360px 1fr; gap:12px; }
  .ter-card { background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:12px; }
  .ter-grid { display:grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap:8px; }
  .ter-field { display:flex; flex-direction:column; gap:4px; }
  .ter-field label { font-size:11px; color:#64748b; text-transform:uppercase; letter-spacing:.03em; font-weight:700; }
  .ter-input, .ter-select, .ter-text { width:100%; border:1px solid #d1d5db; border-radius:8px; padding:8px 10px; font-size:13px; }
  .ter-text { min-height:78px; }
  .ter-actions { display:flex; gap:8px; flex-wrap:wrap; margin-top:10px; align-items:center; }
  .ter-btn { border:1px solid #d1d5db; background:#fff; color:#334155; border-radius:8px; padding:8px 11px; font-size:13px; cursor:pointer; }
  .ter-btn.main { border-color:#16a34a; background:#16a34a; color:#fff; }
  .ter-btn:disabled { opacity:.65; cursor:not-allowed; }
  .ter-search { margin-bottom:8px; }
  .ter-list { border:1px solid #e5e7eb; border-radius:10px; overflow:auto; max-height:680px; }
  .ter-item { padding:9px 10px; border-top:1px solid #f1f5f9; cursor:pointer; }
  .ter-item:first-child { border-top:none; }
  .ter-item.active { background:#eff6ff; }
  .ter-item-name { font-size:13px; color:#0f172a; font-weight:700; }
  .ter-item-sub { font-size:12px; color:#64748b; margin-top:2px; display:flex; gap:8px; flex-wrap:wrap; }
  .ter-chip { display:inline-flex; align-items:center; border-radius:999px; padding:1px 7px; font-size:10px; border:1px solid #bfdbfe; color:#1d4ed8; background:#eff6ff; text-transform:uppercase; }
  .ter-sec-title { font-size:13px; color:#0f172a; font-weight:700; margin:12px 0 8px; }
  .ter-checks { display:flex; gap:14px; flex-wrap:wrap; margin:4px 0 2px; }
  .ter-check { display:flex; align-items:center; gap:6px; font-size:12px; color:#334155; }
  .ter-table { border:1px solid #e5e7eb; border-radius:10px; overflow:auto; }
  .ter-table table { width:100%; border-collapse:collapse; min-width:720px; }
  .ter-table th, .ter-table td { padding:8px 10px; border-top:1px solid #f1f5f9; font-size:12px; }
  .ter-table th { background:#f8fafc; color:#64748b; text-transform:uppercase; letter-spacing:.03em; font-size:11px; text-align:left; }
  .ter-table input[type="text"], .ter-table input[type="email"], .ter-table input[type="number"] { width:100%; border:1px solid #d1d5db; border-radius:6px; padding:6px 8px; font-size:12px; }
  .ter-empty { color:#64748b; font-size:12px; padding:10px; text-align:center; }
  @media (max-width: 1200px) {
    .ter-layout { grid-template-columns: 1fr; }
  }
  @media (max-width: 900px) {
    .ter-grid { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 640px) {
    .ter-grid { grid-template-columns: 1fr; }
  }
`;

const emptyForm: TerceroForm = {
  id: null,
  codigo: '',
  tipo_identificacion: '',
  identificacion: '',
  razon_social: '',
  nombre_comercial: '',
  alias: '',
  email: '',
  telefono_1: '',
  telefono_2: '',
  activo: true,
  notas: '',
};

const defaultCliente = (terceroId: number): ClienteParams => ({
  tercero_id: terceroId,
  limite_credito: 0,
  dias_credito: 0,
  moneda_credito: 'CRC',
  condicion_pago: '',
  clase_cliente: '',
  ubicacion: '',
  aplica_descuentos: false,
  descuento_maximo_pct: 0,
  exonerado: false,
});

const defaultProveedor = (terceroId: number): ProveedorParams => ({
  tercero_id: terceroId,
  dias_credito: 0,
  condicion_pago: '',
  clase_proveedor: '',
  ubicacion: '',
  aplica_retencion: false,
  retencion_pct: 0,
  exonerado: false,
});

const toN = (v: unknown, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

const sortRoles = (r: string[] = []) => [...r].sort((a, b) => a.localeCompare(b));

export default function TercerosUnificados({
  empresaId,
  canView = true,
  canEdit = false,
  modo = 'general',
}: TercerosUnificadosProps) {
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState('');
  const [err, setErr] = useState('');
  const [search, setSearch] = useState('');
  const rolFijo = modo === 'clientes' ? 'cliente' : (modo === 'proveedores' ? 'proveedor' : null);
  const [rolFiltro, setRolFiltro] = useState<'todos' | RolCodigo>(rolFijo || 'todos');
  const [rows, setRows] = useState<TerceroCatalogo[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<TerceroForm>(emptyForm);
  const [roles, setRoles] = useState<Record<RolCodigo, boolean>>({ cliente: false, proveedor: false, contacto: false });
  const [cliente, setCliente] = useState<ClienteParams>(defaultCliente(0));
  const [proveedor, setProveedor] = useState<ProveedorParams>(defaultProveedor(0));
  const [contactos, setContactos] = useState<Contacto[]>([]);

  const titulo = modo === 'clientes' ? 'Clientes' : (modo === 'proveedores' ? 'Proveedores' : 'Mantenimiento de Terceros');
  const subtitulo = modo === 'clientes'
    ? 'Vista filtrada del catalogo unificado para gestion de clientes.'
    : (modo === 'proveedores'
      ? 'Vista filtrada del catalogo unificado para gestion de proveedores.'
      : 'Catalogo unificado para clientes, proveedores y contactos por empresa.');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtroEfectivo = rolFijo || rolFiltro;
    return rows.filter((r) => {
      if (filtroEfectivo !== 'todos' && !(r.roles || []).includes(filtroEfectivo)) return false;
      if (!q) return true;
      return (
        String(r.razon_social || '').toLowerCase().includes(q) ||
        String(r.identificacion || '').toLowerCase().includes(q) ||
        String(r.codigo || '').toLowerCase().includes(q) ||
        String(r.email || '').toLowerCase().includes(q)
      );
    });
  }, [rows, search, rolFiltro, rolFijo]);

  useEffect(() => {
    if (rolFijo) setRolFiltro(rolFijo);
  }, [rolFijo]);

  const resetEditor = () => {
    setSelectedId(null);
    setForm(emptyForm);
    setRoles({
      cliente: rolFijo === 'cliente',
      proveedor: rolFijo === 'proveedor',
      contacto: false,
    });
    setCliente(defaultCliente(0));
    setProveedor(defaultProveedor(0));
    setContactos([]);
  };

  const loadCatalogo = async () => {
    if (!canView) return;
    setBusy(true);
    setErr('');
    const { data, error } = await supabase
      .from('vw_terceros_catalogo')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('razon_social', { ascending: true });
    setBusy(false);
    if (error) {
      setErr(error.message || 'No se pudo cargar terceros.');
      return;
    }
    const next = (data || []) as TerceroCatalogo[];
    setRows(next);
    if (selectedId && !next.some((x) => x.id === selectedId)) resetEditor();
  };

  const loadDetalle = async (terceroId: number) => {
    if (!terceroId) return;
    setBusy(true);
    setErr('');
    const [baseRes, rolRes, cliRes, prvRes, conRes] = await Promise.all([
      supabase.from('vw_terceros').select('*').eq('id', terceroId).eq('empresa_id', empresaId).single(),
      supabase.from('vw_tercero_roles').select('rol,activo').eq('tercero_id', terceroId),
      supabase.from('vw_tercero_cliente_parametros').select('*').eq('tercero_id', terceroId).maybeSingle(),
      supabase.from('vw_tercero_proveedor_parametros').select('*').eq('tercero_id', terceroId).maybeSingle(),
      supabase.from('vw_tercero_contactos').select('*').eq('tercero_id', terceroId).order('id', { ascending: true }),
    ]);
    setBusy(false);
    if (baseRes.error) {
      setErr(baseRes.error.message || 'No se pudo cargar tercero.');
      return;
    }

    const b = baseRes.data as any;
    const roleRows = (rolRes.data || []) as { rol: RolCodigo; activo: boolean }[];
    setSelectedId(terceroId);
    setForm({
      id: b.id,
      codigo: b.codigo || '',
      tipo_identificacion: b.tipo_identificacion || '',
      identificacion: b.identificacion || '',
      razon_social: b.razon_social || '',
      nombre_comercial: b.nombre_comercial || '',
      alias: b.alias || '',
      email: b.email || '',
      telefono_1: b.telefono_1 || '',
      telefono_2: b.telefono_2 || '',
      activo: b.activo !== false,
      notas: b.notas || '',
    });
    setRoles({
      cliente: roleRows.some((r) => r.rol === 'cliente' && r.activo),
      proveedor: roleRows.some((r) => r.rol === 'proveedor' && r.activo),
      contacto: roleRows.some((r) => r.rol === 'contacto' && r.activo),
    });
    setCliente(cliRes.data ? ({
      tercero_id: terceroId,
      limite_credito: toN((cliRes.data as any).limite_credito, 0),
      dias_credito: toN((cliRes.data as any).dias_credito, 0),
      moneda_credito: (String((cliRes.data as any).moneda_credito || 'CRC') as 'CRC' | 'USD' | 'AMBAS'),
      condicion_pago: String((cliRes.data as any).condicion_pago || ''),
      clase_cliente: String((cliRes.data as any).clase_cliente || ''),
      ubicacion: String((cliRes.data as any).ubicacion || ''),
      aplica_descuentos: Boolean((cliRes.data as any).aplica_descuentos),
      descuento_maximo_pct: toN((cliRes.data as any).descuento_maximo_pct, 0),
      exonerado: Boolean((cliRes.data as any).exonerado),
    }) : defaultCliente(terceroId));
    setProveedor(prvRes.data ? ({
      tercero_id: terceroId,
      dias_credito: toN((prvRes.data as any).dias_credito, 0),
      condicion_pago: String((prvRes.data as any).condicion_pago || ''),
      clase_proveedor: String((prvRes.data as any).clase_proveedor || ''),
      ubicacion: String((prvRes.data as any).ubicacion || ''),
      aplica_retencion: Boolean((prvRes.data as any).aplica_retencion),
      retencion_pct: toN((prvRes.data as any).retencion_pct, 0),
      exonerado: Boolean((prvRes.data as any).exonerado),
    }) : defaultProveedor(terceroId));

    const cRows = ((conRes.data || []) as any[]).map((c) => ({
      id: Number(c.id),
      tercero_id: terceroId,
      nombre: String(c.nombre || ''),
      cargo: String(c.cargo || ''),
      email: String(c.email || ''),
      telefono: String(c.telefono || ''),
      es_principal: Boolean(c.es_principal),
      activo: c.activo !== false,
    }));
    setContactos(cRows);
  };

  useEffect(() => {
    loadCatalogo();
  }, [empresaId]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveGeneral = async () => {
    if (!canEdit) return;
    if (!form.razon_social.trim()) {
      setErr('Razon social es requerida.');
      return;
    }
    setBusy(true);
    setErr('');
    setOk('');
    try {
      let terceroId = form.id;
      if (!terceroId) {
        const { data, error } = await supabase
          .from('terceros')
          .insert({
            empresa_id: empresaId,
            codigo: form.codigo || null,
            tipo_identificacion: form.tipo_identificacion || null,
            identificacion: form.identificacion || null,
            razon_social: form.razon_social.trim(),
            nombre_comercial: form.nombre_comercial || null,
            alias: form.alias || null,
            email: form.email || null,
            telefono_1: form.telefono_1 || null,
            telefono_2: form.telefono_2 || null,
            activo: form.activo,
            notas: form.notas || null,
          })
          .select('id')
          .single();
        if (error) throw error;
        terceroId = Number((data as any)?.id || 0);
      } else {
        const { error } = await supabase
          .from('terceros')
          .update({
            codigo: form.codigo || null,
            tipo_identificacion: form.tipo_identificacion || null,
            identificacion: form.identificacion || null,
            razon_social: form.razon_social.trim(),
            nombre_comercial: form.nombre_comercial || null,
            alias: form.alias || null,
            email: form.email || null,
            telefono_1: form.telefono_1 || null,
            telefono_2: form.telefono_2 || null,
            activo: form.activo,
            notas: form.notas || null,
          })
          .eq('id', terceroId)
          .eq('empresa_id', empresaId);
        if (error) throw error;
      }

      if (!terceroId) throw new Error('No se pudo determinar tercero.');

      const rolePayload = (['cliente', 'proveedor', 'contacto'] as RolCodigo[]).map((rol) => ({
        tercero_id: terceroId,
        rol,
        activo: rolFijo === rol ? true : Boolean(roles[rol]),
      }));
      const { error: rolesErr } = await supabase.from('tercero_roles').upsert(rolePayload, { onConflict: 'tercero_id,rol' });
      if (rolesErr) throw rolesErr;

      if ((rolFijo === 'cliente') || roles.cliente) {
        const { error: cliErr } = await supabase.from('tercero_cliente_parametros').upsert({
          tercero_id: terceroId,
          limite_credito: toN(cliente.limite_credito, 0),
          dias_credito: toN(cliente.dias_credito, 0),
          moneda_credito: cliente.moneda_credito,
          condicion_pago: cliente.condicion_pago || null,
          clase_cliente: cliente.clase_cliente || null,
          ubicacion: cliente.ubicacion || null,
          aplica_descuentos: cliente.aplica_descuentos,
          descuento_maximo_pct: toN(cliente.descuento_maximo_pct, 0),
          exonerado: cliente.exonerado,
        }, { onConflict: 'tercero_id' });
        if (cliErr) throw cliErr;
      }

      if ((rolFijo === 'proveedor') || roles.proveedor) {
        const { error: prvErr } = await supabase.from('tercero_proveedor_parametros').upsert({
          tercero_id: terceroId,
          dias_credito: toN(proveedor.dias_credito, 0),
          condicion_pago: proveedor.condicion_pago || null,
          clase_proveedor: proveedor.clase_proveedor || null,
          ubicacion: proveedor.ubicacion || null,
          aplica_retencion: proveedor.aplica_retencion,
          retencion_pct: toN(proveedor.retencion_pct, 0),
          exonerado: proveedor.exonerado,
        }, { onConflict: 'tercero_id' });
        if (prvErr) throw prvErr;
      }

      const existingIds = contactos.map((c) => c.id).filter(Boolean) as number[];
      const { data: exContRows } = await supabase.from('tercero_contactos').select('id').eq('tercero_id', terceroId);
      const toDelete = ((exContRows || []) as { id: number }[]).map((r) => r.id).filter((id) => !existingIds.includes(id));
      if (toDelete.length > 0) {
        const { error: delErr } = await supabase.from('tercero_contactos').delete().in('id', toDelete);
        if (delErr) throw delErr;
      }
      if (contactos.length > 0) {
        const toUpsert = contactos
          .filter((c) => c.nombre.trim() !== '')
          .map((c) => ({
            id: c.id,
            tercero_id: terceroId,
            nombre: c.nombre.trim(),
            cargo: c.cargo || null,
            email: c.email || null,
            telefono: c.telefono || null,
            es_principal: c.es_principal,
            activo: c.activo,
          }));
        if (toUpsert.length > 0) {
          const { error: conErr } = await supabase.from('tercero_contactos').upsert(toUpsert, { onConflict: 'id' });
          if (conErr) throw conErr;
        }
      }

      await loadCatalogo();
      await loadDetalle(terceroId);
      setOk('Tercero guardado correctamente.');
    } catch (e: any) {
      setErr(String(e?.message || 'No se pudo guardar tercero.'));
    } finally {
      setBusy(false);
    }
  };

  const addContacto = () => {
    const terceroId = form.id || 0;
    setContactos((prev) => [...prev, {
      tercero_id: terceroId,
      nombre: '',
      cargo: '',
      email: '',
      telefono: '',
      es_principal: prev.length === 0,
      activo: true,
    }]);
  };

  const updateContacto = (idx: number, key: keyof Contacto, value: any) => {
    setContactos((prev) => prev.map((c, i) => (i === idx ? ({ ...c, [key]: value }) : c)));
  };

  const removeContacto = (idx: number) => {
    setContactos((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <>
      <style>{styles}</style>
      <div className="ter-wrap">
        <div className="ter-title">{titulo}</div>
        <div className="ter-sub">{subtitulo}</div>
        {ok ? <div className="ter-msg-ok">{ok}</div> : null}
        {err ? <div className="ter-msg-err">{err}</div> : null}

        <div className="ter-layout">
          <div className="ter-card">
            <div className="ter-actions" style={{ marginTop: 0, marginBottom: 8 }}>
              <button className="ter-btn main" type="button" onClick={resetEditor} disabled={!canEdit || busy}>Nuevo</button>
              {!rolFijo ? (
                <select className="ter-select" value={rolFiltro} onChange={(e) => setRolFiltro(e.target.value as any)} style={{ maxWidth: 170 }}>
                  <option value="todos">Todos</option>
                  <option value="cliente">Cliente</option>
                  <option value="proveedor">Proveedor</option>
                  <option value="contacto">Contacto</option>
                </select>
              ) : null}
            </div>
            <input
              className="ter-input ter-search"
              placeholder="Buscar por nombre, id, codigo, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="ter-list">
              {filtered.length === 0 ? <div className="ter-empty">Sin terceros para mostrar.</div> : filtered.map((r) => (
                <div key={r.id} className={`ter-item ${selectedId === r.id ? 'active' : ''}`} onClick={() => loadDetalle(r.id)}>
                  <div className="ter-item-name">{r.razon_social}</div>
                  <div className="ter-item-sub">
                    <span>{r.identificacion || '-'}</span>
                    {(sortRoles(r.roles) || []).map((rol) => <span key={rol} className="ter-chip">{rol}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="ter-card">
            <div className="ter-grid">
              <div className="ter-field">
                <label>Codigo</label>
                <input className="ter-input" value={form.codigo} disabled={!canEdit || busy} onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))} />
              </div>
              <div className="ter-field">
                <label>Tipo Id</label>
                <select className="ter-select" value={form.tipo_identificacion} disabled={!canEdit || busy} onChange={(e) => setForm((p) => ({ ...p, tipo_identificacion: e.target.value }))}>
                  <option value="">--</option>
                  <option value="01">01 Persona fisica</option>
                  <option value="02">02 Persona juridica</option>
                  <option value="03">03 DIMEX</option>
                  <option value="04">04 NITE</option>
                </select>
              </div>
              <div className="ter-field">
                <label>Identificacion</label>
                <input className="ter-input" value={form.identificacion} disabled={!canEdit || busy} onChange={(e) => setForm((p) => ({ ...p, identificacion: e.target.value }))} />
              </div>
              <div className="ter-field">
                <label>Razon social</label>
                <input className="ter-input" value={form.razon_social} disabled={!canEdit || busy} onChange={(e) => setForm((p) => ({ ...p, razon_social: e.target.value }))} />
              </div>
              <div className="ter-field">
                <label>Nombre comercial</label>
                <input className="ter-input" value={form.nombre_comercial} disabled={!canEdit || busy} onChange={(e) => setForm((p) => ({ ...p, nombre_comercial: e.target.value }))} />
              </div>
              <div className="ter-field">
                <label>Alias</label>
                <input className="ter-input" value={form.alias} disabled={!canEdit || busy} onChange={(e) => setForm((p) => ({ ...p, alias: e.target.value }))} />
              </div>
              <div className="ter-field">
                <label>Email</label>
                <input className="ter-input" type="email" value={form.email} disabled={!canEdit || busy} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="ter-field">
                <label>Telefono 1</label>
                <input className="ter-input" value={form.telefono_1} disabled={!canEdit || busy} onChange={(e) => setForm((p) => ({ ...p, telefono_1: e.target.value }))} />
              </div>
              <div className="ter-field">
                <label>Telefono 2</label>
                <input className="ter-input" value={form.telefono_2} disabled={!canEdit || busy} onChange={(e) => setForm((p) => ({ ...p, telefono_2: e.target.value }))} />
              </div>
            </div>

            <div className="ter-sec-title">Roles</div>
            <div className="ter-checks">
              {!rolFijo ? (
                <>
                  <label className="ter-check"><input type="checkbox" checked={roles.cliente} disabled={!canEdit || busy} onChange={(e) => setRoles((p) => ({ ...p, cliente: e.target.checked }))} />Cliente</label>
                  <label className="ter-check"><input type="checkbox" checked={roles.proveedor} disabled={!canEdit || busy} onChange={(e) => setRoles((p) => ({ ...p, proveedor: e.target.checked }))} />Proveedor</label>
                  <label className="ter-check"><input type="checkbox" checked={roles.contacto} disabled={!canEdit || busy} onChange={(e) => setRoles((p) => ({ ...p, contacto: e.target.checked }))} />Contacto</label>
                </>
              ) : (
                <span className="ter-chip">{rolFijo}</span>
              )}
              <label className="ter-check"><input type="checkbox" checked={form.activo} disabled={!canEdit || busy} onChange={(e) => setForm((p) => ({ ...p, activo: e.target.checked }))} />Activo</label>
            </div>

            {(modo !== 'proveedores') ? <><div className="ter-sec-title">Parametros Cliente</div>
            <div className="ter-grid">
              <div className="ter-field"><label>Limite credito</label><input className="ter-input" type="number" step="0.01" value={cliente.limite_credito} disabled={!canEdit || busy || !roles.cliente} onChange={(e) => setCliente((p) => ({ ...p, limite_credito: toN(e.target.value, 0) }))} /></div>
              <div className="ter-field"><label>Dias credito</label><input className="ter-input" type="number" value={cliente.dias_credito} disabled={!canEdit || busy || !roles.cliente} onChange={(e) => setCliente((p) => ({ ...p, dias_credito: toN(e.target.value, 0) }))} /></div>
              <div className="ter-field"><label>Moneda credito</label><select className="ter-select" value={cliente.moneda_credito} disabled={!canEdit || busy || !roles.cliente} onChange={(e) => setCliente((p) => ({ ...p, moneda_credito: e.target.value as any }))}><option value="CRC">CRC</option><option value="USD">USD</option><option value="AMBAS">AMBAS</option></select></div>
              <div className="ter-field"><label>Condicion pago</label><input className="ter-input" value={cliente.condicion_pago} disabled={!canEdit || busy || !roles.cliente} onChange={(e) => setCliente((p) => ({ ...p, condicion_pago: e.target.value }))} /></div>
              <div className="ter-field"><label>Clase cliente</label><input className="ter-input" value={cliente.clase_cliente} disabled={!canEdit || busy || !roles.cliente} onChange={(e) => setCliente((p) => ({ ...p, clase_cliente: e.target.value }))} /></div>
              <div className="ter-field"><label>Ubicacion</label><input className="ter-input" value={cliente.ubicacion} disabled={!canEdit || busy || !roles.cliente} onChange={(e) => setCliente((p) => ({ ...p, ubicacion: e.target.value }))} /></div>
              <div className="ter-field"><label>Desc max %</label><input className="ter-input" type="number" step="0.01" value={cliente.descuento_maximo_pct} disabled={!canEdit || busy || !roles.cliente} onChange={(e) => setCliente((p) => ({ ...p, descuento_maximo_pct: toN(e.target.value, 0) }))} /></div>
              <div className="ter-field"><label>Aplica descuentos</label><select className="ter-select" value={cliente.aplica_descuentos ? '1' : '0'} disabled={!canEdit || busy || !roles.cliente} onChange={(e) => setCliente((p) => ({ ...p, aplica_descuentos: e.target.value === '1' }))}><option value="0">No</option><option value="1">Si</option></select></div>
              <div className="ter-field"><label>Exonerado</label><select className="ter-select" value={cliente.exonerado ? '1' : '0'} disabled={!canEdit || busy || !roles.cliente} onChange={(e) => setCliente((p) => ({ ...p, exonerado: e.target.value === '1' }))}><option value="0">No</option><option value="1">Si</option></select></div>
            </div></> : null}

            {(modo !== 'clientes') ? <><div className="ter-sec-title">Parametros Proveedor</div>
            <div className="ter-grid">
              <div className="ter-field"><label>Dias credito</label><input className="ter-input" type="number" value={proveedor.dias_credito} disabled={!canEdit || busy || !roles.proveedor} onChange={(e) => setProveedor((p) => ({ ...p, dias_credito: toN(e.target.value, 0) }))} /></div>
              <div className="ter-field"><label>Condicion pago</label><input className="ter-input" value={proveedor.condicion_pago} disabled={!canEdit || busy || !roles.proveedor} onChange={(e) => setProveedor((p) => ({ ...p, condicion_pago: e.target.value }))} /></div>
              <div className="ter-field"><label>Clase proveedor</label><input className="ter-input" value={proveedor.clase_proveedor} disabled={!canEdit || busy || !roles.proveedor} onChange={(e) => setProveedor((p) => ({ ...p, clase_proveedor: e.target.value }))} /></div>
              <div className="ter-field"><label>Ubicacion</label><input className="ter-input" value={proveedor.ubicacion} disabled={!canEdit || busy || !roles.proveedor} onChange={(e) => setProveedor((p) => ({ ...p, ubicacion: e.target.value }))} /></div>
              <div className="ter-field"><label>Retencion %</label><input className="ter-input" type="number" step="0.01" value={proveedor.retencion_pct} disabled={!canEdit || busy || !roles.proveedor} onChange={(e) => setProveedor((p) => ({ ...p, retencion_pct: toN(e.target.value, 0) }))} /></div>
              <div className="ter-field"><label>Aplica retencion</label><select className="ter-select" value={proveedor.aplica_retencion ? '1' : '0'} disabled={!canEdit || busy || !roles.proveedor} onChange={(e) => setProveedor((p) => ({ ...p, aplica_retencion: e.target.value === '1' }))}><option value="0">No</option><option value="1">Si</option></select></div>
              <div className="ter-field"><label>Exonerado</label><select className="ter-select" value={proveedor.exonerado ? '1' : '0'} disabled={!canEdit || busy || !roles.proveedor} onChange={(e) => setProveedor((p) => ({ ...p, exonerado: e.target.value === '1' }))}><option value="0">No</option><option value="1">Si</option></select></div>
            </div></> : null}

            <div className="ter-sec-title">Contactos</div>
            <div className="ter-actions">
              <button className="ter-btn" type="button" onClick={addContacto} disabled={!canEdit || busy}>Agregar contacto</button>
            </div>
            <div className="ter-table">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '24%' }}>Nombre</th>
                    <th style={{ width: '18%' }}>Cargo</th>
                    <th style={{ width: '22%' }}>Email</th>
                    <th style={{ width: '16%' }}>Telefono</th>
                    <th style={{ width: '8%' }}>Principal</th>
                    <th style={{ width: '8%' }}>Activo</th>
                    <th style={{ width: '4%' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {contactos.length === 0 ? (
                    <tr><td colSpan={7} className="ter-empty">Sin contactos.</td></tr>
                  ) : contactos.map((c, idx) => (
                    <tr key={`${c.id || 'new'}-${idx}`}>
                      <td><input type="text" value={c.nombre} disabled={!canEdit || busy} onChange={(e) => updateContacto(idx, 'nombre', e.target.value)} /></td>
                      <td><input type="text" value={c.cargo} disabled={!canEdit || busy} onChange={(e) => updateContacto(idx, 'cargo', e.target.value)} /></td>
                      <td><input type="email" value={c.email} disabled={!canEdit || busy} onChange={(e) => updateContacto(idx, 'email', e.target.value)} /></td>
                      <td><input type="text" value={c.telefono} disabled={!canEdit || busy} onChange={(e) => updateContacto(idx, 'telefono', e.target.value)} /></td>
                      <td><input type="checkbox" checked={c.es_principal} disabled={!canEdit || busy} onChange={(e) => updateContacto(idx, 'es_principal', e.target.checked)} /></td>
                      <td><input type="checkbox" checked={c.activo} disabled={!canEdit || busy} onChange={(e) => updateContacto(idx, 'activo', e.target.checked)} /></td>
                      <td><button className="ter-btn" type="button" onClick={() => removeContacto(idx)} disabled={!canEdit || busy}>X</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="ter-actions">
              <button className="ter-btn main" type="button" onClick={saveGeneral} disabled={!canEdit || busy}>
                {busy ? 'Guardando...' : 'Guardar tercero'}
              </button>
              <button className="ter-btn" type="button" onClick={loadCatalogo} disabled={busy}>Recargar</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
