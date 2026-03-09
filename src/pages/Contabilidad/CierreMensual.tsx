import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../supabase';

interface SmokeRow {
  issue: string;
  severity: 'INFO' | 'WARN' | 'ERROR' | string;
  total: number;
}

interface CierreResp {
  asiento_id: number;
  cierre_activo: boolean;
  cierre_fecha_inicio: string | null;
  cierre_fecha_fin: string | null;
  precheck_errores: number;
}

const styles = `
  .cm-wrap { padding:0; }
  .cm-title { font-size:20px; font-weight:600; color:#1f2937; margin-bottom:14px; }
  .cm-grid { display:grid; grid-template-columns:170px 170px 120px auto auto 1fr; gap:10px; margin-bottom:14px; }
  .cm-input { width:100%; padding:9px 10px; border:1px solid #e5e7eb; border-radius:8px; font-size:13px; outline:none; }
  .cm-input:focus { border-color:#22c55e; box-shadow:0 0 0 3px rgba(34,197,94,0.1); }
  .cm-btn { padding:9px 14px; border-radius:8px; border:none; font-size:13px; font-weight:600; cursor:pointer; color:#fff; background:linear-gradient(135deg,#16a34a,#22c55e); }
  .cm-btn.alt { background:linear-gradient(135deg,#2563eb,#3b82f6); }
  .cm-btn.ghost { background:#fff; color:#334155; border:1px solid #d1d5db; }
  .cm-btn:disabled { opacity:.7; cursor:not-allowed; }
  .cm-alert { margin-bottom:10px; border-radius:8px; padding:10px 12px; font-size:12px; border:1px solid; }
  .cm-alert.err { background:#fef2f2; border-color:#fecaca; color:#b91c1c; }
  .cm-alert.warn { background:#fffbeb; border-color:#fde68a; color:#92400e; display:flex; align-items:center; justify-content:space-between; gap:10px; }
  .cm-alert.ok { background:#ecfdf5; border-color:#bbf7d0; color:#166534; }
  .cm-card { background:#fff; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden; }
  .cm-table { width:100%; border-collapse:collapse; }
  .cm-table th { background:#f8fafc; padding:10px; font-size:10px; color:#64748b; text-transform:uppercase; letter-spacing:.05em; text-align:left; }
  .cm-table td { padding:10px; font-size:13px; color:#334155; border-top:1px solid #f1f5f9; }
  .cm-right { text-align:right; font-family:'DM Mono',monospace; }
  .cm-badge { display:inline-flex; align-items:center; justify-content:center; min-width:64px; padding:3px 8px; border-radius:999px; font-size:11px; font-weight:700; }
  .cm-badge.INFO { background:#e0f2fe; color:#0c4a6e; }
  .cm-badge.WARN { background:#ffedd5; color:#9a3412; }
  .cm-badge.ERROR { background:#fee2e2; color:#991b1b; }
  .cm-kpis { display:grid; grid-template-columns:repeat(3,minmax(160px,1fr)); gap:10px; margin-bottom:12px; }
  .cm-kpi { background:#fff; border:1px solid #e5e7eb; border-radius:10px; padding:10px 12px; }
  .cm-kpi-lbl { font-size:11px; color:#94a3b8; text-transform:uppercase; letter-spacing:.04em; }
  .cm-kpi-val { margin-top:4px; font-size:18px; font-family:'DM Mono',monospace; font-weight:700; color:#1e293b; }
  .cm-kpi-val.ok { color:#166534; }
  .cm-kpi-val.err { color:#b91c1c; }
  .cm-modal-backdrop { position:fixed; inset:0; z-index:50; background:rgba(15,23,42,.38); display:flex; align-items:center; justify-content:center; padding:16px; }
  .cm-modal { width:min(520px,100%); background:#fff; border:1px solid #e5e7eb; border-radius:12px; box-shadow:0 24px 45px rgba(2,6,23,.2); overflow:hidden; }
  .cm-modal-head { padding:12px 14px; background:#f8fafc; border-bottom:1px solid #e5e7eb; font-size:13px; font-weight:700; color:#0f172a; }
  .cm-modal-body { padding:14px; font-size:13px; color:#334155; line-height:1.45; }
  .cm-modal-actions { padding:12px 14px; border-top:1px solid #e5e7eb; display:flex; justify-content:flex-end; gap:8px; }
`;

