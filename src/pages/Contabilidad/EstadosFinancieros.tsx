import React, { useEffect, useState } from 'react';
import BalanceSituacion from './BalanceSituacion';
import EstadoResultados from './EstadoResultados';
import { supabase } from '../../supabase';

type EeffTab = 'balancesituacion' | 'estadoderesultados' | 'flujoefectivo' | 'capital';

const styles = `
  .eeff-wrap { padding:0; }
  .eeff-title { font-size:20px; font-weight:600; color:#1f2937; margin-bottom:12px; }
  .eeff-bar { display:grid; grid-template-columns:170px 170px 120px auto 1fr; gap:10px; margin-bottom:12px; }
  .eeff-input { width:100%; padding:9px 10px; border:1px solid #e5e7eb; border-radius:8px; font-size:13px; outline:none; background:#fff; }
  .eeff-input:focus { border-color:#22c55e; box-shadow:0 0 0 3px rgba(34,197,94,.12); }
  .eeff-btn {
    border:none; background:linear-gradient(135deg,#16a34a,#22c55e); color:#fff;
    border-radius:8px; padding:9px 14px; font-size:13px; font-weight:600; cursor:pointer;
  }
  .eeff-tabs { display:flex; gap:8px; margin-bottom:12px; flex-wrap:wrap; }
  .eeff-tab {
    border:1px solid #d1d5db; background:#fff; color:#374151;
    border-radius:10px; padding:8px 12px; font-size:13px; font-weight:600; cursor:pointer;
  }
  .eeff-tab.active {
    border-color:#22c55e; background:#f0fdf4; color:#166534;
    box-shadow:0 0 0 3px rgba(34,197,94,.12);
  }
  .eeff-note {
    border:1px solid #e5e7eb; background:#fff; border-radius:12px; padding:14px; color:#475569; font-size:13px;
  }
  .eeff-note h4 { margin:0 0 8px; font-size:15px; color:#0f172a; }
  .eeff-note p { margin:0; line-height:1.45; }
  .eeff-chip {
    display:inline-flex; align-items:center; gap:6px; border-radius:999px;
    border:1px solid #d1d5db; background:#fff; color:#334155; padding:6px 10px; font-size:12px; font-weight:700;
  }
  .eeff-chip.preliminar { border-color:#f59e0b; background:#fffbeb; color:#92400e; }
  .eeff-chip.oficial { border-color:#22c55e; background:#f0fdf4; color:#166534; }
  .eeff-table-wrap { border:1px solid #e5e7eb; border-radius:12px; overflow:hidden; background:#fff; }
  .eeff-table { width:100%; border-collapse:collapse; }
  .eeff-table th { background:#f8fafc; padding:9px 10px; font-size:11px; color:#64748b; text-transform:uppercase; letter-spacing:.05em; text-align:left; }
  .eeff-table td { padding:8px 10px; border-top:1px solid #f1f5f9; font-size:13px; color:#334155; }
  .eeff-right { text-align:right; font-family:'DM Mono',monospace; }
  .eeff-error { margin:8px 0 0; color:#b91c1c; font-size:12px; }
`;

type EeffContext = {
  cierre_activo: boolean;
  cierre_fecha_inicio: string | null;
  cierre_fecha_fin: string | null;
  estado_corte: string;
  es_preliminar: boolean;
};

type FlujoRow = {
  categoria: string;
  concepto: string;
  monto: number;
  orden: number;
};

type CapitalRow = {
  concepto: string;
  monto: number;
  orden: number;
};

type CapitalDetalleRow = {
  fecha: string;
  asiento_id: number;
  numero_formato: string;
  descripcion: string;
  clasificacion: string;
  monto: number;
};

