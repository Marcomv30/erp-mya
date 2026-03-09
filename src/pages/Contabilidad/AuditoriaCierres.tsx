import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabase';

interface RowAudit {
  fecha_hora: string;
  accion: string;
  usuario: string;
  asiento_id: number | null;
  fecha_desde: string | null;
  fecha_hasta: string | null;
  moneda: string | null;
  motivo: string | null;
}

interface EmpresaParametrosResp {
  cierre_contable?: {
    activo?: boolean;
    fecha_inicio?: string | null;
    fecha_fin?: string | null;
  };
}

const styles = `
  .ac-wrap { padding:0; }
  .ac-title { font-size:20px; font-weight:600; color:#1f2937; margin-bottom:14px; }
  .ac-grid { display:grid; grid-template-columns:190px 190px auto 1fr; gap:10px; margin-bottom:14px; }
  .ac-input { width:100%; padding:9px 10px; border:1px solid #e5e7eb; border-radius:8px; font-size:13px; outline:none; }
  .ac-input:focus { border-color:#22c55e; box-shadow:0 0 0 3px rgba(34,197,94,0.1); }
  .ac-btn { padding:9px 14px; border-radius:8px; border:none; font-size:13px; font-weight:600; cursor:pointer; color:#fff; background:linear-gradient(135deg,#16a34a,#22c55e); }
  .ac-card { background:#fff; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden; }
  .ac-table { width:100%; border-collapse:collapse; }
  .ac-table th { background:#f8fafc; padding:10px; font-size:10px; color:#64748b; text-transform:uppercase; letter-spacing:.05em; text-align:left; }
  .ac-table td { padding:10px; font-size:12px; color:#334155; border-top:1px solid #f1f5f9; vertical-align:top; }
  .ac-badge { display:inline-flex; align-items:center; padding:3px 8px; border-radius:999px; font-size:11px; font-weight:700; }
  .ac-badge.APLICADO { background:#dcfce7; color:#166534; }
  .ac-badge.REVERTIDO { background:#fee2e2; color:#991b1b; }
  .ac-mono { font-family:'DM Mono',monospace; }
  .ac-err { margin-bottom:10px; background:#fef2f2; border:1px solid #fecaca; color:#b91c1c; border-radius:8px; padding:10px 12px; font-size:12px; }
  .ac-status { margin-bottom:12px; background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:10px 12px; display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
  .ac-status-lbl { font-size:12px; color:#64748b; text-transform:uppercase; letter-spacing:.05em; font-weight:700; }
  .ac-status-val { font-size:13px; font-weight:700; }
  .ac-status-open { color:#166534; }
  .ac-status-closed { color:#991b1b; }
`;

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('es-CR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });

export default function AuditoriaCierres({ empresaId }: { empresaId: number }) {
  const now = new Date();
  const [desde, setDesde] = useState(`${now.getFullYear()}-01-01`);
  const [hasta, setHasta] = useState(now.toISOString().slice(0, 10));
  const [rows, setRows] = useState<RowAudit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cierreActual, setCierreActual] = useState<{ activo: boolean; inicio: string | null; fin: string | null }>({
    activo: false,
    inicio: null,
    fin: null,
  });

  const cargarEstadoActual = async () => {
    const { data, error: rpcError } = await supabase.rpc('get_empresa_parametros', { p_empresa_id: empresaId });
    if (rpcError || !data) {
      setCierreActual({ activo: false, inicio: null, fin: null });
      return;
    }
    const parsed = data as EmpresaParametrosResp;
    setCierreActual({
      activo: Boolean(parsed?.cierre_contable?.activo),
      inicio: parsed?.cierre_contable?.fecha_inicio || null,
      fin: parsed?.cierre_contable?.fecha_fin || null,
    });
  };

  const cargar = async () => {
    setLoading(true);
    setError('');
    const [{ data, error: rpcError }] = await Promise.all([
      supabase.rpc('get_auditoria_cierres_contables', {
        p_empresa_id: empresaId,
        p_desde: desde ? `${desde}T00:00:00` : null,
        p_hasta: hasta ? `${hasta}T23:59:59` : null,
      }),
      cargarEstadoActual(),
    ]);
    setLoading(false);
    if (rpcError) {
      setError(rpcError.message || 'No se pudo cargar auditoria de cierres');
      setRows([]);
      return;
    }
    setRows((data || []) as RowAudit[]);
  };

  useEffect(() => {
    cargar();
  }, [empresaId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="ac-wrap">
      <style>{styles}</style>
      <div className="ac-title">Auditoria de Cierres</div>
      {error && <div className="ac-err">{error}</div>}

      <div className="ac-status">
        <span className="ac-status-lbl">Estado actual:</span>
        <span className={`ac-status-val ${cierreActual.activo ? 'ac-status-closed' : 'ac-status-open'}`}>
          {cierreActual.activo ? 'CERRADO' : 'ABIERTO'}
        </span>
        <span className="ac-mono">
          {cierreActual.inicio && cierreActual.fin ? `${cierreActual.inicio} a ${cierreActual.fin}` : '-'}
        </span>
      </div>

      <div className="ac-grid">
        <input className="ac-input" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        <input className="ac-input" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        <button className="ac-btn" onClick={cargar} disabled={loading}>{loading ? 'Cargando...' : 'Actualizar'}</button>
      </div>

      <div className="ac-card">
        <table className="ac-table">
          <thead>
            <tr>
              <th>Fecha/Hora</th>
              <th>Accion</th>
              <th>Usuario</th>
              <th>Rango</th>
              <th>Asiento</th>
              <th>Moneda</th>
              <th>Motivo</th>
            </tr>
          </thead>
          <tbody>
            {!rows.length && (
              <tr><td colSpan={7} style={{ padding: 22, textAlign: 'center', color: '#94a3b8' }}>Sin eventos para el rango</td></tr>
            )}
            {rows.map((r, i) => (
              <tr key={`${r.fecha_hora}-${i}`}>
                <td className="ac-mono">{fmtDateTime(r.fecha_hora)}</td>
                <td><span className={`ac-badge ${r.accion}`}>{r.accion}</span></td>
                <td>{r.usuario || 'SISTEMA'}</td>
                <td className="ac-mono">{(r.fecha_desde || '-') + ' a ' + (r.fecha_hasta || '-')}</td>
                <td className="ac-mono">{r.asiento_id ? `#${r.asiento_id}` : '-'}</td>
                <td className="ac-mono">{r.moneda || '-'}</td>
                <td>{r.motivo || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