export default function CierreMensual({
  empresaId,
  onVerAsiento,
}: {
  empresaId: number;
  onVerAsiento?: (asientoId: number) => void;
}) {
  const today = new Date();
  const [desde, setDesde] = useState(`${today.getFullYear()}-01-01`);
  const [hasta, setHasta] = useState(today.toISOString().slice(0, 10));
  const [moneda, setMoneda] = useState<'CRC' | 'USD'>('CRC');
  const [bloquearPeriodo, setBloquearPeriodo] = useState(true);
  const [rows, setRows] = useState<SmokeRow[]>([]);
  const [loadingSmoke, setLoadingSmoke] = useState(false);
  const [loadingCierre, setLoadingCierre] = useState(false);
  const [loadingRevertir, setLoadingRevertir] = useState(false);
  const [ok, setOk] = useState('');
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [warnAsientoId, setWarnAsientoId] = useState<number | null>(null);
  const [ultimoCierre, setUltimoCierre] = useState<CierreResp | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showRevertModal, setShowRevertModal] = useState(false);
  const [motivoReversion, setMotivoReversion] = useState('');

  const totalErrores = useMemo(
    () => rows.filter((r) => r.severity === 'ERROR').reduce((acc, r) => acc + Number(r.total || 0), 0),
    [rows]
  );
  const totalWarn = useMemo(
    () => rows.filter((r) => r.severity === 'WARN').reduce((acc, r) => acc + Number(r.total || 0), 0),
    [rows]
  );

  const runSmoke = async () => {
    if (desde && hasta && desde > hasta) {
      setErr('Rango de fechas invalido: "Desde" no puede ser mayor que "Hasta".');
      setRows([]);
      return;
    }
    setLoadingSmoke(true);
    setErr('');
    setWarn('');
    setWarnAsientoId(null);
    setOk('');
    const { data, error } = await supabase.rpc('get_contabilidad_smoke', {
      p_empresa_id: empresaId,
      p_fecha_desde: desde || null,
      p_fecha_hasta: hasta || null,
    });
    setLoadingSmoke(false);
    if (error) {
      setErr(error.message || 'No se pudo ejecutar pre-check');
      setRows([]);
      return;
    }
    setRows((data || []) as SmokeRow[]);
  };

  const ejecutarCierre = async () => {
    if (loadingCierre) return;
    if (desde && hasta && desde > hasta) {
      setErr('Rango de fechas invalido: "Desde" no puede ser mayor que "Hasta".');
      return;
    }
    setShowConfirm(true);
  };

  const confirmarEjecucionCierre = async () => {
    setShowConfirm(false);
    setLoadingCierre(true);
    setErr('');
    setWarn('');
    setWarnAsientoId(null);
    setOk('');
    const { data, error } = await supabase.rpc('ejecutar_cierre_mensual_controlado', {
      p_empresa_id: empresaId,
      p_fecha_desde: desde || null,
      p_fecha_hasta: hasta || null,
      p_moneda: moneda,
      p_bloquear_periodo: bloquearPeriodo,
    });
    setLoadingCierre(false);
    if (error) {
      const msg = error.message || 'No se pudo ejecutar cierre mensual';
      if (msg.toLowerCase().includes('ya existe cierre confirmado')) {
        const m = msg.match(/asiento_id\s*=\s*(\d+)/i);
        const id = m ? Number(m[1]) : null;
        setWarn(msg);
        setWarnAsientoId(id && Number.isFinite(id) ? id : null);
      } else {
        setErr(msg);
      }
      return;
    }
    const row = ((data || [])[0] || null) as CierreResp | null;
    setUltimoCierre(row);
    setOk(`Cierre aplicado. Asiento #${row?.asiento_id || 'N/A'}`);
    await runSmoke();
  };

  const revertirCierre = async () => {
    if (loadingRevertir) return;
    if (!motivoReversion.trim()) {
      setErr('Debe indicar motivo para revertir el cierre.');
      return;
    }
    setShowRevertModal(false);
    setLoadingRevertir(true);
    setErr('');
    setWarn('');
    setWarnAsientoId(null);
    setOk('');
    const { error } = await supabase.rpc('revertir_cierre_contable', {
      p_empresa_id: empresaId,
      p_motivo: motivoReversion.trim(),
    });
    setLoadingRevertir(false);
    if (error) {
      setErr(error.message || 'No se pudo revertir el cierre contable');
      return;
    }
    setMotivoReversion('');
    setUltimoCierre(null);
    setOk('Cierre revertido correctamente.');
    await runSmoke();
  };

  useEffect(() => {
    runSmoke();
  }, [empresaId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="cm-wrap">
      <style>{styles}</style>
      <div className="cm-title">Cierre Mensual Controlado</div>

      {err && <div className="cm-alert err">{err}</div>}
      {warn && (
        <div className="cm-alert warn">
          <span>{warn}</span>
          {warnAsientoId && onVerAsiento && (
            <button className="cm-btn ghost" onClick={() => onVerAsiento(warnAsientoId)}>
              Ver asiento #{warnAsientoId}
            </button>
          )}
        </div>
      )}
      {ok && <div className="cm-alert ok">{ok}</div>}

      <div className="cm-grid">
        <input className="cm-input" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        <input className="cm-input" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        <select className="cm-input" value={moneda} onChange={(e) => setMoneda((e.target.value || 'CRC') as 'CRC' | 'USD')}>
          <option value="CRC">CRC</option>
          <option value="USD">USD</option>
        </select>
        <label className="cm-input" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={bloquearPeriodo} onChange={(e) => setBloquearPeriodo(e.target.checked)} />
          Bloquear periodo
        </label>
        <button className="cm-btn alt" onClick={runSmoke} disabled={loadingSmoke || loadingCierre || loadingRevertir}>
          {loadingSmoke ? 'Verificando...' : 'Pre-check'}
        </button>
        <button className="cm-btn" onClick={ejecutarCierre} disabled={loadingSmoke || loadingCierre || loadingRevertir}>
          {loadingCierre ? 'Procesando...' : 'Generar Cierre'}
        </button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -6, marginBottom: 10 }}>
        <button
          className="cm-btn ghost"
          onClick={() => setShowRevertModal(true)}
          disabled={loadingSmoke || loadingCierre || loadingRevertir}
        >
          {loadingRevertir ? 'Revirtiendo...' : 'Revertir Cierre'}
        </button>
      </div>

      <div className="cm-kpis">
        <div className="cm-kpi">
          <div className="cm-kpi-lbl">Errores Pre-check</div>
          <div className={`cm-kpi-val ${totalErrores > 0 ? 'err' : 'ok'}`}>{totalErrores.toLocaleString('es-CR')}</div>
        </div>
        <div className="cm-kpi">
          <div className="cm-kpi-lbl">Warnings Pre-check</div>
          <div className="cm-kpi-val">{totalWarn.toLocaleString('es-CR')}</div>
        </div>
        <div className="cm-kpi">
          <div className="cm-kpi-lbl">Ultimo Asiento Cierre</div>
          <div className="cm-kpi-val">{ultimoCierre?.asiento_id ? `#${ultimoCierre.asiento_id}` : '-'}</div>
        </div>
      </div>

      <div className="cm-card">
        <table className="cm-table">
          <thead>
            <tr>
              <th style={{ width: '45%' }}>Indicador</th>
              <th style={{ width: '20%' }}>Severidad</th>
              <th className="cm-right" style={{ width: '35%' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {!rows.length && (
              <tr>
                <td colSpan={3} style={{ padding: 22, textAlign: 'center', color: '#94a3b8' }}>Sin datos</td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.issue}>
                <td>{r.issue}</td>
                <td>
                  <span className={`cm-badge ${r.severity}`}>{r.severity}</span>
                </td>
                <td className="cm-right">{Number(r.total || 0).toLocaleString('es-CR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showConfirm && (
        <div className="cm-modal-backdrop" onClick={() => setShowConfirm(false)}>
          <div className="cm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cm-modal-head">Confirmar cierre mensual</div>
            <div className="cm-modal-body">
              Se generara el asiento de cierre para el rango <b>{desde}</b> a <b>{hasta}</b> en <b>{moneda}</b>.
              <br />
              {bloquearPeriodo
                ? 'Tambien se bloqueara el periodo contable para nuevas confirmaciones.'
                : 'No se bloqueara el periodo contable.'}
            </div>
            <div className="cm-modal-actions">
              <button className="cm-btn ghost" onClick={() => setShowConfirm(false)}>Cancelar</button>
              <button className="cm-btn" onClick={confirmarEjecucionCierre}>Confirmar cierre</button>
            </div>
          </div>
        </div>
      )}

      {showRevertModal && (
        <div className="cm-modal-backdrop" onClick={() => setShowRevertModal(false)}>
          <div className="cm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cm-modal-head">Revertir cierre contable</div>
            <div className="cm-modal-body">
              Esta accion abrirá nuevamente el periodo contable. Ingrese motivo para auditoria:
              <textarea
                className="cm-input"
                style={{ marginTop: 10, minHeight: 90, resize: 'vertical' }}
                value={motivoReversion}
                onChange={(e) => setMotivoReversion(e.target.value)}
                placeholder="Motivo de reversion"
              />
            </div>
            <div className="cm-modal-actions">
              <button className="cm-btn ghost" onClick={() => setShowRevertModal(false)}>Cancelar</button>
              <button className="cm-btn" onClick={revertirCierre}>Confirmar reversion</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
