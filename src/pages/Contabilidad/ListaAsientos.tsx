import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import FormAsiento from './FormAsiento';

interface Asiento {
  id: number;
  numero_formato: string;
  fecha: string;
  descripcion: string;
  moneda: string;
  tipo_cambio: number;
  estado: string;
  categoria_id: number;
  empresa_id: number;
  asiento_categorias: { codigo: string; descripcion: string };
}

interface CategoriaAsiento {
  id: number;
  codigo: string;
  descripcion: string;
  tipo_id: number | null;
}

interface TipoAsiento {
  id: number;
  codigo: string;
  nombre: string;
  color: string;
  activo: boolean;
}

interface ConsolidadoTipo {
  tipo_id: number;
  tipo_codigo: string;
  tipo_nombre: string;
  cantidad_asientos: number;
  total_debito_crc: number;
  total_credito_crc: number;
}

const styles = `
  .asi-wrap { padding:0; }
  .asi-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
  .asi-title { font-size:20px; font-weight:600; color:#1f2937; letter-spacing:-0.3px; }
  .asi-title span { font-size:13px; font-weight:400; color:#9ca3af; margin-left:8px; }
  .asi-toolbar { display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin-bottom:18px; }
  .asi-search { padding:9px 14px; border:1px solid #e5e7eb; border-radius:9px;
    font-size:13px; color:#1f2937; outline:none; width:240px;
    font-family:'DM Sans',sans-serif; transition:border-color 0.2s; }
  .asi-search:focus { border-color:#22c55e; box-shadow:0 0 0 3px rgba(34,197,94,0.1); }
  .asi-filtros { display:flex; gap:6px; flex-wrap:wrap; }
  .asi-filtro-btn { padding:7px 14px; border-radius:8px; font-size:12px; font-weight:500;
    cursor:pointer; border:1px solid #e5e7eb; background:white; color:#6b7280; transition:all 0.15s; }
  .asi-filtro-btn:hover { border-color:#22c55e; color:#16a34a; }
  .asi-filtro-btn.active { background:#dcfce7; border-color:#22c55e; color:#16a34a; }
  .asi-table-wrap { background:white; border-radius:14px; border:1px solid #e5e7eb;
    overflow-x:auto; box-shadow:0 1px 3px rgba(0,0,0,0.04); }
  .asi-table { width:100%; min-width:760px; border-collapse:collapse; }
  .asi-table thead { background:#f9fafb; }
  .asi-table th { padding:12px 16px; text-align:left; font-size:11px; font-weight:600;
    color:#6b7280; letter-spacing:0.06em; text-transform:uppercase; border-bottom:1px solid #e5e7eb; }
  .asi-table td { padding:12px 16px; font-size:13px; color:#374151; border-bottom:1px solid #f3f4f6; }
  .asi-table tr:last-child td { border-bottom:none; }
  .asi-table tr:hover td { background:#f9fafb; cursor:pointer; }
  .asi-mobile-list { display:none; }
  .asi-card { background:#fff; border:1px solid #e5e7eb; border-radius:10px; padding:12px; margin-bottom:8px; }
  .asi-card-head { display:flex; justify-content:space-between; gap:8px; margin-bottom:8px; }
  .asi-card-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:10px; }
  .asi-card-row { display:flex; flex-direction:column; gap:2px; }
  .asi-card-label { font-size:10px; color:#94a3b8; text-transform:uppercase; letter-spacing:.05em; }
  .asi-num { font-family:'DM Mono',monospace; font-weight:600; color:#16a34a; font-size:12px; }
  .asi-fecha { font-family:'DM Mono',monospace; font-size:12px; color:#6b7280; }
  .estado-badge { display:inline-flex; align-items:center; padding:3px 8px;
    border-radius:6px; font-size:11px; font-weight:600; }
  .estado-BORRADOR { background:#fef9c3; color:#854d0e; }
  .estado-CONFIRMADO { background:#dcfce7; color:#16a34a; }
  .estado-ANULADO { background:#fee2e2; color:#dc2626; }
  .cat-badge { display:inline-flex; align-items:center; padding:3px 8px;
    border-radius:6px; font-size:11px; font-weight:600;
    background:#eff6ff; color:#1d4ed8; font-family:'DM Mono',monospace; }
  .asi-actions { display:flex; gap:6px; }
  .btn-ver { padding:5px 10px; background:#f0fdf4; border:1px solid #bbf7d0;
    border-radius:6px; color:#16a34a; font-size:11px; font-weight:500; cursor:pointer; }
  .btn-ver:hover { background:#16a34a; color:white; }
  .btn-anular { padding:5px 10px; background:#fef2f2; border:1px solid #fecaca;
    border-radius:6px; color:#dc2626; font-size:11px; font-weight:500; cursor:pointer; }
  .btn-anular:hover { background:#dc2626; color:white; }
  .asi-empty { padding:48px; text-align:center; color:#9ca3af; font-size:13px; }
  .asi-stats { display:flex; gap:12px; margin-bottom:18px; flex-wrap:wrap; }
  .asi-stat { background:white; border:1px solid #e5e7eb; border-radius:10px;
    padding:12px 16px; display:flex; flex-direction:column; gap:2px; min-width:120px; }
  .asi-stat-num { font-size:20px; font-weight:700; color:#1f2937; }
  .asi-stat-label { font-size:11px; color:#9ca3af; font-weight:500; }
  .btn-nuevo { padding:10px 18px; background:linear-gradient(135deg,#16a34a,#22c55e);
    border:none; border-radius:10px; color:white; font-size:13px; font-weight:600;
    cursor:pointer; transition:opacity 0.2s; }
  .btn-nuevo:hover { opacity:0.9; }
  .anio-select { padding:8px 12px; border:1px solid #e5e7eb; border-radius:8px;
    font-size:13px; color:#1f2937; outline:none; font-family:'DM Sans',sans-serif; }

  @media (max-width: 900px) {
    .asi-header { flex-wrap:wrap; gap:10px; }
    .asi-title { font-size:18px; }
    .asi-toolbar { gap:8px; }
    .asi-search { width:100%; }
    .anio-select { width:100%; }
    .btn-nuevo { width:100%; }
    .asi-stats { gap:8px; }
    .asi-stat { min-width:calc(50% - 4px); padding:10px 12px; }
  }

  @media (max-width: 620px) {
    .asi-title span { display:block; margin-left:0; margin-top:2px; }
    .asi-stat { min-width:100%; }
    .asi-table-wrap { display:none; }
    .asi-mobile-list { display:block; }
    .asi-actions { flex-direction:column; align-items:stretch; }
    .btn-ver, .btn-anular { width:100%; text-align:center; }
  }
`;

