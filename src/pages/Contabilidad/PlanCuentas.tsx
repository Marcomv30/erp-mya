import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import FormCuenta from './FormCuenta';

interface Cuenta {
  id: number;
  codigo: string;
  nombre: string;
  nivel: number;
  tipo: string;
  naturaleza: string;
  acepta_movimiento: boolean;
  activo: boolean;
  padre_id: number | null;
}

const styles = `
  .pc-wrap { padding:0; }
  .pc-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
  .pc-title { font-size:20px; font-weight:600; color:#1f2937; letter-spacing:-0.3px; }
  .pc-title span { font-size:13px; font-weight:400; color:#9ca3af; margin-left:8px; }
  .pc-toolbar { display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin-bottom:18px; }
  .pc-search { padding:9px 14px; border:1px solid #e5e7eb; border-radius:9px;
    font-size:13px; color:#1f2937; outline:none; width:260px;
    font-family:'DM Sans',sans-serif; transition:border-color 0.2s; }
  .pc-search:focus { border-color:#22c55e; box-shadow:0 0 0 3px rgba(34,197,94,0.1); }
  .pc-filters { display:flex; gap:6px; flex-wrap:wrap; }
  .pc-filter-btn { padding:7px 14px; border-radius:8px; font-size:12px; font-weight:500;
    cursor:pointer; border:1px solid #e5e7eb; background:white; color:#6b7280;
    transition:all 0.15s; }
  .pc-filter-btn:hover { border-color:#22c55e; color:#16a34a; }
  .pc-filter-btn.active { background:#dcfce7; border-color:#22c55e; color:#16a34a; }
  .pc-tipo-filters { display:flex; gap:6px; flex-wrap:wrap; }
  .tipo-btn { padding:6px 12px; border-radius:7px; font-size:11px; font-weight:600;
    cursor:pointer; border:1px solid transparent; transition:all 0.15s; }
  .tipo-btn.ACTIVO { background:#dbeafe; color:#1d4ed8; border-color:#bfdbfe; }
  .tipo-btn.PASIVO { background:#fce7f3; color:#be185d; border-color:#fbcfe8; }
  .tipo-btn.CAPITAL { background:#ede9fe; color:#7c3aed; border-color:#ddd6fe; }
  .tipo-btn.INGRESO { background:#dcfce7; color:#16a34a; border-color:#bbf7d0; }
  .tipo-btn.GASTO { background:#fee2e2; color:#dc2626; border-color:#fecaca; }
  .tipo-btn.inactive { background:#f3f4f6; color:#9ca3af; border-color:#e5e7eb; }
  .pc-table-wrap { background:white; border-radius:14px; border:1px solid #e5e7eb;
    overflow-x:auto; box-shadow:0 1px 3px rgba(0,0,0,0.04); }
  .pc-table { width:100%; min-width:900px; border-collapse:collapse; }
  .pc-table thead { background:#f9fafb; position:sticky; top:0; z-index:1; }
  .pc-table th { padding:12px 16px; text-align:left; font-size:11px; font-weight:600;
    color:#6b7280; letter-spacing:0.06em; text-transform:uppercase;
    border-bottom:1px solid #e5e7eb; }
  .pc-table td { padding:10px 16px; font-size:13px; color:#374151;
    border-bottom:1px solid #f3f4f6; }
  .pc-table tr:last-child td { border-bottom:none; }
  .pc-table tr:hover td { background:#f9fafb; }
  .pc-mobile-list { display:none; }
  .pc-card { background:#fff; border:1px solid #e5e7eb; border-radius:10px; padding:12px; margin-bottom:8px; }
  .pc-card-head { display:flex; justify-content:space-between; gap:8px; margin-bottom:8px; }
  .pc-card-code { font-family:'DM Mono',monospace; font-size:12px; font-weight:600; color:#16a34a; }
  .pc-card-name { font-size:14px; font-weight:600; color:#1f2937; margin-bottom:8px; }
  .pc-card-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
  .pc-card-row { display:flex; flex-direction:column; gap:2px; }
  .pc-card-label { font-size:10px; color:#94a3b8; text-transform:uppercase; letter-spacing:.05em; }
  .pc-codigo { font-family:'DM Mono',monospace; font-size:12px; font-weight:500; }
  .pc-nombre { }
  .nivel-1 .pc-codigo { color:#1d4ed8; font-weight:700; }
  .nivel-1 .pc-nombre { font-weight:700; color:#1f2937; font-size:14px; }
  .nivel-2 .pc-codigo { color:#7c3aed; }
  .nivel-2 .pc-nombre { font-weight:600; color:#374151; }
  .nivel-3 .pc-codigo { color:#16a34a; }
  .nivel-3 .pc-nombre { font-weight:500; }
  .nivel-4 .pc-codigo { color:#d97706; }
  .nivel-5 .pc-codigo { color:#6b7280; }
  .nivel-5 td { background:#fafafa; }
  .pc-indent { display:inline-block; }
  .tipo-badge { display:inline-flex; align-items:center; padding:2px 8px;
    border-radius:5px; font-size:10px; font-weight:600; }
  .tipo-ACTIVO { background:#dbeafe; color:#1d4ed8; }
  .tipo-PASIVO { background:#fce7f3; color:#be185d; }
  .tipo-CAPITAL { background:#ede9fe; color:#7c3aed; }
  .tipo-INGRESO { background:#dcfce7; color:#16a34a; }
  .tipo-GASTO { background:#fee2e2; color:#dc2626; }
  .nat-badge { display:inline-flex; align-items:center; padding:2px 8px;
    border-radius:5px; font-size:10px; font-weight:600; }
  .nat-DEBITO { background:#fff7ed; color:#c2410c; }
  .nat-CREDITO { background:#f0fdf4; color:#166534; }
  .informe-badge { display:inline-flex; align-items:center; padding:2px 8px;
    border-radius:5px; font-size:10px; font-weight:500; }
  .informe-BALANCE { background:#eff6ff; color:#1e40af; }
  .informe-RESULTADOS { background:#fef9c3; color:#854d0e; }
  .mov-si { color:#16a34a; font-size:16px; }
  .mov-no { color:#e5e7eb; font-size:16px; }
  .pc-empty { padding:48px; text-align:center; color:#9ca3af; font-size:13px; }
  .pc-stats { display:flex; gap:12px; margin-bottom:18px; flex-wrap:wrap; }
  .pc-stat { background:white; border:1px solid #e5e7eb; border-radius:10px;
    padding:12px 16px; display:flex; flex-direction:column; gap:2px; }
  .pc-stat-num { font-size:20px; font-weight:700; color:#1f2937; }
  .pc-stat-label { font-size:11px; color:#9ca3af; font-weight:500; }
  .btn-nuevo { padding:10px 18px; background:linear-gradient(135deg,#16a34a,#22c55e);
    border:none; border-radius:10px; color:white; font-size:13px; font-weight:600;
    cursor:pointer; transition:opacity 0.2s; }
  .btn-nuevo:hover { opacity:0.9; }

  @media (max-width: 900px) {
    .pc-header { flex-wrap:wrap; gap:10px; }
    .pc-title { font-size:18px; }
    .btn-nuevo { width:100%; }
    .pc-search { width:100%; }
    .pc-toolbar { gap:8px; }
  }

  @media (max-width: 620px) {
    .pc-title span { display:block; margin-left:0; margin-top:2px; }
    .pc-stats { gap:8px; }
    .pc-stat { width:100%; }
    .pc-table-wrap { display:none; }
    .pc-mobile-list { display:block; }
  }
`;