const capitalConceptoLabel = (concepto: string) => {
  const key = String(concepto || '').toUpperCase();
  if (key.includes('CAPITAL INICIAL')) return 'Capital inicial';
  if (key.includes('UTILIDAD DEL PERIODO')) return 'Resultado del periodo';
  if (key.includes('MOVIMIENTOS DIRECTOS')) return 'Aportes / retiros / dividendos';
  if (key.includes('AJUSTE CONCILIACION')) return 'Ajuste de conciliacion (tecnico)';
  if (key.includes('CAPITAL FINAL')) return 'Capital final';
  return concepto;
};

const capitalClasificacionLabel = (clasificacion: string) => {
  const key = String(clasificacion || '').toUpperCase();
  if (key === 'APORTE') return 'Aporte de socios';
  if (key === 'RETIRO') return 'Retiro de socios';
  if (key === 'DIVIDENDO') return 'Dividendo';
  if (key === 'MOVIMIENTO_CAPITAL') return 'Movimiento de capital';
  if (key === 'OTRO_CAPITAL') return 'Otro movimiento de capital';
  if (key === 'CIERRE_RESULTADOS') return 'Cierre de resultados';
  return clasificacion;
};

export default function EstadosFinancieros({
  empresaId,
  onVerMovimientos,
  onVerAsientoCierre,
}: {
  empresaId: number;
  onVerMovimientos?: (payload: { cuenta: string; nombre?: string; desde: string; hasta: string; moneda: 'CRC' | 'USD'; origen?: 'balancecomprobacion' | 'estadoderesultados' | 'balancesituacion' }) => void;
  onVerAsientoCierre?: (asientoId: number) => void;
}) {
  const [tab, setTab] = useState<EeffTab>('balancesituacion');
  const today = new Date();
  const [fechaDesde, setFechaDesde] = useState(`${today.getFullYear()}-01-01`);
  const [fechaHasta, setFechaHasta] = useState(today.toISOString().slice(0, 10));
  const [moneda, setMoneda] = useState<'CRC' | 'USD'>('CRC');
  const [ctx, setCtx] = useState<EeffContext | null>(null);
  const [ctxError, setCtxError] = useState('');
  const [flujo, setFlujo] = useState<FlujoRow[]>([]);
  const [flujoLoading, setFlujoLoading] = useState(false);
  const [flujoError, setFlujoError] = useState('');
  const [capitalRows, setCapitalRows] = useState<CapitalRow[]>([]);
  const [capitalLoading, setCapitalLoading] = useState(false);
  const [capitalError, setCapitalError] = useState('');
  const [capitalDetalleRows, setCapitalDetalleRows] = useState<CapitalDetalleRow[]>([]);

  const toMoney = (n: number) =>
    `${moneda === 'USD' ? '$' : '¢'} ${Number(n || 0).toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const cargarContexto = async () => {
    setCtxError('');
    const { data, error } = await supabase.rpc('get_eeff_contexto', {
      p_empresa_id: empresaId,
      p_fecha_hasta: fechaHasta || null,
    });
    if (error) {
      setCtx(null);
      setCtxError(error.message || 'No se pudo cargar contexto EEFF.');
      return;
    }
    setCtx((data || [])[0] || null);
  };

  const cargarFlujo = async () => {
    if (!fechaDesde || !fechaHasta || fechaDesde > fechaHasta) {
      setFlujoError('Rango de fechas invalido para flujo.');
      return;
    }
    setFlujoLoading(true);
    setFlujoError('');
    const { data, error } = await supabase.rpc('get_eeff_flujo_efectivo_indirecto', {
      p_empresa_id: empresaId,
      p_fecha_desde: fechaDesde,
      p_fecha_hasta: fechaHasta,
      p_moneda: moneda,
    });
    if (error) {
      setFlujo([]);
      setFlujoError(error.message || 'No se pudo cargar flujo de efectivo.');
      setFlujoLoading(false);
      return;
    }
    setFlujo((data || []) as FlujoRow[]);
    setFlujoLoading(false);
  };

  const cargarCapital = async () => {
    if (!fechaDesde || !fechaHasta || fechaDesde > fechaHasta) {
      setCapitalError('Rango de fechas invalido para estado de capital.');
      return;
    }
    setCapitalLoading(true);
    setCapitalError('');
    const [resMain, resDet] = await Promise.all([
      supabase.rpc('get_eeff_estado_cambios_capital', {
        p_empresa_id: empresaId,
        p_fecha_desde: fechaDesde,
        p_fecha_hasta: fechaHasta,
        p_moneda: moneda,
      }),
      supabase.rpc('get_eeff_movimientos_capital_detalle', {
        p_empresa_id: empresaId,
        p_fecha_desde: fechaDesde,
        p_fecha_hasta: fechaHasta,
        p_moneda: moneda,
      }),
    ]);

    if (resMain.error) {
      setCapitalRows([]);
      setCapitalDetalleRows([]);
      setCapitalError(resMain.error.message || 'No se pudo cargar estado de capital.');
      setCapitalLoading(false);
      return;
    }
    if (resDet.error) {
      setCapitalRows((resMain.data || []) as CapitalRow[]);
      setCapitalDetalleRows([]);
      setCapitalError(resDet.error.message || 'No se pudo cargar detalle de movimientos de capital.');
      setCapitalLoading(false);
      return;
    }

    setCapitalRows((resMain.data || []) as CapitalRow[]);
    setCapitalDetalleRows((resDet.data || []) as CapitalDetalleRow[]);
    setCapitalLoading(false);
  };

  const fmtDate = (iso: string) => {
    const [y, m, d] = String(iso || '').split('-');
    if (!y || !m || !d) return iso || '';
    return `${d}/${m}/${y}`;
  };

  useEffect(() => {
    cargarContexto();
  }, [empresaId, fechaHasta]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (tab === 'flujoefectivo') {
      cargarFlujo();
    }
    if (tab === 'capital') {
      cargarCapital();
    }
  }, [tab, empresaId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="eeff-wrap">
      <style>{styles}</style>
      <div className="eeff-title">Estados Financieros (EEFF)</div>
      <div className="eeff-bar">
        <input className="eeff-input" type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
        <input className="eeff-input" type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
        <select className="eeff-input" value={moneda} onChange={(e) => setMoneda(e.target.value as 'CRC' | 'USD')}>
          <option value="CRC">CRC</option>
          <option value="USD">USD</option>
        </select>
        <button className="eeff-btn" onClick={() => { cargarContexto(); if (tab === 'flujoefectivo') cargarFlujo(); if (tab === 'capital') cargarCapital(); }}>
          Actualizar
        </button>
        <div>
          {ctx ? (
            <span className={`eeff-chip ${ctx.es_preliminar ? 'preliminar' : 'oficial'}`}>
              {ctx.es_preliminar ? 'PRELIMINAR' : 'OFICIAL CERRADO'}
            </span>
          ) : null}
          {ctx ? (
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>
              {ctx.es_preliminar
                ? 'Preliminar: el periodo aun esta abierto y puede cambiar.'
                : 'Oficial cerrado: cifras finales del periodo cerrado.'}
            </div>
          ) : null}
          {ctxError ? <div className="eeff-error">{ctxError}</div> : null}
        </div>
      </div>
      <div className="eeff-tabs">
        <button className={`eeff-tab ${tab === 'balancesituacion' ? 'active' : ''}`} onClick={() => setTab('balancesituacion')}>
          Balance de Situacion
        </button>
        <button className={`eeff-tab ${tab === 'estadoderesultados' ? 'active' : ''}`} onClick={() => setTab('estadoderesultados')}>
          Estado de Resultados
        </button>
        <button className={`eeff-tab ${tab === 'flujoefectivo' ? 'active' : ''}`} onClick={() => setTab('flujoefectivo')}>
          Flujo de Efectivo
        </button>
        <button className={`eeff-tab ${tab === 'capital' ? 'active' : ''}`} onClick={() => setTab('capital')}>
          Estado de Capital
        </button>
      </div>

      {tab === 'balancesituacion' && (
        <BalanceSituacion empresaId={empresaId} onVerMovimientos={onVerMovimientos} />
      )}
      {tab === 'estadoderesultados' && (
        <EstadoResultados
          empresaId={empresaId}
          onVerMovimientos={onVerMovimientos}
          onVerAsientoCierre={onVerAsientoCierre}
        />
      )}
      {tab === 'flujoefectivo' && (
        <>
          <div className="eeff-note" style={{ marginBottom: 10 }}>
            <h4>Flujo de Efectivo (Metodo indirecto base)</h4>
            <p>Vista base de conciliacion: utilidad neta, variacion de efectivo y ajuste de clasificacion.</p>
          </div>
          <div className="eeff-table-wrap">
            <table className="eeff-table">
              <thead>
                <tr>
                  <th style={{ width: '20%' }}>Categoria</th>
                  <th>Concepto</th>
                  <th style={{ width: '22%' }} className="eeff-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {flujoLoading ? (
                  <tr><td colSpan={3}>Cargando...</td></tr>
                ) : flujo.length === 0 ? (
                  <tr><td colSpan={3}>Sin datos para el rango</td></tr>
                ) : (
                  flujo.map((r) => (
                    <tr key={`${r.orden}-${r.concepto}`}>
                      <td>{r.categoria}</td>
                      <td>{r.concepto}</td>
                      <td className="eeff-right">{toMoney(Number(r.monto || 0))}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {flujoError ? <div className="eeff-error">{flujoError}</div> : null}
        </>
      )}
      {tab === 'capital' && (
        <>
          <div className="eeff-note" style={{ marginBottom: 10 }}>
            <h4>Estado de Cambios en el Capital (base)</h4>
            <p>Presenta saldo inicial, utilidad del periodo, movimientos directos y saldo final de capital.</p>
          </div>
          <div className="eeff-table-wrap">
            <table className="eeff-table">
              <thead>
                <tr>
                  <th>Concepto</th>
                  <th style={{ width: '26%' }} className="eeff-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {capitalLoading ? (
                  <tr><td colSpan={2}>Cargando...</td></tr>
                ) : capitalRows.length === 0 ? (
                  <tr><td colSpan={2}>Sin datos para el rango</td></tr>
                ) : (
                  capitalRows.map((r) => (
                    <tr key={`${r.orden}-${r.concepto}`}>
                      <td>{capitalConceptoLabel(r.concepto)}</td>
                      <td className="eeff-right">{toMoney(Number(r.monto || 0))}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="eeff-note" style={{ margin: '10px 0 8px' }}>
            <h4>Detalle de movimientos directos de capital</h4>
            <p>Incluye asientos de capital del rango (excluye asientos de cierre CER-*) para trazabilidad.</p>
          </div>
          <div className="eeff-table-wrap">
            <table className="eeff-table">
              <thead>
                <tr>
                  <th style={{ width: '12%' }}>Fecha</th>
                  <th style={{ width: '12%' }}>Asiento</th>
                  <th style={{ width: '14%' }}>Numero</th>
                  <th>Descripcion</th>
                  <th style={{ width: '16%' }}>Clasificacion</th>
                  <th style={{ width: '16%' }} className="eeff-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {capitalLoading ? (
                  <tr><td colSpan={6}>Cargando...</td></tr>
                ) : capitalDetalleRows.length === 0 ? (
                  <tr><td colSpan={6}>Sin movimientos directos en el rango</td></tr>
                ) : (
                  capitalDetalleRows.map((r) => (
                    <tr key={`${r.asiento_id}-${r.fecha}-${r.clasificacion}`}>
                      <td>{fmtDate(r.fecha)}</td>
                      <td>{r.asiento_id}</td>
                      <td>{r.numero_formato || '-'}</td>
                      <td>{r.descripcion || '-'}</td>
                      <td>{capitalClasificacionLabel(r.clasificacion)}</td>
                      <td className="eeff-right">{toMoney(Number(r.monto || 0))}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {capitalError ? <div className="eeff-error">{capitalError}</div> : null}
        </>
      )}
    </div>
  );
}