export default function ListaAsientos({ empresaId }: { empresaId: number }) {
  const [asientos, setAsientos] = useState<Asiento[]>([]);
  const [categorias, setCategorias] = useState<CategoriaAsiento[]>([]);
  const [tipos, setTipos] = useState<TipoAsiento[]>([]);
  const [consolidado, setConsolidado] = useState<ConsolidadoTipo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [vista, setVista] = useState<'lista' | 'nuevo' | 'ver'>('lista');
  const [asientoVer, setAsientoVer] = useState<Asiento | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState<number | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [anio, setAnio] = useState(new Date().getFullYear());

  const cargar = async () => {
    setCargando(true);
    let query = supabase
      .from('asientos')
      .select('*, asiento_categorias(codigo, descripcion)')
      .eq('empresa_id', empresaId)
      .order('id', { ascending: false });

    const { data } = await query;
    if (data) setAsientos(data as any);
    setCargando(false);
  };

  const cargarCategorias = async () => {
    const { data } = await supabase
      .from('asiento_categorias')
      .select('id, codigo, descripcion, tipo_id')
      .eq('activo', true)
      .order('codigo');
    if (data) setCategorias(data as CategoriaAsiento[]);
  };

  const cargarTipos = async () => {
    const { data } = await supabase
      .from('asiento_tipos')
      .select('id, codigo, nombre, color, activo')
      .eq('activo', true)
      .order('orden')
      .order('codigo');
    if (data) setTipos(data as TipoAsiento[]);
  };

  const cargarConsolidado = async (anioTarget: number) => {
    const fechaDesde = `${anioTarget}-01-01`;
    const fechaHasta = `${anioTarget}-12-31`;
    const { data } = await supabase.rpc('reporte_asientos_por_tipo', {
      p_empresa_id: empresaId,
      p_fecha_desde: fechaDesde,
      p_fecha_hasta: fechaHasta,
    });
    setConsolidado((data || []) as ConsolidadoTipo[]);
  };

  useEffect(() => { cargar(); cargarCategorias(); cargarTipos(); }, [empresaId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { cargarConsolidado(anio); }, [empresaId, anio]); // eslint-disable-line react-hooks/exhaustive-deps

    const anular = async (asiento: Asiento) => {
      if (!window.confirm(`¿Anular el asiento ${asiento.numero_formato}?`)) return;
      
      // Revertir saldos primero
      await supabase.rpc('revertir_saldos_asiento', {
        p_asiento_id: asiento.id
      });
      
      // Luego anular
      await supabase.from('asientos').update({ estado: 'ANULADO' }).eq('id', asiento.id);
      cargar();
    };

  const asientosFiltrados = asientos.filter(a => {
    if (filtroEstado && a.estado !== filtroEstado) return false;
    if (filtroCategoria && a.categoria_id !== filtroCategoria) return false;
    if (filtroTipo) {
      const cat = categorias.find((c) => c.id === a.categoria_id);
      if (!cat || cat.tipo_id !== filtroTipo) return false;
    }
    if (busqueda) {
      const b = busqueda.toLowerCase();
      return a.numero_formato?.toLowerCase().includes(b) ||
        a.descripcion.toLowerCase().includes(b);
    }
    return true;
  });

  const stats = {
    total: asientos.length,
    borradores: asientos.filter(a => a.estado === 'BORRADOR').length,
    confirmados: asientos.filter(a => a.estado === 'CONFIRMADO').length,
    anulados: asientos.filter(a => a.estado === 'ANULADO').length,
  };

  if (vista === 'nuevo') {
    return <FormAsiento
      empresaId={empresaId}
      onGuardar={() => { setVista('lista'); cargar(); }}
      onCancelar={() => setVista('lista')}
    />;
  }

  if (vista === 'ver' && asientoVer) {
    return <FormAsiento
      empresaId={empresaId}
      asiento={asientoVer}
      onGuardar={() => { setVista('lista'); cargar(); }}
      onCancelar={() => setVista('lista')}
    />;
  }

  return (
    <>
      <style>{styles}</style>
      <div className="asi-wrap">
        <div className="asi-header">
          <div className="asi-title">
            Asientos Contables
            <span>{asientosFiltrados.length} registros</span>
          </div>
          <button className="btn-nuevo" onClick={() => setVista('nuevo')}>
            + Nuevo Asiento
          </button>
        </div>

        {/* Stats */}
        <div className="asi-stats">
          <div className="asi-stat">
            <span className="asi-stat-num">{stats.total}</span>
            <span className="asi-stat-label">Total</span>
          </div>
          <div className="asi-stat">
            <span className="asi-stat-num" style={{ color: '#854d0e' }}>{stats.borradores}</span>
            <span className="asi-stat-label">Borradores</span>
          </div>
          <div className="asi-stat">
            <span className="asi-stat-num" style={{ color: '#16a34a' }}>{stats.confirmados}</span>
            <span className="asi-stat-label">Confirmados</span>
          </div>
          <div className="asi-stat">
            <span className="asi-stat-num" style={{ color: '#dc2626' }}>{stats.anulados}</span>
            <span className="asi-stat-label">Anulados</span>
          </div>
        </div>

        <div className="asi-table-wrap" style={{ marginBottom: '14px' }}>
          <table className="asi-table">
            <thead>
              <tr>
                <th>Consolidado por Tipo ({anio})</th>
                <th>Asientos</th>
                <th>Debito CRC</th>
                <th>Credito CRC</th>
              </tr>
            </thead>
            <tbody>
              {consolidado.length === 0 ? (
                <tr><td colSpan={4} className="asi-empty">Sin movimientos confirmados para el año seleccionado</td></tr>
              ) : consolidado.map((row) => (
                <tr key={row.tipo_id}>
                  <td>
                    <span className="cat-badge">{row.tipo_codigo}</span>
                    <span style={{ marginLeft: '8px' }}>{row.tipo_nombre}</span>
                  </td>
                  <td style={{ fontFamily: 'DM Mono, monospace' }}>{row.cantidad_asientos}</td>
                  <td style={{ fontFamily: 'DM Mono, monospace' }}>{Number(row.total_debito_crc || 0).toLocaleString('es-CR', { minimumFractionDigits: 2 })}</td>
                  <td style={{ fontFamily: 'DM Mono, monospace' }}>{Number(row.total_credito_crc || 0).toLocaleString('es-CR', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Toolbar */}
        <div className="asi-toolbar">
          <input className="asi-search" placeholder="🔍 Buscar número o descripción..."
            value={busqueda} onChange={e => setBusqueda(e.target.value)} />

          <select className="anio-select" value={anio}
            onChange={e => setAnio(parseInt(e.target.value))}>
            {[2023, 2024, 2025, 2026].map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          <div className="asi-filtros">
            {['BORRADOR', 'CONFIRMADO', 'ANULADO'].map(e => (
              <button key={e}
                className={`asi-filtro-btn ${filtroEstado === e ? 'active' : ''}`}
                onClick={() => setFiltroEstado(filtroEstado === e ? null : e)}>
                {e}
              </button>
            ))}
          </div>

          <div className="asi-filtros">
            {tipos.map(tipo => (
              <button key={tipo.id}
                className={`asi-filtro-btn ${filtroTipo === tipo.id ? 'active' : ''}`}
                onClick={() => setFiltroTipo(filtroTipo === tipo.id ? null : tipo.id)}>
                {tipo.codigo}
              </button>
            ))}
          </div>

          <div className="asi-filtros">
            {categorias.map(cat => (
              <button key={cat.id}
                className={`asi-filtro-btn ${filtroCategoria === cat.id ? 'active' : ''}`}
                onClick={() => setFiltroCategoria(filtroCategoria === cat.id ? null : cat.id)}>
                {cat.codigo}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla Desktop */}
        <div className="asi-table-wrap">
          <table className="asi-table">
            <thead>
              <tr>
                <th>Número</th>
                <th>Categoría</th>
                <th>Fecha</th>
                <th>Descripción</th>
                <th>Moneda</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan={7} className="asi-empty">Cargando asientos...</td></tr>
              ) : asientosFiltrados.length === 0 ? (
                <tr><td colSpan={7} className="asi-empty">No hay asientos registrados</td></tr>
              ) : asientosFiltrados.map(asi => (
                <tr key={asi.id} onClick={() => { setAsientoVer(asi); setVista('ver'); }}>
                  <td><span className="asi-num">{asi.numero_formato}</span></td>
                  <td>
                    <span className="cat-badge">
                      {(asi.asiento_categorias as any)?.codigo}
                    </span>
                  </td>
                  <td><span className="asi-fecha">{asi.fecha}</span></td>
                  <td>{asi.descripcion}</td>
                  <td>
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '12px' }}>
                      {asi.moneda} {asi.moneda === 'USD' ? `TC: ${asi.tipo_cambio}` : ''}
                    </span>
                  </td>
                  <td>
                    <span className={`estado-badge estado-${asi.estado}`}>{asi.estado}</span>
                  </td>
                  <td>
                    <div className="asi-actions" onClick={e => e.stopPropagation()}>
                      <button className="btn-ver"
                        onClick={() => { setAsientoVer(asi); setVista('ver'); }}>
                        Ver
                      </button>
                      {asi.estado !== 'ANULADO' && asi.estado !== 'BORRADOR' && (
                        <button className="btn-anular" onClick={() => anular(asi)}>
                          Anular
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cards Mobile */}
        <div className="asi-mobile-list">
          {cargando ? (
            <div className="asi-empty">Cargando asientos...</div>
          ) : asientosFiltrados.length === 0 ? (
            <div className="asi-empty">No hay asientos registrados</div>
          ) : asientosFiltrados.map((asi) => (
            <div key={`m-${asi.id}`} className="asi-card" onClick={() => { setAsientoVer(asi); setVista('ver'); }}>
              <div className="asi-card-head">
                <span className="asi-num">{asi.numero_formato}</span>
                <span className={`estado-badge estado-${asi.estado}`}>{asi.estado}</span>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <span className="cat-badge">{(asi.asiento_categorias as any)?.codigo}</span>
              </div>
              <div className="asi-card-grid">
                <div className="asi-card-row">
                  <span className="asi-card-label">Fecha</span>
                  <span className="asi-fecha">{asi.fecha}</span>
                </div>
                <div className="asi-card-row">
                  <span className="asi-card-label">Moneda</span>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '12px' }}>
                    {asi.moneda} {asi.moneda === 'USD' ? `TC: ${asi.tipo_cambio}` : ''}
                  </span>
                </div>
              </div>
              <div style={{ marginBottom: '10px', fontSize: '13px', color: '#374151' }}>{asi.descripcion}</div>
              <div className="asi-actions" onClick={(e) => e.stopPropagation()}>
                <button className="btn-ver" onClick={() => { setAsientoVer(asi); setVista('ver'); }}>Ver</button>
                {asi.estado !== 'ANULADO' && asi.estado !== 'BORRADOR' && (
                  <button className="btn-anular" onClick={() => anular(asi)}>Anular</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
