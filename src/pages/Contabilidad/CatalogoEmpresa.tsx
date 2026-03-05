import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

interface CuentaEmpresa {
  id: number;
  empresa_id: number;
  cuenta_base_id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
  plan_cuentas_base: {
    codigo: string;
    nombre: string;
    nivel: number;
    tipo: string;
    naturaleza: string;
    acepta_movimiento: boolean;
  };
}

const styles = `
  .cat-wrap { padding:0; }
  .cat-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
  .cat-title { font-size:20px; font-weight:600; color:#1f2937; letter-spacing:-0.3px; }
  .cat-title span { font-size:13px; font-weight:400; color:#9ca3af; margin-left:8px; }
  .cat-toolbar { display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin-bottom:18px; }
  .cat-search { padding:9px 14px; border:1px solid #e5e7eb; border-radius:9px;
    font-size:13px; color:#1f2937; outline:none; width:260px;
    font-family:'DM Sans',sans-serif; transition:border-color 0.2s; }
  .cat-search:focus { border-color:#22c55e; box-shadow:0 0 0 3px rgba(34,197,94,0.1); }
  .cat-filters { display:flex; gap:6px; flex-wrap:wrap; }
  .cat-filter-btn { padding:7px 14px; border-radius:8px; font-size:12px; font-weight:500;
    cursor:pointer; border:1px solid #e5e7eb; background:white; color:#6b7280; transition:all 0.15s; }
  .cat-filter-btn:hover { border-color:#22c55e; color:#16a34a; }
  .cat-filter-btn.active { background:#dcfce7; border-color:#22c55e; color:#16a34a; }
  .tipo-btn { padding:6px 12px; border-radius:7px; font-size:11px; font-weight:600;
    cursor:pointer; border:1px solid transparent; transition:all 0.15s; }
  .tipo-btn.ACTIVO { background:#dbeafe; color:#1d4ed8; border-color:#bfdbfe; }
  .tipo-btn.PASIVO { background:#fce7f3; color:#be185d; border-color:#fbcfe8; }
  .tipo-btn.CAPITAL { background:#ede9fe; color:#7c3aed; border-color:#ddd6fe; }
  .tipo-btn.INGRESO { background:#dcfce7; color:#16a34a; border-color:#bbf7d0; }
  .tipo-btn.GASTO { background:#fee2e2; color:#dc2626; border-color:#fecaca; }
  .tipo-btn.inactive { background:#f3f4f6; color:#9ca3af; border-color:#e5e7eb; }
  .cat-table-wrap { background:white; border-radius:14px; border:1px solid #e5e7eb;
    overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.04); }
  .cat-table { width:100%; border-collapse:collapse; }
  .cat-table thead { background:#f9fafb; }
  .cat-table th { padding:12px 16px; text-align:left; font-size:11px; font-weight:600;
    color:#6b7280; letter-spacing:0.06em; text-transform:uppercase; border-bottom:1px solid #e5e7eb; }
  .cat-table td { padding:10px 16px; font-size:13px; color:#374151; border-bottom:1px solid #f3f4f6; }
  .cat-table tr:last-child td { border-bottom:none; }
  .cat-table tr:hover td { background:#f9fafb; }
  .nivel-1 td:first-child { font-weight:700; color:#1d4ed8; }
  .nivel-1 .cat-nombre { font-weight:700; font-size:14px; }
  .nivel-2 td:first-child { color:#7c3aed; font-weight:600; }
  .nivel-2 .cat-nombre { font-weight:600; }
  .nivel-3 td:first-child { color:#16a34a; }
  .nivel-4 td:first-child { color:#d97706; }
  .nivel-5 td { background:#fafafa; }
  .cat-codigo { font-family:'DM Mono',monospace; font-size:12px; }
  .tipo-badge { display:inline-flex; padding:2px 8px; border-radius:5px; font-size:10px; font-weight:600; }
  .tipo-ACTIVO { background:#dbeafe; color:#1d4ed8; }
  .tipo-PASIVO { background:#fce7f3; color:#be185d; }
  .tipo-CAPITAL { background:#ede9fe; color:#7c3aed; }
  .tipo-INGRESO { background:#dcfce7; color:#16a34a; }
  .tipo-GASTO { background:#fee2e2; color:#dc2626; }
  .mov-si { color:#16a34a; font-size:16px; }
  .mov-no { color:#e5e7eb; font-size:16px; }
  .cat-empty { padding:48px; text-align:center; color:#9ca3af; font-size:13px; }
  .cat-stats { display:flex; gap:12px; margin-bottom:18px; flex-wrap:wrap; }
  .cat-stat { background:white; border:1px solid #e5e7eb; border-radius:10px;
    padding:12px 16px; display:flex; flex-direction:column; gap:2px; }
  .cat-stat-num { font-size:20px; font-weight:700; color:#1f2937; }
  .cat-stat-label { font-size:11px; color:#9ca3af; font-weight:500; }

  /* Modal edición */
  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5);
    display:flex; align-items:center; justify-content:center; z-index:1000; }
  .modal-box { background:white; border-radius:16px; padding:32px; width:480px;
    box-shadow:0 20px 60px rgba(0,0,0,0.2); }
  .modal-title { font-size:17px; font-weight:600; color:#1f2937; margin-bottom:6px; }
  .modal-sub { font-size:12px; color:#9ca3af; margin-bottom:20px; }
  .modal-field { margin-bottom:16px; }
  .modal-label { display:block; font-size:11px; font-weight:500; color:#6b7280;
    letter-spacing:0.04em; text-transform:uppercase; margin-bottom:6px; }
  .modal-input { width:100%; padding:9px 12px; border:1px solid #e5e7eb;
    border-radius:8px; font-size:13px; color:#1f2937; outline:none;
    font-family:'DM Sans',sans-serif; transition:border-color 0.2s; }
  .modal-input:focus { border-color:#22c55e; box-shadow:0 0 0 3px rgba(34,197,94,0.1); }
  .modal-info { padding:10px 14px; background:#f9fafb; border:1px solid #e5e7eb;
    border-radius:8px; font-size:12px; color:#6b7280; margin-bottom:16px; }
  .modal-info span { font-family:'DM Mono',monospace; color:#16a34a; font-weight:600; }
  .modal-check { display:flex; align-items:center; gap:8px; cursor:pointer; }
  .modal-check input { width:15px; height:15px; accent-color:#16a34a; }
  .modal-check span { font-size:13px; color:#374151; }
  .modal-actions { display:flex; gap:10px; justify-content:flex-end; margin-top:24px; }
  .btn-cancelar { padding:9px 16px; background:#f3f4f6; border:none; border-radius:8px;
    color:#374151; font-size:13px; font-weight:500; cursor:pointer; }
  .btn-cancelar:hover { background:#e5e7eb; }
  .btn-guardar { padding:9px 20px; background:linear-gradient(135deg,#16a34a,#22c55e);
    border:none; border-radius:8px; color:white; font-size:13px; font-weight:600; cursor:pointer; }
  .btn-guardar:hover { opacity:0.9; }
  .btn-editar { padding:5px 10px; background:#eff6ff; border:1px solid #bfdbfe;
    border-radius:6px; color:#2563eb; font-size:11px; font-weight:500; cursor:pointer; }
  .btn-editar:hover { background:#2563eb; color:white; }
  .success-msg { padding:10px 14px; background:#dcfce7; border:1px solid #bbf7d0;
    border-radius:8px; color:#16a34a; font-size:12px; font-weight:500; margin-bottom:16px; }
  .cat-personalizada { font-size:10px; color:#f59e0b; font-weight:600;
    background:#fef9c3; padding:1px 6px; border-radius:4px; margin-left:6px; }
`;