const getInforme = (tipo: string) => {
  if (['ACTIVO', 'PASIVO', 'CAPITAL'].includes(tipo)) return 'BALANCE';
  return 'RESULTADOS';
};

const TIPOS = ['ACTIVO', 'PASIVO', 'CAPITAL', 'INGRESO', 'GASTO'];
const NIVELES = [1, 2, 3, 4, 5];

export default function PlanCuentas() {
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [filtroNivel, setFiltroNivel] = useState<number | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [vista, setVista] = useState<'lista' | 'nuevo' | 'editar'>('lista');
  const [cuentaEditar, setCuentaEditar] = useState<any>(null); 
  
  const cargar = async () => {
    setCargando(true);
    const { data } = await supabase
      .from('plan_cuentas_base')
      .select('*')
      .order('codigo');
    if (data) setCuentas(data);
    setCargando(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { cargar(); }, []);

  const cuentasFiltradas = cuentas.filter(c => {
    if (filtroNivel && c.nivel !== filtroNivel) return false;
    if (filtroTipo && c.tipo !== filtroTipo) return false;
    if (busqueda) {
      const b = busqueda.toLowerCase();
      return c.codigo.toLowerCase().includes(b) || c.nombre.toLowerCase().includes(b);
    }

    return true;
  });

  // Estadísticas
  const stats = {
    total: cuentas.length,
    movimiento: cuentas.filter(c => c.acepta_movimiento).length,
    balance: cuentas.filter(c => ['ACTIVO','PASIVO','CAPITAL'].includes(c.tipo)).length,
    resultados: cuentas.filter(c => ['INGRESO','GASTO'].includes(c.tipo)).length,
  };

    if (vista === 'nuevo') {
    return <FormCuenta
        cuenta={null}
        onGuardar={() => { setVista('lista'); cargar(); }}
        onCancelar={() => setVista('lista')}
    />;
    }

    if (vista === 'editar' && cuentaEditar) {
    return <FormCuenta
        cuenta={cuentaEditar}
        onGuardar={() => { setVista('lista'); cargar(); }}
        onCancelar={() => setVista('lista')}
    />;
    }

  return (
    <>
      <style>{styles}</style>
      <div className="pc-wrap">
        <div className="pc-header">
          <div className="pc-title">
            Plan de Cuentas
            <span>{cuentasFiltradas.length} de {cuentas.length} cuentas</span>
          </div>
          <button className="btn-nuevo" onClick={() => setVista('nuevo')}>
            + Nueva Cuenta
            </button>
        </div>

        {/* Estadísticas */}
        <div className="pc-stats">
          <div className="pc-stat">
            <span className="pc-stat-num">{stats.total}</span>
            <span className="pc-stat-label">Total Cuentas</span>
          </div>
          <div className="pc-stat">
            <span className="pc-stat-num" style={{ color: '#16a34a' }}>{stats.movimiento}</span>
            <span className="pc-stat-label">Aceptan Movimiento</span>
          </div>
          <div className="pc-stat">
            <span className="pc-stat-num" style={{ color: '#1e40af' }}>{stats.balance}</span>
            <span className="pc-stat-label">Balance General</span>
          </div>
          <div className="pc-stat">
            <span className="pc-stat-num" style={{ color: '#854d0e' }}>{stats.resultados}</span>
            <span className="pc-stat-label">Estado Resultados</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="pc-toolbar">
          <input className="pc-search" placeholder="🔍 Buscar por código o nombre..."
            value={busqueda} onChange={e => setBusqueda(e.target.value)} />

          <div className="pc-filters">
            {NIVELES.map(n => (
              <button key={n}
                className={`pc-filter-btn ${filtroNivel === n ? 'active' : ''}`}
                onClick={() => setFiltroNivel(filtroNivel === n ? null : n)}>
                Nivel {n}
              </button>
            ))}
          </div>

          <div className="pc-tipo-filters">
            {TIPOS.map(t => (
              <button key={t}
                className={`tipo-btn ${filtroTipo === t ? t : filtroTipo ? 'inactive' : t}`}
                onClick={() => setFiltroTipo(filtroTipo === t ? null : t)}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla Desktop */}
        <div className="pc-table-wrap">
          <table className="pc-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Nivel</th>
                <th>Tipo</th>
                <th>Naturaleza</th>
                <th>Informe</th>
                <th>Movimiento</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan={7} className="pc-empty">Cargando plan de cuentas...</td></tr>
              ) : cuentasFiltradas.length === 0 ? (
                <tr><td colSpan={7} className="pc-empty">No se encontraron cuentas</td></tr>
              ) : cuentasFiltradas.map(cuenta => (
                <tr key={cuenta.id} className={`nivel-${cuenta.nivel}`}>
                  <td>
                    <span className="pc-indent"
                      style={{ paddingLeft: `${(cuenta.nivel - 1) * 16}px` }}>
                      <span className="pc-codigo">{cuenta.codigo}</span>
                    </span>
                  </td>
                  <td>
                    <span className="pc-nombre"
                      style={{ paddingLeft: `${(cuenta.nivel - 1) * 16}px` }}>
                      {cuenta.nombre}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      Nivel {cuenta.nivel}
                    </span>
                  </td>
                  <td>
                    <span className={`tipo-badge tipo-${cuenta.tipo}`}>{cuenta.tipo}</span>
                  </td>
                  <td>
                    <span className={`nat-badge nat-${cuenta.naturaleza}`}>
                      {cuenta.naturaleza}
                    </span>
                  </td>
                  <td>
                    <span className={`informe-badge informe-${getInforme(cuenta.tipo)}`}>
                      {getInforme(cuenta.tipo)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={cuenta.acepta_movimiento ? 'mov-si' : 'mov-no'}>
                      {cuenta.acepta_movimiento ? '✓' : '·'}
                    </span>
                  </td>

                <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <button style={{ padding:'4px 10px', background:'#eff6ff', border:'1px solid #bfdbfe',
                        borderRadius:'6px', color:'#2563eb', fontSize:'11px', cursor:'pointer' }}
                        onClick={() => { setCuentaEditar(cuenta); setVista('editar'); }}>
                        Editar
                        </button>
                    </div>
                </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cards Mobile */}
        <div className="pc-mobile-list">
          {cargando ? (
            <div className="pc-empty">Cargando plan de cuentas...</div>
          ) : cuentasFiltradas.length === 0 ? (
            <div className="pc-empty">No se encontraron cuentas</div>
          ) : cuentasFiltradas.map((cuenta) => (
            <div key={`m-${cuenta.id}`} className={`pc-card nivel-${cuenta.nivel}`}>
              <div className="pc-card-head">
                <span className="pc-card-code">{cuenta.codigo}</span>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>Nivel {cuenta.nivel}</span>
              </div>
              <div className="pc-card-name">{cuenta.nombre}</div>
              <div className="pc-card-grid">
                <div className="pc-card-row">
                  <span className="pc-card-label">Tipo</span>
                  <span className={`tipo-badge tipo-${cuenta.tipo}`}>{cuenta.tipo}</span>
                </div>
                <div className="pc-card-row">
                  <span className="pc-card-label">Naturaleza</span>
                  <span className={`nat-badge nat-${cuenta.naturaleza}`}>{cuenta.naturaleza}</span>
                </div>
                <div className="pc-card-row">
                  <span className="pc-card-label">Informe</span>
                  <span className={`informe-badge informe-${getInforme(cuenta.tipo)}`}>{getInforme(cuenta.tipo)}</span>
                </div>
                <div className="pc-card-row">
                  <span className="pc-card-label">Movimiento</span>
                  <span style={{ color: cuenta.acepta_movimiento ? '#16a34a' : '#9ca3af', fontWeight: 600 }}>
                    {cuenta.acepta_movimiento ? 'SI' : 'NO'}
                  </span>
                </div>
              </div>
              <div style={{ marginTop: '10px' }}>
                <button
                  style={{
                    padding: '4px 10px',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '6px',
                    color: '#2563eb',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                  onClick={() => { setCuentaEditar(cuenta); setVista('editar'); }}
                >
                  Editar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
