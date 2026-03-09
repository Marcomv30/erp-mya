import React, { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../supabase';
import { exportCsv, exportExcelXml, exportPdfWithPrint, ReportColumn, roundMoney, sumMoney } from '../../utils/reporting';
import ListToolbar from '../../components/ListToolbar';

interface RowEstado {
  cuenta: string;
  nombre: string;
  tipo: 'INGRESO' | 'COSTO' | 'GASTO' | string;
  nivel: number;
  debe: number;
  haber: number;
  neto: number;
}

const styles = `
  .er-wrap { padding:0; }
  .er-title { font-size:20px; font-weight:600; color:#1f2937; margin-bottom:14px; }
  .er-grid { display:grid; grid-template-columns:170px 170px 120px 90px auto 1fr; gap:10px; margin-bottom:14px; }
  .er-input { width:100%; padding:9px 10px; border:1px solid #e5e7eb; border-radius:8px; font-size:13px; outline:none; }
  .er-input:focus { border-color:#22c55e; box-shadow:0 0 0 3px rgba(34,197,94,0.1); }
  .er-btn { padding:9px 14px; border-radius:8px; border:none; font-size:13px; font-weight:600; cursor:pointer; color:#fff; background:linear-gradient(135deg,#16a34a,#22c55e); }
  .er-toolbar { margin-bottom:10px; }
  .er-export-btn { padding:7px 12px; border-radius:8px; border:1px solid #e5e7eb; background:#fff; color:#334155; font-size:12px; font-weight:600; cursor:pointer; }
  .er-export-btn:hover { border-color:#22c55e; color:#16a34a; background:#f0fdf4; }
  .er-cards { display:grid; grid-template-columns:repeat(4,minmax(160px,1fr)); gap:10px; margin-bottom:12px; }
  .er-card { background:#fff; border:1px solid #e5e7eb; border-radius:10px; padding:10px 12px; }
  .er-card-num { font-size:18px; font-weight:700; font-family:'DM Mono',monospace; }
  .er-card-lbl { font-size:11px; color:#94a3b8; text-transform:uppercase; letter-spacing:.04em; }
  .er-card.ing .er-card-num { color:#16a34a; }
  .er-card.cos .er-card-num { color:#b45309; }
  .er-card.gas .er-card-num { color:#dc2626; }
  .er-card.utl .er-card-num { color:#1d4ed8; }
  .er-card.utl.neg .er-card-num { color:#dc2626; }
  .er-card-wrap { background:#fff; border:1px solid #e5e7eb; border-radius:12px; overflow-x:auto; overflow-y:hidden; }
  .er-table { width:100%; min-width:980px; border-collapse:collapse; table-layout:fixed; }
  .er-table th { background:#f8fafc; padding:9px 10px; font-size:10px; color:#64748b; text-transform:uppercase; letter-spacing:.05em; text-align:left; }
  .er-table td { padding:8px 10px; font-size:12px; color:#334155; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .er-right { text-align:right !important; }
  .er-money { font-family:'DM Mono',monospace; }
  .er-row-n1 td { background:#dbeafe; }
  .er-row-n2 td { background:#e0f2fe; }
  .er-row-n3 td { background:#ecfeff; }
  .er-row-n4 td { background:#f0f9ff; }
  .er-row-n5 td { background:#f8fafc; }
  .er-chip { display:inline-flex; align-items:center; justify-content:center; min-width:22px; height:22px; border-radius:999px; font-size:11px; font-weight:700; font-family:'DM Mono',monospace; background:#bfdbfe; color:#1e3a8a; }
  .er-tag { display:inline-flex; align-items:center; padding:3px 8px; border-radius:999px; font-size:11px; font-weight:700; font-family:'DM Mono',monospace; }
  .er-tag.INGRESO { background:#dcfce7; color:#166534; }
  .er-tag.COSTO { background:#ffedd5; color:#9a3412; }
  .er-tag.GASTO { background:#fee2e2; color:#991b1b; }
  .er-link-btn { padding:5px 8px; border-radius:7px; border:1px solid #bfdbfe; background:#eff6ff; color:#1d4ed8; font-size:11px; font-weight:600; cursor:pointer; }
  .er-total td { background:#f0fdf4; font-weight:700; }
  .er-empty { padding:24px; text-align:center; color:#94a3b8; font-size:13px; }
  .er-error { margin-bottom:10px; background:#fef2f2; border:1px solid #fecaca; color:#b91c1c; border-radius:8px; padding:10px 12px; font-size:12px; }
  .er-modal-backdrop { position:fixed; inset:0; z-index:60; background:rgba(15,23,42,.38); display:flex; align-items:center; justify-content:center; padding:16px; }
  .er-modal { width:min(560px,100%); background:#fff; border:1px solid #e5e7eb; border-radius:12px; box-shadow:0 24px 45px rgba(2,6,23,.2); overflow:hidden; }
  .er-modal-head { padding:12px 14px; background:#f8fafc; border-bottom:1px solid #e5e7eb; font-size:16px; font-weight:700; color:#0f172a; }
  .er-modal-body { padding:14px; font-size:13px; color:#334155; line-height:1.45; }
  .er-modal-actions { padding:12px 14px; border-top:1px solid #e5e7eb; display:flex; justify-content:flex-end; gap:8px; }
  .er-btn-secondary { padding:9px 14px; border-radius:8px; border:1px solid #d1d5db; background:#fff; font-size:13px; font-weight:600; color:#374151; cursor:pointer; }
  .er-btn-secondary:hover { border-color:#22c55e; color:#166534; background:#f0fdf4; }
`;

const toMoney = (n: number, moneda: 'CRC' | 'USD') =>
  `${moneda === 'USD' ? '$' : '₡'} ${roundMoney(n, 2).toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const approxZero = (n: number) => Math.abs(Number(n || 0)) < 0.000001;

function inferCustomLevel(code: string): number | null {
  const c = String(code || '').trim();
  if (/^\d{2}$/.test(c)) return 1;
  if (/^\d{4}$/.test(c)) return 2;
  if (/^\d{4}-\d{2}$/.test(c)) return 3;
  if (/^\d{4}-\d{2}-\d{3}$/.test(c)) return 4;
  if (/^\d{4}-\d{2}-\d{3}-\d{3}$/.test(c)) return 5;
  return null;
}

function normalizeToLevel(codigo: string, targetLevel: number): string {
  const customLevel = inferCustomLevel(codigo);
  const c = String(codigo || '').trim();
  if (customLevel !== null) {
    const l = Math.max(1, Math.min(5, targetLevel));
    if (l >= customLevel) return c;
    if (l === 1) return c.slice(0, 2);
    if (l === 2) return c.slice(0, 4);
    if (l === 3) return c.slice(0, 7);
    if (l === 4) return c.slice(0, 11);
  }
  return c;
}

function inferLevelFromCode(codigo: string): number {
  return inferCustomLevel(codigo) || 1;
}

export default function EstadoResultados({
  empresaId,
  onVerMovimientos,
  onVerAsientoCierre,
}: {
  empresaId: number;
  onVerMovimientos?: (payload: { cuenta: string; nombre?: string; desde: string; hasta: string; moneda: 'CRC' | 'USD'; origen?: 'balancecomprobacion' | 'estadoderesultados' }) => void;
  onVerAsientoCierre?: (asientoId: number) => void;
}) {
  const today = new Date();
  const [desde, setDesde] = useState(`${today.getFullYear()}-01-01`);
  const [hasta, setHasta] = useState(today.toISOString().slice(0, 10));
  const [moneda, setMoneda] = useState<'CRC' | 'USD'>('CRC');
  const [nivelVista, setNivelVista] = useState(5);
  const [rowsBase, setRowsBase] = useState<RowEstado[]>([]);
  const [catalogoNombre, setCatalogoNombre] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState('');
  const [closeMsg, setCloseMsg] = useState('');
  const [closeAsientoId, setCloseAsientoId] = useState<number | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const reqRef = useRef(0);

  const formatIsoDate = (value: string) => {
    const [y, m, d] = String(value || '').split('-');
    if (!y || !m || !d) return value;
    return `${d}/${m}/${y}`;
  };

  const cargar = async () => {
    if (desde && hasta && desde > hasta) {
      setError('Rango de fechas invalido: "Desde" no puede ser mayor que "Hasta".');
      setRowsBase([]);
      return;
    }
    const reqId = ++reqRef.current;
    setLoading(true);
    setError('');
    const { data, error: rpcError } = await supabase.rpc('get_estado_resultados', {
      p_empresa_id: empresaId,
      p_fecha_desde: desde || null,
      p_fecha_hasta: hasta || null,
      p_moneda: moneda,
    });
    if (reqId !== reqRef.current) return;
    if (rpcError) {
      setError(rpcError.message || 'No se pudo cargar el Estado de Resultados');
      setRowsBase([]);
    } else {
      setRowsBase((data || []) as RowEstado[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    const t = setTimeout(() => cargar(), 350);
    return () => clearTimeout(t);
  }, [empresaId, desde, hasta, moneda]); // eslint-disable-line react-hooks/exhaustive-deps

  const cargarCatalogo = async () => {
    const [baseResp, empResp] = await Promise.all([
      supabase.from('plan_cuentas_base').select('codigo, nombre'),
      supabase.from('plan_cuentas_empresa').select('codigo, nombre').eq('empresa_id', empresaId),
    ]);
    const map: Record<string, string> = {};
    (baseResp.data || []).forEach((r: any) => { if (r?.codigo) map[String(r.codigo)] = String(r.nombre || ''); });
    (empResp.data || []).forEach((r: any) => {
      if (!r?.codigo) return;
      const code = String(r.codigo);
      if (!map[code]) map[code] = String(r.nombre || '');
    });
    setCatalogoNombre(map);
  };

  useEffect(() => {
    cargarCatalogo();
  }, [empresaId]); // eslint-disable-line react-hooks/exhaustive-deps

  const rows = useMemo(() => {
    const lvl = Math.max(1, Math.min(5, Number(nivelVista) || 5));
    const map = new Map<string, RowEstado>();
    for (const r of rowsBase) {
      const originalLevel = inferLevelFromCode(r.cuenta) || Number(r.nivel) || 1;
      const topLevel = Math.min(originalLevel, lvl);
      for (let current = topLevel; current >= 1; current -= 1) {
        const key = normalizeToLevel(r.cuenta, current);
        const prev = map.get(key);
        if (!prev) {
          const nombreNivel =
            catalogoNombre[key]
            || rowsBase.find((x) => String(x.cuenta) === key)?.nombre
            || r.nombre
            || key;
          map.set(key, {
            cuenta: key,
            nombre: nombreNivel,
            tipo: r.tipo,
            nivel: current,
            debe: Number(r.debe || 0),
            haber: Number(r.haber || 0),
            neto: Number(r.neto || 0),
          });
        } else {
          prev.debe += Number(r.debe || 0);
          prev.haber += Number(r.haber || 0);
          prev.neto += Number(r.neto || 0);
        }
      }
    }
    return Array.from(map.values())
      .filter((r) => !(approxZero(r.debe) && approxZero(r.haber) && approxZero(r.neto)))
      .sort((a, b) => String(a.cuenta).localeCompare(String(b.cuenta)));
  }, [rowsBase, nivelVista, catalogoNombre]);

  const rowsNivel = useMemo(() => {
    const n = Math.max(1, Math.min(5, Number(nivelVista) || 5));
    return rows.filter((r) => Number(r.nivel) === n);
  }, [rows, nivelVista]);

  const ingresos = sumMoney(rowsNivel.filter((r) => r.tipo === 'INGRESO').map((r) => Number(r.neto || 0)), 2);
  const costos = sumMoney(rowsNivel.filter((r) => r.tipo === 'COSTO').map((r) => Number(r.neto || 0)), 2);
  const gastos = sumMoney(rowsNivel.filter((r) => r.tipo === 'GASTO').map((r) => Number(r.neto || 0)), 2);
  const utilidad = roundMoney(ingresos - costos - gastos, 2);

  const columns: ReportColumn<RowEstado>[] = [
    { key: 'cuenta', title: 'Cuenta', getValue: (r) => r.cuenta, align: 'left', width: '14%' },
    { key: 'nombre', title: 'Nombre', getValue: (r) => r.nombre, align: 'left', width: '28%' },
    { key: 'tipo', title: 'Tipo', getValue: (r) => r.tipo, width: '10%' },
    { key: 'debe', title: 'Debe', getValue: (r) => Number(r.debe || 0).toFixed(2), align: 'right', width: '12%' },
    { key: 'haber', title: 'Haber', getValue: (r) => Number(r.haber || 0).toFixed(2), align: 'right', width: '12%' },
    { key: 'neto', title: 'Neto', getValue: (r) => Number(r.neto || 0).toFixed(2), align: 'right', width: '12%' },
    { key: 'nivel', title: 'Nivel', getValue: (r) => r.nivel, width: '6%' },
  ];

  const generarCierre = async () => {
    if (closing) return;
    if (!desde || !hasta) {
      setError('Defina fecha inicial y fecha final para generar el cierre.');
      return;
    }
    if (desde > hasta) {
      setError('Rango de fechas invalido: "Desde" no puede ser mayor que "Hasta".');
      return;
    }
    setShowCloseConfirm(true);
  };

  const confirmarGenerarCierre = async () => {
    if (closing) return;

    setClosing(true);
    setShowCloseConfirm(false);
    setError('');
    setCloseMsg('');
    setCloseAsientoId(null);

    const { data, error: rpcError } = await supabase.rpc('generar_cierre_estado_resultados', {
      p_empresa_id: empresaId,
      p_fecha_desde: desde,
      p_fecha_hasta: hasta,
      p_moneda: moneda,
    });

    if (rpcError) {
      setError(rpcError.message || 'No se pudo generar el cierre automatico.');
      setClosing(false);
      return;
    }

    const nuevoAsientoId = Number(data || 0);
    setCloseAsientoId(nuevoAsientoId > 0 ? nuevoAsientoId : null);
    setCloseMsg(`Cierre generado correctamente. Asiento ID: ${nuevoAsientoId}.`);
    await cargar();
    setClosing(false);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="er-wrap">
        <div className="er-title">Estado de Resultados</div>

        <div className="er-grid">
          <input className="er-input" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          <input className="er-input" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          <select className="er-input" value={moneda} onChange={(e) => setMoneda(e.target.value as 'CRC' | 'USD')}>
            <option value="CRC">CRC</option>
            <option value="USD">USD</option>
          </select>
          <input className="er-input" type="number" min={1} max={5} step={1} value={nivelVista} onChange={(e) => setNivelVista(Math.max(1, Math.min(5, Number(e.target.value) || 5)))} />
          <button className="er-btn" onClick={cargar} disabled={loading}>{loading ? 'Cargando...' : 'Actualizar'}</button>
          <button className="er-btn" onClick={generarCierre} disabled={closing || loading}>
            {closing ? 'Generando...' : 'Generar Cierre'}
          </button>
        </div>

        <ListToolbar
          className="er-toolbar"
          exports={(
            <>
              <button className="er-export-btn" onClick={() => exportCsv(`estado_resultados_${empresaId}.csv`, rows, columns)} disabled={rows.length === 0}>CSV</button>
              <button className="er-export-btn" onClick={() => exportExcelXml(`estado_resultados_${empresaId}.xls`, rows, columns)} disabled={rows.length === 0}>EXCEL</button>
              <button
                className="er-export-btn"
                onClick={() => exportPdfWithPrint({
                  title: 'Estado de Resultados',
                  subtitle: `Desde ${desde} Hasta ${hasta} - ${moneda} - Nivel ${nivelVista}`,
                  rows,
                  columns,
                  orientation: 'landscape',
                })}
                disabled={rows.length === 0}
              >
                PDF
              </button>
            </>
          )}
        />

        <div className="er-cards">
          <div className="er-card ing"><div className="er-card-num">{toMoney(ingresos, moneda)}</div><div className="er-card-lbl">Ingresos</div></div>
          <div className="er-card cos"><div className="er-card-num">{toMoney(costos, moneda)}</div><div className="er-card-lbl">Costos</div></div>
          <div className="er-card gas"><div className="er-card-num">{toMoney(gastos, moneda)}</div><div className="er-card-lbl">Gastos</div></div>
          <div className={`er-card utl ${utilidad < 0 ? 'neg' : ''}`}><div className="er-card-num">{toMoney(utilidad, moneda)}</div><div className="er-card-lbl">Utilidad Neta</div></div>
        </div>

        {error && <div className="er-error">Error: {error}</div>}
        {closeMsg && (
          <div style={{ marginBottom: 10, background: '#ecfdf5', border: '1px solid #bbf7d0', color: '#166534', borderRadius: 8, padding: '10px 12px', fontSize: 12 }}>
            <div>{closeMsg}</div>
            {closeAsientoId ? (
              <button
                className="er-link-btn"
                style={{ marginTop: 8 }}
                onClick={() => onVerAsientoCierre?.(closeAsientoId)}
              >
                Ver Asiento
              </button>
            ) : null}
          </div>
        )}

        <div className="er-card-wrap">
          <table className="er-table">
            <thead>
              <tr>
                <th>Cuenta</th>
                <th>Nombre</th>
                <th>Tipo</th>
                <th className="er-right">Moneda</th>
                <th className="er-right">Debe</th>
                <th className="er-right">Haber</th>
                <th className="er-right">Neto</th>
                <th className="er-right">Nivel</th>
                <th className="er-right">Accion</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={9} className="er-empty">No hay datos en el rango seleccionado</td></tr>
              ) : (
                <>
                  {rows.map((r, i) => (
                    <tr key={`${r.cuenta}-${i}`} className={`er-row-n${Math.max(1, Math.min(5, Number(r.nivel) || 5))}`}>
                      <td style={{ fontFamily: 'DM Mono, monospace', color: '#166534' }}>{r.cuenta}</td>
                      <td>{String(r.nombre || '').toUpperCase()}</td>
                      <td><span className={`er-tag ${r.tipo}`}>{r.tipo}</span></td>
                      <td className="er-right er-money">{moneda}</td>
                      <td className="er-right er-money">{toMoney(r.debe, moneda)}</td>
                      <td className="er-right er-money">{toMoney(r.haber, moneda)}</td>
                      <td className="er-right er-money">{toMoney(r.neto, moneda)}</td>
                      <td className="er-right"><span className="er-chip">{r.nivel}</span></td>
                      <td className="er-right">
                        {Number(r.nivel) === 5 ? (
                          <button
                            className="er-link-btn"
                            onClick={() => onVerMovimientos?.({
                              cuenta: String(r.cuenta || ''),
                              nombre: String(r.nombre || ''),
                              desde,
                              hasta,
                              moneda,
                              origen: 'estadoderesultados',
                            })}
                            title="Ver movimientos de esta cuenta en Mayor General"
                          >
                            Ver
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                  <tr className="er-total">
                    <td colSpan={6}>UTILIDAD NETA</td>
                    <td className="er-right er-money">{toMoney(utilidad, moneda)}</td>
                    <td />
                    <td />
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCloseConfirm && (
        <div className="er-modal-backdrop" onClick={() => (!closing ? setShowCloseConfirm(false) : null)}>
          <div className="er-modal" onClick={(e) => e.stopPropagation()}>
            <div className="er-modal-head">Confirmar cierre de resultados</div>
            <div className="er-modal-body">
              {`Se generara un asiento de cierre de resultados en ${moneda} para el rango ${formatIsoDate(desde)} a ${formatIsoDate(hasta)}.`}
            </div>
            <div className="er-modal-actions">
              <button className="er-btn-secondary" onClick={() => setShowCloseConfirm(false)} disabled={closing}>
                Cancelar
              </button>
              <button className="er-btn" onClick={confirmarGenerarCierre} disabled={closing}>
                {closing ? 'Generando...' : 'Confirmar cierre'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