const TIPOS = ['ACTIVO', 'PASIVO', 'CAPITAL', 'INGRESO', 'GASTO'];
const NIVELES = [1, 2, 3, 4, 5];

export default function CatalogoEmpresa({ empresaId }: { empresaId: number }) {
  const [cuentas, setCuentas] = useState<CuentaEmpresa[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroNivel, setFiltroNivel] = useState<number | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [editando, setEditando] = useState<CuentaEmpresa | null>(null);
  const [form, setForm] = useState({ codigo: '', nombre: '', activo: true });
  const [exito, setExito] = useState('');

  const cargar = async () => {
    setCargando(true);
    const { data } = await supabase
      .from('plan_cuentas_empresa')
      .select('*, plan_cuentas_base(codigo, nombre, nivel, tipo, naturaleza, acepta_movimiento)')
      .eq('empresa_id', empresaId)
      .order('codigo');
    if (data) setCuentas(data as any);
    setCargando(false);
  };

    useEffect(() => { cargar(); }, [empresaId]); // eslint-disable-line react-hooks/exhaustive-deps
  const abrirEditar = (cuenta: CuentaEmpresa) => {
    setEditando(cuenta);
    setForm({ codigo: cuenta.codigo, nombre: cuenta.nombre, activo: cuenta.activo });
  };

  const guardar = async () => {
    if (!editando) return;
    await supabase.from('plan_cuentas_empresa')
      .update(form).eq('id', editando.id);
    setEditando(null);
    setExito('Cuenta actualizada correctamente');
    setTimeout(() => setExito(''), 3000);
    cargar();
  };

  const cuentasFiltradas = cuentas.filter(c => {
    const base = c.plan_cuentas_base as any;
    if (filtroNivel && base?.nivel !== filtroNivel) return false;
    if (filtroTipo && base?.tipo !== filtroTipo) return false;
    if (!c.activo) return false;
    if (busqueda) {
      const b = busqueda.toLowerCase();
      return c.codigo.toLowerCase().includes(b) || c.nombre.toLowerCase().includes(b);
    }
    return true;
  });

  const stats = {
    total: cuentas.filter(c => c.activo).length,
    movimiento: cuentas.filter(c => c.activo && (c.plan_cuentas_base as any)?.acepta_movimiento).length,
    personalizadas: cuentas.filter(c => {
      const base = c.plan_cuentas_base as any;
      return c.codigo !== base?.codigo || c.nombre !== base?.nombre;
    }).length,
  };

  return (
    <>
      <style>{styles}</style>
      <div className="cat-wrap">
        <div className="cat-header">
          <div className="cat-title">
            Catálogo Contable
            <span>{cuentasFiltradas.length} cuentas</span>
          </div>
        </div>

        {exito && <div className="success-msg">✓ {exito}</div>}

        {/* Stats */}
        <div className="cat-stats">
          <div className="cat-stat">
            <span className="cat-stat-num">{stats.total}</span>
            <span className="cat-stat-label">Cuentas Activas</span>
          </div>
          <div className="cat-stat">
            <span className="cat-stat-num" style={{ color: '#16a34a' }}>{stats.movimiento}</span>
            <span className="cat-stat-label">Aceptan Movimiento</span>
          </div>
          <div className="cat-stat">
            <span className="cat-stat-num" style={{ color: '#f59e0b' }}>{stats.personalizadas}</span>
            <span className="cat-stat-label">Personalizadas</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="cat-toolbar">
          <input className="cat-search" placeholder="🔍 Buscar por código o nombre..."
            value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          <div className="cat-filters">
            {NIVELES.map(n => (
              <button key={n}
                className={`cat-filter-btn ${filtroNivel === n ? 'active' : ''}`}
                onClick={() => setFiltroNivel(filtroNivel === n ? null : n)}>
                Nivel {n}
              </button>
            ))}
          </div>
          <div className="cat-filters">
            {TIPOS.map(t => (
              <button key={t}
                className={`tipo-btn ${filtroTipo === t ? t : filtroTipo ? 'inactive' : t}`}
                onClick={() => setFiltroTipo(filtroTipo === t ? null : t)}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla */}
        <div className="cat-table-wrap">
          <table className="cat-table">
            <thead>
              <tr>
                <th>Código Empresa</th>
                <th>Nombre Empresa</th>
                <th>Código Base</th>
                <th>Nivel</th>
                <th>Tipo</th>
                <th>Naturaleza</th>
                <th>Movimiento</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan={8} className="cat-empty">Cargando catálogo...</td></tr>
              ) : cuentasFiltradas.length === 0 ? (
                <tr><td colSpan={8} className="cat-empty">No se encontraron cuentas</td></tr>
              ) : cuentasFiltradas.map(cuenta => {
                const base = cuenta.plan_cuentas_base as any;
                const personalizada = cuenta.codigo !== base?.codigo || cuenta.nombre !== base?.nombre;
                return (
                  <tr key={cuenta.id} className={`nivel-${base?.nivel}`}>
                    <td>
                      <span className="cat-codigo"
                        style={{ paddingLeft: `${(base?.nivel - 1) * 14}px` }}>
                        {cuenta.codigo}
                        {personalizada && <span className="cat-personalizada">MOD</span>}
                      </span>
                    </td>
                    <td>
                      <span className="cat-nombre"
                        style={{ paddingLeft: `${(base?.nivel - 1) * 14}px` }}>
                        {cuenta.nombre}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: '#9ca3af' }}>
                        {base?.codigo}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: '#6b7280' }}>Nivel {base?.nivel}</td>
                    <td><span className={`tipo-badge tipo-${base?.tipo}`}>{base?.tipo}</span></td>
                    <td style={{ fontSize: '12px', color: '#6b7280' }}>{base?.naturaleza}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={base?.acepta_movimiento ? 'mov-si' : 'mov-no'}>
                        {base?.acepta_movimiento ? '✓' : '·'}
                      </span>
                    </td>
                    <td>
                      <button className="btn-editar" onClick={() => abrirEditar(cuenta)}>
                        Editar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal edición */}
      {editando && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-title">Personalizar Cuenta</div>
            <div className="modal-sub">
              Modificando cuenta para esta empresa únicamente
            </div>
            <div className="modal-info">
              Código base: <span>{(editando.plan_cuentas_base as any)?.codigo}</span> —
              Nombre base: <span>{(editando.plan_cuentas_base as any)?.nombre}</span>
            </div>
            <div className="modal-field">
              <label className="modal-label">Código Personalizado</label>
              <input className="modal-input" value={form.codigo}
                onChange={e => setForm(p => ({ ...p, codigo: e.target.value }))} />
            </div>
            <div className="modal-field">
              <label className="modal-label">Nombre Personalizado</label>
              <input className="modal-input" value={form.nombre}
                onChange={e => setForm(p => ({ ...p, nombre: e.target.value.toUpperCase() }))} />
            </div>
            <label className="modal-check">
              <input type="checkbox" checked={form.activo}
                onChange={e => setForm(p => ({ ...p, activo: e.target.checked }))} />
              <span>Cuenta Activa para esta empresa</span>
            </label>
            <div className="modal-actions">
              <button className="btn-cancelar" onClick={() => setEditando(null)}>Cancelar</button>
              <button className="btn-guardar" onClick={guardar}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}