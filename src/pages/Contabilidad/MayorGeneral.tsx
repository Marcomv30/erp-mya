import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

interface MovimientoMayor {
  fecha: string;
  asiento: string;
  categoria: string;
  cuenta: string;
  nombre: string;
  detalle: string;
  debe: number;
  haber: number;
  naturaleza: string;
  saldo?: number;
}

interface CuentaConMovimientos {
  codigo: string;
  nombre: string;
  saldo_anterior: number;
  movimientos: MovimientoMayor[];
  total_debe: number;
  total_haber: number;
  saldo_final: number;
}

const styles = `
  .mg-wrap { padding:0; }
  .mg-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
  .mg-title { font-size:20px; font-weight:600; color:#1f2937; letter-spacing:-0.3px; }
  .mg-filtros { background:white; border:1px solid #e5e7eb; border-radius:14px;
    padding:20px 24px; margin-bottom:20px; box-shadow:0 1px 3px rgba(0,0,0,0.04); }
  .mg-filtros-grid { display:grid; grid-template-columns:1fr 1fr 2fr auto; gap:16px; align-items:end; }
  .mg-group { display:flex; flex-direction:column; gap:5px; }
  .mg-label { font-size:11px; font-weight:500; color:#6b7280;
    letter-spacing:0.04em; text-transform:uppercase; }
  .mg-input { padding:9px 12px; border:1px solid #e5e7eb; border-radius:8px;
    font-size:13px; color:#1f2937; font-family:'DM Sans',sans-serif;
    outline:none; transition:border-color 0.2s; width:100%; }
  .mg-input:focus { border-color:#22c55e; box-shadow:0 0 0 3px rgba(34,197,94,0.1); }
  .btn-consultar { padding:10px 24px; background:linear-gradient(135deg,#16a34a,#22c55e);
    border:none; border-radius:10px; color:white; font-size:13px; font-weight:600;
    cursor:pointer; transition:opacity 0.2s; white-space:nowrap; }
  .btn-consultar:hover { opacity:0.9; }
  .btn-consultar:disabled { opacity:0.6; cursor:not-allowed; }

  /* Cuenta mayor */
  .cuenta-mayor { background:white; border:1px solid #e5e7eb; border-radius:14px;
    overflow:hidden; margin-bottom:16px; box-shadow:0 1px 3px rgba(0,0,0,0.04); }
  .cuenta-mayor-header { padding:14px 20px; background:#f0fdf4;
    border-bottom:1px solid #dcfce7; display:flex; align-items:center; gap:12px; }
  .cuenta-codigo { font-family:'DM Mono',monospace; font-size:13px; font-weight:700;
    color:#16a34a; }
  .cuenta-nombre { font-size:14px; font-weight:600; color:#1f2937; }
  .cuenta-saldo-ant { margin-left:auto; font-size:12px; color:#6b7280; }
  .cuenta-saldo-ant span { font-family:'DM Mono',monospace; font-weight:600;
    color:#1f2937; margin-left:4px; }

  /* Tabla movimientos */
  .mg-table { width:100%; border-collapse:collapse; }
  .mg-table th { padding:9px 14px; text-align:left; font-size:10px; font-weight:600;
    color:#6b7280; letter-spacing:0.06em; text-transform:uppercase;
    background:#f9fafb; border-bottom:1px solid #e5e7eb; }
  .mg-table th.right { text-align:right; }
  .mg-table td { padding:9px 14px; font-size:12px; color:#374151;
    border-bottom:1px solid #f9fafb; }
  .mg-table tr:last-child td { border-bottom:none; }
  .mg-table tr:hover td { background:#fafafa; }
  .mg-fecha { font-family:'DM Mono',monospace; font-size:11px; color:#6b7280; }
  .mg-asiento { font-family:'DM Mono',monospace; font-size:11px; font-weight:600;
    color:#2563eb; }
  .mg-cat { font-family:'DM Mono',monospace; font-size:10px; font-weight:600;
    background:#eff6ff; color:#1d4ed8; padding:2px 6px; border-radius:4px; }
  .mg-debe { text-align:right; font-family:'DM Mono',monospace; font-size:12px;
    color:#16a34a; font-weight:500; }
  .mg-haber { text-align:right; font-family:'DM Mono',monospace; font-size:12px;
    color:#dc2626; font-weight:500; }
  .mg-saldo { text-align:right; font-family:'DM Mono',monospace; font-size:12px;
    font-weight:600; color:#1f2937; }
  .mg-saldo.negativo { color:#dc2626; }

  /* Fila totales */
  .mg-totales { background:#f0fdf4; border-top:2px solid #22c55e; }
  .mg-totales td { padding:10px 14px; font-size:12px; font-weight:700; color:#1f2937; }
  .mg-totales .mg-debe { color:#16a34a; font-size:13px; }
  .mg-totales .mg-haber { color:#dc2626; font-size:13px; }
  .mg-totales .mg-saldo { font-size:13px; }

  /* Sumas iguales */
  .sumas-iguales { text-align:center; padding:4px 12px; border-radius:6px;
    font-size:11px; font-weight:600; margin-left:8px; }
  .sumas-ok { background:#dcfce7; color:#16a34a; }
  .sumas-error { background:#fee2e2; color:#dc2626; }

  .mg-empty { padding:48px; text-align:center; color:#9ca3af; font-size:13px; }
  .mg-loading { padding:48px; text-align:center; color:#16a34a; font-size:13px; }
  .mg-stats { display:flex; gap:12px; margin-bottom:16px; flex-wrap:wrap; }
  .mg-stat { background:white; border:1px solid #e5e7eb; border-radius:10px;
    padding:10px 16px; display:flex; flex-direction:column; gap:2px; }
  .mg-stat-num { font-size:18px; font-weight:700; font-family:'DM Mono',monospace; }
  .mg-stat-label { font-size:11px; color:#9ca3af; }

  /* Búsqueda cuenta */
  .cuenta-search-wrap { position:relative; }
  .cuenta-dropdown { position:absolute; top:100%; left:0; right:0; background:white;
    border:1px solid #e5e7eb; border-radius:8px; box-shadow:0 8px 24px rgba(0,0,0,0.12);
    z-index:100; max-height:200px; overflow-y:auto; }
  .cuenta-option { padding:8px 12px; cursor:pointer; font-size:12px;
    border-bottom:1px solid #f3f4f6; }
  .cuenta-option:hover { background:#f0fdf4; }
  .cuenta-option-codigo { font-family:'DM Mono',monospace; color:#16a34a; font-weight:600; }
`;

