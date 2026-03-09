import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../supabase';

interface SmokeRow {
  issue: string;
  severity: 'INFO' | 'WARN' | 'ERROR' | string;
  total: number;
}

const styles = `
  .sm-wrap { padding:0; }
  .sm-title { font-size:20px; font-weight:600; color:#1f2937; margin-bottom:14px; }
  .sm-grid { display:grid; grid-template-columns:170px 170px auto 1fr; gap:10px; margin-bottom:14px; }
  .sm-input { width:100%; padding:9px 10px; border:1px solid #e5e7eb; border-radius:8px; font-size:13px; outline:none; }
  .sm-input:focus { border-color:#22c55e; box-shadow:0 0 0 3px rgba(34,197,94,0.1); }
  .sm-btn { padding:9px 14px; border-radius:8px; border:none; font-size:13px; font-weight:600; cursor:pointer; color:#fff; background:linear-gradient(135deg,#16a34a,#22c55e); }
  .sm-btn:disabled { opacity:.7; cursor:not-allowed; }
  .sm-card { background:#fff; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden; }
  .sm-table { width:100%; border-collapse:collapse; }
  .sm-table th { background:#f8fafc; padding:10px; font-size:10px; color:#64748b; text-transform:uppercase; letter-spacing:.05em; text-align:left; }
  .sm-table td { padding:10px; font-size:13px; color:#334155; border-top:1px solid #f1f5f9; }
  .sm-right { text-align:right; font-family:'DM Mono',monospace; }
  .sm-badge { display:inline-flex; align-items:center; justify-content:center; min-width:64px; padding:3px 8px; border-radius:999px; font-size:11px; font-weight:700; }
  .sm-badge.INFO { background:#e0f2fe; color:#0c4a6e; }
  .sm-badge.WARN { background:#ffedd5; color:#9a3412; }
  .sm-badge.ERROR { background:#fee2e2; color:#991b1b; }
  .sm-error { margin-bottom:10px; background:#fef2f2; border:1px solid #fecaca; color:#b91c1c; border-radius:8px; padding:10px 12px; font-size:12px; }
  .sm-empty { padding:24px; text-align:center; color:#94a3b8; font-size:13px; }
`;

export default function SmokeContabilidad({ empresaId }: { empresaId: number }) {
  const today = new Date();
  const [desde, setDesde] = useState(`${today.getFullYear()}-01-01`);
  const [hasta, setHasta] = useState(today.toISOString().slice(0, 10));
  const [rows, setRows] = useState<SmokeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const reqRef = useRef(0);

  const cargar = async () => {
    if (desde && hasta && desde > hasta) {
      setError('Rango de fechas invalido: "Desde" no puede ser mayor que "Hasta".');
      setRows([]);
      return;
    }
    const reqId = ++reqRef.current;
    setLoading(true);
    setError('');
    const { data, error: rpcError } = await supabase.rpc('get_contabilidad_smoke', {
      p_empresa_id: empresaId,
      p_fecha_desde: desde || null,
      p_fecha_hasta: hasta || null,
    });
    if (reqId !== reqRef.current) return;
    if (rpcError) {
      setError(rpcError.message || 'No se pudo ejecutar el smoke contable');
      setRows([]);
    } else {
      setRows((data || []) as SmokeRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    const t = setTimeout(() => cargar(), 300);
    return () => clearTimeout(t);
  }, [empresaId, desde, hasta]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="sm-wrap">
      <style>{styles}</style>
      <div className="sm-title">Smoke Contable</div>

      {error && <div className="sm-error">{error}</div>}

      <div className="sm-grid">
        <input className="sm-input" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        <input className="sm-input" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        <button className="sm-btn" onClick={cargar} disabled={loading}>{loading ? 'Verificando...' : 'Actualizar'}</button>
      </div>

      <div className="sm-card">
        <table className="sm-table">
          <thead>
            <tr>
              <th style={{ width: '45%' }}>Indicador</th>
              <th style={{ width: '20%' }}>Severidad</th>
              <th className="sm-right" style={{ width: '35%' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {!rows.length && !loading && (
              <tr>
                <td colSpan={3} className="sm-empty">Sin datos para el rango seleccionado</td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.issue}>
                <td>{r.issue}</td>
                <td>
                  <span className={`sm-badge ${r.severity}`}>{r.severity}</span>
                </td>
                <td className="sm-right">{Number(r.total || 0).toLocaleString('es-CR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

