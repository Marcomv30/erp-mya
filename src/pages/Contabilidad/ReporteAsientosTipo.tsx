import React, { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../supabase';
import { exportCsv, exportExcelXml, exportPdfWithPrint, formatMoneyCRC, ReportColumn } from '../../utils/reporting';

interface TipoAsiento {
  id: number;
  codigo: string;
  nombre: string;
}

interface RowDetalle {
  asiento_id: number;
  numero_formato: string;
  fecha: string;
  estado: string;
  tipo_id: number;
  tipo_codigo: string;
  tipo_nombre: string;
  categoria_id: number;
  categoria_codigo: string;
  categoria_descripcion: string;
  descripcion: string;
  total_debito_crc: number;
  total_credito_crc: number;
}

const styles = `
  .rat-wrap { padding:0; }
  .rat-title { font-size:20px; font-weight:600; color:#1f2937; margin-bottom:14px; }
  .rat-grid { display:grid; grid-template-columns:180px 170px 170px auto 1fr; gap:10px; margin-bottom:14px; }
  .rat-input { width:100%; padding:9px 10px; border:1px solid #e5e7eb; border-radius:8px; font-size:13px; outline:none; }
  .rat-input:focus { border-color:#22c55e; box-shadow:0 0 0 3px rgba(34,197,94,0.1); }
  .rat-btn { padding:9px 14px; border-radius:8px; border:none; font-size:13px; font-weight:600; cursor:pointer; }
  .rat-btn.primary { color:#fff; background:linear-gradient(135deg,#16a34a,#22c55e); }
  .rat-btn.neutral { color:#334155; background:#f1f5f9; border:1px solid #e2e8f0; }
  .rat-icon-actions { display:flex; justify-content:flex-end; gap:8px; margin-bottom:10px; }
  .rat-icon-btn {
    width:32px; height:32px; border-radius:8px; border:1px solid #e2e8f0;
    background:#ffffff; color:#334155; font-size:18px; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    transition:all .15s ease;
  }
  .rat-icon-btn:hover { background:#f8fafc; border-color:#cbd5e1; transform:translateY(-1px); }
  .rat-icon-btn:disabled { opacity:.45; cursor:not-allowed; transform:none; }
  .rat-icon-svg { width:20px; height:20px; stroke:currentColor; fill:none; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
  .rat-cards { display:grid; grid-template-columns:repeat(4,minmax(160px,1fr)); gap:10px; margin-bottom:14px; }
  .rat-card { background:#fff; border:1px solid #e5e7eb; border-radius:10px; padding:10px 12px; }
  .rat-card-num { font-size:20px; font-weight:700; color:#0f172a; }
  .rat-card-label { font-size:11px; color:#94a3b8; text-transform:uppercase; letter-spacing:.04em; }
  .rat-table-wrap { background:#fff; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden; }
  .rat-table { width:100%; border-collapse:collapse; }
  .rat-table th { background:#f8fafc; padding:11px 12px; font-size:11px; color:#64748b; text-transform:uppercase; letter-spacing:.05em; text-align:left; border-bottom:1px solid #e5e7eb; }
  .rat-table td { padding:10px 12px; font-size:13px; color:#334155; border-bottom:1px solid #f1f5f9; }
  .rat-table tr:last-child td { border-bottom:none; }
  .rat-mobile-list { display:none; }
  .rat-row-card { background:#fff; border:1px solid #e5e7eb; border-radius:10px; padding:12px; margin-bottom:8px; }
  .rat-row-head { display:flex; justify-content:space-between; gap:8px; margin-bottom:8px; }
  .rat-row-num { font-family:'DM Mono',monospace; color:#0f172a; font-size:12px; font-weight:600; }
  .rat-row-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:8px; }
  .rat-row-label { font-size:10px; color:#94a3b8; text-transform:uppercase; letter-spacing:.05em; display:block; }
  .rat-chip { display:inline-flex; align-items:center; padding:3px 8px; border-radius:999px; background:#eff6ff; color:#1d4ed8; font-size:11px; font-weight:600; font-family:'DM Mono',monospace; }
  .rat-empty { text-align:center; color:#94a3b8; padding:24px; }

  @media (max-width: 980px) {
    .rat-grid { grid-template-columns:1fr 1fr; gap:8px; }
    .rat-cards { grid-template-columns:repeat(2,minmax(140px,1fr)); }
    .rat-icon-actions { justify-content:flex-start; }
    .rat-table-wrap { overflow-x:auto; }
    .rat-table { min-width:880px; }
  }

  @media (max-width: 620px) {
    .rat-title { font-size:18px; }
    .rat-grid { grid-template-columns:1fr; }
    .rat-cards { grid-template-columns:1fr; }
    .rat-card-num { font-size:18px; }
    .rat-icon-actions { gap:6px; }
    .rat-icon-btn { width:30px; height:30px; }
    .rat-icon-svg { width:18px; height:18px; }
    .rat-table-wrap { display:none; }
    .rat-mobile-list { display:block; }
  }
`;

function IconFileText() {
  return (
    <svg viewBox="0 0 24 24" className="rat-icon-svg" aria-hidden="true">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
      <path d="M9 9h2" />
    </svg>
  );
}

function IconSheet() {
  return (
    <svg viewBox="0 0 24 24" className="rat-icon-svg" aria-hidden="true">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <rect x="8" y="12" width="8" height="6" rx="1" />
      <path d="M8 15h8M11 12v6M14 12v6" />
    </svg>
  );
}

function IconPdf() {
  return (
    <svg viewBox="0 0 24 24" className="rat-icon-svg" aria-hidden="true">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M8.5 16.5h2.2a1.3 1.3 0 0 0 0-2.6H8.5v5" />
      <path d="M12 18.5v-5h1.2a2 2 0 0 1 0 4H12" />
      <path d="M16 18.5v-5h2.5" />
      <path d="M16 16h2" />
    </svg>
  );
}

function toMoney(n: number) {
  return formatMoneyCRC(n);
}

export default function ReporteAsientosTipo({ empresaId }: { empresaId: number }) {
  const today = new Date();
  const startYear = `${today.getFullYear()}-01-01`;
  const endYear = `${today.getFullYear()}-12-31`;

  const [tipos, setTipos] = useState<TipoAsiento[]>([]);
  const [rows, setRows] = useState<RowDetalle[]>([]);
  const [tipoId, setTipoId] = useState<number | ''>('');
  const [desde, setDesde] = useState(startYear);
  const [hasta, setHasta] = useState(endYear);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const reqRef = useRef(0);

  const cargarTipos = async () => {
    const { data } = await supabase
      .from('asiento_tipos')
      .select('id, codigo, nombre')
      .eq('activo', true)
      .order('orden')
      .order('codigo');
    setTipos((data || []) as TipoAsiento[]);
  };

  const cargar = async () => {
    if (desde && hasta && desde > hasta) {
      setError('Rango de fechas invalido: "Desde" no puede ser mayor que "Hasta".');
      setRows([]);
      return;
    }
    const reqId = ++reqRef.current;
    setLoading(true);
    setError('');
    const { data, error: rpcError } = await supabase.rpc('reporte_asientos_por_tipo_detalle', {
      p_empresa_id: empresaId,
      p_fecha_desde: desde || null,
      p_fecha_hasta: hasta || null,
      p_tipo_id: tipoId === '' ? null : Number(tipoId),
    });
    if (reqId !== reqRef.current) return;
    if (rpcError) {
      setError(rpcError.message || 'No se pudo cargar el reporte');
      setRows([]);
    } else {
      setRows((data || []) as RowDetalle[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarTipos();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      cargar();
    }, 350);
    return () => clearTimeout(t);
  }, [empresaId, tipoId, desde, hasta]); // eslint-disable-line react-hooks/exhaustive-deps

  const totals = useMemo(() => {
    const asientos = new Set(rows.map((r) => r.asiento_id)).size;
    const deb = rows.reduce((acc, r) => acc + Number(r.total_debito_crc || 0), 0);
    const cre = rows.reduce((acc, r) => acc + Number(r.total_credito_crc || 0), 0);
    return { asientos, deb, cre };
  }, [rows]);

  const columns: ReportColumn<RowDetalle>[] = [
    { key: 'fecha', title: 'Fecha', getValue: (r) => r.fecha },
    { key: 'numero_formato', title: 'Asiento', getValue: (r) => r.numero_formato },
    { key: 'tipo_codigo', title: 'Tipo', getValue: (r) => r.tipo_codigo },
    { key: 'tipo_nombre', title: 'Tipo Nombre', getValue: (r) => r.tipo_nombre },
    { key: 'categoria_codigo', title: 'Categoria', getValue: (r) => r.categoria_codigo },
    { key: 'categoria_descripcion', title: 'Categoria Desc', getValue: (r) => r.categoria_descripcion || '' },
    { key: 'descripcion', title: 'Descripcion', getValue: (r) => r.descripcion || '' },
    { key: 'total_debito_crc', title: 'Debito CRC', getValue: (r) => Number(r.total_debito_crc || 0).toFixed(2) },
    { key: 'total_credito_crc', title: 'Credito CRC', getValue: (r) => Number(r.total_credito_crc || 0).toFixed(2) },
  ];

  const onExportCsv = () => {
    exportCsv(`reporte_asientos_tipo_${empresaId}.csv`, rows, columns);
  };

  const onExportExcel = () => {
    exportExcelXml(`reporte_asientos_tipo_${empresaId}.xls`, rows, columns);
  };

  const onExportPdf = () => {
    const tipoSel = tipoId === ''
      ? 'Todos'
      : (tipos.find((t) => t.id === Number(tipoId))?.codigo || 'N/A');
    exportPdfWithPrint({
      title: 'Reporte de Asientos por Tipo',
      subtitle: `Empresa ${empresaId} | Desde ${desde} Hasta ${hasta} | Tipo ${tipoSel}`,
      rows,
      columns,
      summaryLines: [
        `Asientos: ${totals.asientos}`,
        `Registros: ${rows.length}`,
        `Debito CRC: ${toMoney(totals.deb)}`,
        `Credito CRC: ${toMoney(totals.cre)}`,
      ],
    });
  };

  return (
    <>
      <style>{styles}</style>
      <div className="rat-wrap">
        <div className="rat-title">Reporte de Asientos por Tipo</div>

        <div className="rat-grid">
          <select className="rat-input" value={tipoId} onChange={(e) => setTipoId(e.target.value ? Number(e.target.value) : '')}>
            <option value="">Todos los tipos</option>
            {tipos.map((t) => <option key={t.id} value={t.id}>{t.codigo} - {t.nombre}</option>)}
          </select>
          <input className="rat-input" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          <input className="rat-input" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          <button className="rat-btn primary" onClick={cargar} disabled={loading} title="Actualizar manual">
            {loading ? 'Cargando...' : 'Actualizar'}
          </button>
          <div />
        </div>
        <div className="rat-icon-actions">
          <button
            className="rat-icon-btn"
            onClick={onExportCsv}
            disabled={rows.length === 0}
            title="Exportar CSV"
            aria-label="Exportar CSV"
          >
            <IconFileText />
          </button>
          <button
            className="rat-icon-btn"
            onClick={onExportExcel}
            disabled={rows.length === 0}
            title="Exportar Excel"
            aria-label="Exportar Excel"
          >
            <IconSheet />
          </button>
          <button
            className="rat-icon-btn"
            onClick={onExportPdf}
            disabled={rows.length === 0}
            title="Exportar PDF"
            aria-label="Exportar PDF"
          >
            <IconPdf />
          </button>
        </div>

        {error && (
          <div style={{ marginBottom: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 8, padding: '10px 12px', fontSize: 12 }}>
            {error}
          </div>
        )}

        <div className="rat-cards">
          <div className="rat-card">
            <div className="rat-card-num">{totals.asientos}</div>
            <div className="rat-card-label">Asientos</div>
          </div>
          <div className="rat-card">
            <div className="rat-card-num">{rows.length}</div>
            <div className="rat-card-label">Registros</div>
          </div>
          <div className="rat-card">
            <div className="rat-card-num">{toMoney(totals.deb)}</div>
            <div className="rat-card-label">Debito CRC</div>
          </div>
          <div className="rat-card">
            <div className="rat-card-num">{toMoney(totals.cre)}</div>
            <div className="rat-card-label">Credito CRC</div>
          </div>
        </div>

        <div className="rat-table-wrap">
          <table className="rat-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Asiento</th>
                <th>Tipo</th>
                <th>Categoria</th>
                <th>Descripcion</th>
                <th>Debito CRC</th>
                <th>Credito CRC</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={7} className="rat-empty">Sin datos para los filtros seleccionados</td></tr>
              ) : rows.map((r) => (
                <tr key={r.asiento_id}>
                  <td>{r.fecha}</td>
                  <td style={{ fontFamily: 'DM Mono, monospace' }}>{r.numero_formato}</td>
                  <td><span className="rat-chip">{r.tipo_codigo}</span></td>
                  <td><span className="rat-chip">{r.categoria_codigo}</span></td>
                  <td>{r.descripcion}</td>
                  <td style={{ fontFamily: 'DM Mono, monospace' }}>{toMoney(r.total_debito_crc)}</td>
                  <td style={{ fontFamily: 'DM Mono, monospace' }}>{toMoney(r.total_credito_crc)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rat-mobile-list">
          {rows.length === 0 ? (
            <div className="rat-empty">Sin datos para los filtros seleccionados</div>
          ) : rows.map((r) => (
            <div key={`m-${r.asiento_id}`} className="rat-row-card">
              <div className="rat-row-head">
                <span className="rat-row-num">{r.numero_formato}</span>
                <span className="rat-row-num">{r.fecha}</span>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <span className="rat-chip">{r.tipo_codigo}</span>
                <span className="rat-chip" style={{ marginLeft: '6px' }}>{r.categoria_codigo}</span>
              </div>
              <div className="rat-row-grid">
                <div>
                  <span className="rat-row-label">Debito CRC</span>
                  <span className="rat-row-num">{toMoney(r.total_debito_crc)}</span>
                </div>
                <div>
                  <span className="rat-row-label">Credito CRC</span>
                  <span className="rat-row-num">{toMoney(r.total_credito_crc)}</span>
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                {r.descripcion || '-'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