const fmt = (n: number) => Math.abs(n).toLocaleString('es-CR', { minimumFractionDigits: 2 });

export default function MayorGeneral({ empresaId }: { empresaId: number }) {
  const [fechaInicio, setFechaInicio] = useState(`${new Date().getFullYear()}-01-01`);
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);
  const [busquedaCuenta, setBusquedaCuenta] = useState('');
  const [cuentaFiltro, setCuentaFiltro] = useState<any>(null);
  const [resultados, setResultados] = useState<CuentaConMovimientos[]>([]);
  const [cargando, setCargando] = useState(false);
  const [consultado, setConsultado] = useState(false);
  const [cuentasDropdown, setCuentasDropdown] = useState<any[]>([]);
  const [dropdownAbierto, setDropdownAbierto] = useState(false);

  const buscarCuentas = async (q: string) => {
    setBusquedaCuenta(q);
    setCuentaFiltro(null);
    if (q.length < 2) { setCuentasDropdown([]); return; }
    const { data } = await supabase
      .from('plan_cuentas_base')
      .select('id, codigo, nombre')
      .eq('acepta_movimiento', true)
      .or(`codigo.ilike.%${q}%,nombre.ilike.%${q}%`)
      .limit(10);
    if (data) { setCuentasDropdown(data); setDropdownAbierto(true); }
  };

  const seleccionarCuenta = (cuenta: any) => {
    setCuentaFiltro(cuenta);
    setBusquedaCuenta(`${cuenta.codigo} — ${cuenta.nombre}`);
    setDropdownAbierto(false);
  };

  const consultar = async () => {
    setCargando(true);
    setConsultado(true);

    // Obtener movimientos del rango
    let query = supabase
      .from('v_mayor_general')
      .select('*')
      .eq('empresa_id', empresaId)
      .gte('fecha', fechaInicio)
      .lte('fecha', fechaFin)
      .order('cuenta')
      .order('fecha')
      .order('asiento_id');

    if (cuentaFiltro) {
      query = query.eq('cuenta', cuentaFiltro.codigo);
    }

    const { data: movimientos } = await query;

    if (!movimientos || movimientos.length === 0) {
      setResultados([]);
      setCargando(false);
      return;
    }

    // Agrupar por cuenta
    const cuentasMap = new Map<string, CuentaConMovimientos>();

    for (const mov of movimientos) {
      if (!cuentasMap.has(mov.cuenta)) {
        // Calcular saldo anterior (movimientos antes de fechaInicio)
        const { data: anterior } = await supabase
          .from('v_mayor_general')
          .select('debe, haber, naturaleza')
          .eq('empresa_id', empresaId)
          .eq('cuenta', mov.cuenta)
          .lt('fecha', fechaInicio);

        let saldoAnterior = 0;
        if (anterior) {
          for (const a of anterior) {
            if (a.naturaleza === 'DEBITO') {
              saldoAnterior += (Number(a.debe) || 0) - (Number(a.haber) || 0);
            } else {
              saldoAnterior += (Number(a.haber) || 0) - (Number(a.debe) || 0);
            }
          }
        }

        cuentasMap.set(mov.cuenta, {
          codigo: mov.cuenta,
          nombre: mov.nombre,
          saldo_anterior: saldoAnterior,
          movimientos: [],
          total_debe: 0,
          total_haber: 0,
          saldo_final: saldoAnterior,
        });
      }

      const cuenta = cuentasMap.get(mov.cuenta)!;
      const debe = Number(mov.debe) || 0;
      const haber = Number(mov.haber) || 0;

      // Calcular saldo corrido
      if (mov.naturaleza === 'DEBITO') {
        cuenta.saldo_final += debe - haber;
      } else {
        cuenta.saldo_final += haber - debe;
      }

      cuenta.movimientos.push({
        ...mov,
        debe,
        haber,
        saldo: cuenta.saldo_final,
      });

      cuenta.total_debe += debe;
      cuenta.total_haber += haber;
    }

    setResultados(Array.from(cuentasMap.values()));
    setCargando(false);
  };

  const totalDebe = resultados.reduce((s, c) => s + c.total_debe, 0);
  const totalHaber = resultados.reduce((s, c) => s + c.total_haber, 0);
  const sumasIguales = Math.abs(totalDebe - totalHaber) < 0.01;

  return (
    <>
      <style>{styles}</style>
      <div className="mg-wrap">
        <div className="mg-header">
          <div className="mg-title">Mayor General</div>
        </div>

        {/* Filtros */}
        <div className="mg-filtros">
          <div className="mg-filtros-grid">
            <div className="mg-group">
              <label className="mg-label">Fecha Inicio</label>
              <input className="mg-input" type="date" value={fechaInicio}
                onChange={e => setFechaInicio(e.target.value)} />
            </div>
            <div className="mg-group">
              <label className="mg-label">Fecha Fin</label>
              <input className="mg-input" type="date" value={fechaFin}
                onChange={e => setFechaFin(e.target.value)} />
            </div>
            <div className="mg-group">
              <label className="mg-label">Cuenta (opcional)</label>
              <div className="cuenta-search-wrap">
                <input className="mg-input" value={busquedaCuenta}
                  onChange={e => buscarCuentas(e.target.value)}
                  onFocus={() => cuentasDropdown.length > 0 && setDropdownAbierto(true)}
                  placeholder="Buscar por código o nombre... (vacío = todas)" />
                {dropdownAbierto && cuentasDropdown.length > 0 && (
                  <div className="cuenta-dropdown">
                    <div className="cuenta-option"
                      style={{ color: '#9ca3af', fontStyle: 'italic' }}
                      onClick={() => {
                        setCuentaFiltro(null);
                        setBusquedaCuenta('');
                        setDropdownAbierto(false);
                      }}>
                      Todas las cuentas
                    </div>
                    {cuentasDropdown.map(c => (
                      <div key={c.id} className="cuenta-option"
                        onClick={() => seleccionarCuenta(c)}>
                        <span className="cuenta-option-codigo">{c.codigo}</span>
                        <span style={{ marginLeft: '8px', color: '#374151' }}>{c.nombre}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <button className="btn-consultar" onClick={consultar} disabled={cargando}>
              {cargando ? 'Consultando...' : '🔍 Consultar'}
            </button>
          </div>
        </div>

        {/* Resultados */}
        {cargando && <div className="mg-loading">⏳ Consultando movimientos...</div>}

        {!cargando && consultado && resultados.length === 0 && (
          <div className="mg-empty">No hay movimientos en el rango de fechas seleccionado</div>
        )}

        {!cargando && resultados.length > 0 && (
          <>
            {/* Stats */}
            <div className="mg-stats">
              <div className="mg-stat">
                <span className="mg-stat-num">{resultados.length}</span>
                <span className="mg-stat-label">Cuentas con movimientos</span>
              </div>
              <div className="mg-stat">
                <span className="mg-stat-num" style={{ color: '#16a34a' }}>
                  ₡ {fmt(totalDebe)}
                </span>
                <span className="mg-stat-label">Total Débitos</span>
              </div>
              <div className="mg-stat">
                <span className="mg-stat-num" style={{ color: '#dc2626' }}>
                  ₡ {fmt(totalHaber)}
                </span>
                <span className="mg-stat-label">Total Créditos</span>
              </div>
              <div className="mg-stat">
                <span className={`sumas-iguales ${sumasIguales ? 'sumas-ok' : 'sumas-error'}`}
                  style={{ fontSize: '14px', padding: '8px 16px' }}>
                  {sumasIguales ? '✓ Sumas Iguales' : '⚠ Diferencia: ₡' + fmt(Math.abs(totalDebe - totalHaber))}
                </span>
              </div>
            </div>

            {/* Una tabla por cuenta */}
            {resultados.map(cuenta => (
              <div key={cuenta.codigo} className="cuenta-mayor">
                <div className="cuenta-mayor-header">
                  <span className="cuenta-codigo">{cuenta.codigo}</span>
                  <span className="cuenta-nombre">{cuenta.nombre}</span>
                  <span className="cuenta-saldo-ant">
                    Saldo Anterior:
                    <span className={cuenta.saldo_anterior < 0 ? 'negativo' : ''}>
                      {cuenta.saldo_anterior < 0 ? ' -' : ' '}₡ {fmt(cuenta.saldo_anterior)}
                    </span>
                  </span>
                </div>
                <table className="mg-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Asiento</th>
                      <th>Tipo</th>
                      <th>Detalle</th>
                      <th className="right">Debe ₡</th>
                      <th className="right">Haber ₡</th>
                      <th className="right">Saldo ₡</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Fila saldo anterior */}
                    {cuenta.saldo_anterior !== 0 && (
                      <tr style={{ background: '#fffbeb' }}>
                        <td className="mg-fecha">—</td>
                        <td><span style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: '#d97706' }}>SALDO ANT.</span></td>
                        <td></td>
                        <td style={{ color: '#d97706', fontSize: '11px' }}>Saldo anterior al período</td>
                        <td></td>
                        <td></td>
                        <td className={`mg-saldo ${cuenta.saldo_anterior < 0 ? 'negativo' : ''}`}>
                          {cuenta.saldo_anterior < 0 ? '-' : ''}₡ {fmt(cuenta.saldo_anterior)}
                        </td>
                      </tr>
                    )}
                    {cuenta.movimientos.map((mov, idx) => (
                      <tr key={idx}>
                        <td className="mg-fecha">{mov.fecha}</td>
                        <td className="mg-asiento">{mov.asiento}</td>
                        <td><span className="mg-cat">{mov.categoria}</span></td>
                        <td style={{ maxWidth: '300px', fontSize: '12px' }}>{mov.detalle}</td>
                        <td className="mg-debe">{mov.debe > 0 ? `₡ ${fmt(mov.debe)}` : ''}</td>
                        <td className="mg-haber">{mov.haber > 0 ? `₡ ${fmt(mov.haber)}` : ''}</td>
                        <td className={`mg-saldo ${(mov.saldo || 0) < 0 ? 'negativo' : ''}`}>
                          {(mov.saldo || 0) < 0 ? '-' : ''}₡ {fmt(mov.saldo || 0)}
                        </td>
                      </tr>
                    ))}
                    {/* Fila totales */}
                    <tr className="mg-totales">
                      <td colSpan={4} style={{ textAlign: 'right', color: '#6b7280' }}>
                        TOTALES
                      </td>
                      <td className="mg-debe">₡ {fmt(cuenta.total_debe)}</td>
                      <td className="mg-haber">₡ {fmt(cuenta.total_haber)}</td>
                      <td className={`mg-saldo ${cuenta.saldo_final < 0 ? 'negativo' : ''}`}>
                        {cuenta.saldo_final < 0 ? '-' : ''}₡ {fmt(cuenta.saldo_final)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ))}
          </>
        )}
      </div>
    </>
  );
}