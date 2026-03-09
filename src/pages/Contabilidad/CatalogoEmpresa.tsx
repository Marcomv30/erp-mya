import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import { exportCsv, exportPdfWithPrint, formatBooleanFlag, ReportColumn } from '../../utils/reporting';
import ListToolbar from '../../components/ListToolbar';
import ExcelJS from 'exceljs';

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
  .cat-export { margin-left:auto; display:flex; gap:8px; }
  .cat-export-btn { padding:7px 12px; border-radius:8px; border:1px solid #e5e7eb; background:#fff; color:#334155; font-size:12px; font-weight:600; cursor:pointer; }
  .cat-export-btn:hover { border-color:#22c55e; color:#16a34a; background:#f0fdf4; }
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
  .tipo-btn.COSTO { background:#ffedd5; color:#c2410c; border-color:#fed7aa; }
  .tipo-btn.inactive { background:#f3f4f6; color:#9ca3af; border-color:#e5e7eb; }
  .cat-table-wrap { background:white; border-radius:14px; border:1px solid #e5e7eb;
    overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.04); }
  .cat-table { width:100%; border-collapse:collapse; }
  .cat-table thead { background:#f9fafb; }
  .cat-table th { padding:12px 16px; text-align:left; font-size:11px; font-weight:600;
    color:#6b7280; letter-spacing:0.06em; text-transform:uppercase; border-bottom:1px solid #e5e7eb; }
  .cat-table td { padding:10px 16px; font-size:12px; color:#374151; border-bottom:1px solid #f3f4f6; }
  .cat-table tr:last-child td { border-bottom:none; }
  .cat-table tr:hover td { filter:brightness(0.99); }
  .cat-mobile-list { display:none; }
  .cat-card { background:#fff; border:1px solid #e5e7eb; border-radius:10px; padding:12px; margin-bottom:8px; }
  .cat-card-head { display:flex; justify-content:space-between; gap:8px; margin-bottom:8px; }
  .cat-card-name { font-size:14px; font-weight:600; color:#1f2937; margin-bottom:8px; }
  .cat-card-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
  .cat-card-row { display:flex; flex-direction:column; gap:2px; }
  .cat-card-label { font-size:10px; color:#94a3b8; text-transform:uppercase; letter-spacing:.05em; }
  .nivel-1 td:first-child { font-weight:700; color:#1d4ed8; }
  .nivel-1 .cat-nombre { font-weight:700; font-size:14px; }
  .nivel-2 td:first-child { color:#7c3aed; font-weight:600; }
  .nivel-2 .cat-nombre { font-weight:600; }
  .nivel-3 td:first-child { color:#16a34a; }
  .nivel-4 td:first-child { color:#d97706; }
  .cat-table tr.nivel-1 td { background:#dbeafe; }
  .cat-table tr.nivel-2 td { background:#e0f2fe; }
  .cat-table tr.nivel-3 td { background:#ecfeff; }
  .cat-table tr.nivel-4 td { background:#f0f9ff; }
  .cat-table tr.nivel-5 td { background:#f8fafc; }
  .cat-codigo { font-family:'DM Mono',monospace; font-size:12px; }
  .tipo-badge { display:inline-flex; padding:2px 8px; border-radius:5px; font-size:10px; font-weight:600; }
  .tipo-ACTIVO { background:#dbeafe; color:#1d4ed8; }
  .tipo-PASIVO { background:#fce7f3; color:#be185d; }
  .tipo-CAPITAL { background:#ede9fe; color:#7c3aed; }
  .tipo-INGRESO { background:#dcfce7; color:#16a34a; }
  .tipo-GASTO { background:#fee2e2; color:#dc2626; }
  .tipo-COSTO { background:#ffedd5; color:#c2410c; }
  .mov-si { color:#16a34a; font-size:16px; }
  .mov-no { color:#e5e7eb; font-size:16px; }
  .estado-badge { display:inline-flex; align-items:center; padding:2px 8px;
    border-radius:5px; font-size:10px; font-weight:600; }
  .estado-activo { background:#dcfce7; color:#166534; }
  .estado-inactivo { background:#fee2e2; color:#991b1b; }
  .cat-table tr.row-inactiva td { opacity:0.7; }
  .cat-empty { padding:48px; text-align:center; color:#9ca3af; font-size:13px; }
  .cat-stats { display:flex; gap:12px; margin-bottom:18px; flex-wrap:wrap; }
  .cat-stat { background:white; border:1px solid #e5e7eb; border-radius:10px;
    padding:12px 16px; display:flex; flex-direction:column; gap:2px; }
  .cat-stat-num { font-size:20px; font-weight:700; color:#1f2937; }
  .cat-stat-label { font-size:11px; color:#9ca3af; font-weight:500; }
  .cat-mode { margin-bottom:12px; font-size:12px; color:#6b7280; display:flex; align-items:center; gap:8px; }
  .cat-mode-badge { display:inline-flex; align-items:center; padding:3px 8px; border-radius:999px; border:1px solid; font-size:11px; font-weight:700; }
  .cat-mode-badge.inherited { background:#eff6ff; border-color:#bfdbfe; color:#1d4ed8; }
  .cat-mode-badge.override { background:#dcfce7; border-color:#bbf7d0; color:#166534; }

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
  .error-msg { padding:10px 14px; background:#fef2f2; border:1px solid #fecaca;
    border-radius:8px; color:#b91c1c; font-size:12px; font-weight:500; margin-bottom:16px; }
  .cat-personalizada { font-size:10px; color:#f59e0b; font-weight:600;
    background:#fef9c3; padding:1px 6px; border-radius:4px; margin-left:6px; }

  @media (max-width: 900px) {
    .cat-header { flex-wrap:wrap; gap:10px; }
    .cat-title { font-size:18px; }
    .cat-search { width:100%; }
    .cat-toolbar { gap:8px; }
    .cat-export { margin-left:0; width:100%; }
    .cat-export-btn { flex:1; text-align:center; }
  }

  @media (max-width: 620px) {
    .cat-title span { display:block; margin-left:0; margin-top:2px; }
    .cat-stat { width:100%; }
    .cat-table-wrap { display:none; }
    .cat-mobile-list { display:block; }
    .modal-box { width:92vw; padding:20px; border-radius:12px; }
    .modal-actions { flex-direction:column; }
    .btn-cancelar, .btn-guardar { width:100%; }
  }

`;

const TIPOS = ['ACTIVO', 'PASIVO', 'CAPITAL', 'INGRESO', 'COSTO', 'GASTO'];
const NIVELES = [1, 2, 3, 4, 5];

export default function CatalogoEmpresa({ empresaId, canEdit }: { empresaId: number; canEdit: boolean }) {
  const [cuentas, setCuentas] = useState<CuentaEmpresa[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroNivel, setFiltroNivel] = useState<number | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<'TODAS' | 'ACTIVAS' | 'INACTIVAS'>('TODAS');
  const [busqueda, setBusqueda] = useState('');
  const [editando, setEditando] = useState<CuentaEmpresa | null>(null);
  const [form, setForm] = useState({ codigo: '', nombre: '', activo: true });
  const [exito, setExito] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [reiniciando, setReiniciando] = useState(false);

  const cargar = async () => {
    setCargando(true);
    setErrorMsg('');

    const { error: seedError } = await supabase.rpc('seed_plan_cuentas_empresa', {
      p_empresa_id: empresaId,
    });
    if (seedError) {
      setErrorMsg(seedError.message || 'No se pudo inicializar el catalogo para la empresa.');
      setCargando(false);
      return;
    }

    const { data, error } = await supabase
      .from('plan_cuentas_empresa')
      .select('*, plan_cuentas_base(codigo, nombre, nivel, tipo, naturaleza, acepta_movimiento)')
      .eq('empresa_id', empresaId)
      .order('codigo');

    if (error) {
      setErrorMsg(error.message || 'No se pudo cargar el catalogo contable.');
      setCuentas([]);
    } else {
      setCuentas((data || []) as any);
    }

    setCargando(false);
  };

  useEffect(() => {
    cargar();
  }, [empresaId]); // eslint-disable-line react-hooks/exhaustive-deps

  const abrirEditar = (cuenta: CuentaEmpresa) => {
    setEditando(cuenta);
    setForm({ codigo: cuenta.codigo, nombre: cuenta.nombre, activo: cuenta.activo });
  };

  const guardar = async () => {
    if (!editando) return;
    setErrorMsg('');
    const { error } = await supabase
      .from('plan_cuentas_empresa')
      .update(form)
      .eq('id', editando.id);
    if (error) {
      setErrorMsg(error.message || 'No se pudo actualizar la cuenta.');
      return;
    }
    setEditando(null);
    setExito('Cuenta actualizada correctamente');
    setTimeout(() => setExito(''), 3000);
    await cargar();
  };

  const reinicializarDesdeBase = async () => {
    const ok = window.confirm(
      'Esto restaurara el catalogo de esta empresa desde el plan base. Se perderan personalizaciones de codigo/nombre. Desea continuar?'
    );
    if (!ok) return;

    setReiniciando(true);
    setErrorMsg('');
    const { data, error } = await supabase.rpc('reset_plan_cuentas_empresa', {
      p_empresa_id: empresaId,
    });

    if (error) {
      setErrorMsg(error.message || 'No se pudo reinicializar el catalogo.');
      setReiniciando(false);
      return;
    }

    setExito(`Catalogo reinicializado (${Number(data || 0)} cambios aplicados).`);
    setTimeout(() => setExito(''), 3500);
    await cargar();
    setReiniciando(false);
  };

  const cuentasFiltradas = cuentas.filter((c) => {
    const base = c.plan_cuentas_base as any;
    if (filtroNivel && base?.nivel !== filtroNivel) return false;
    if (filtroTipo && base?.tipo !== filtroTipo) return false;
    if (filtroEstado === 'ACTIVAS' && !c.activo) return false;
    if (filtroEstado === 'INACTIVAS' && c.activo) return false;
    if (busqueda) {
      const b = busqueda.toLowerCase();
      return c.codigo.toLowerCase().includes(b) || c.nombre.toLowerCase().includes(b);
    }
    return true;
  });

  const stats = {
    total: cuentas.length,
    movimiento: cuentas.filter((c) => c.activo && (c.plan_cuentas_base as any)?.acepta_movimiento).length,
    personalizadas: cuentas.filter((c) => {
      const base = c.plan_cuentas_base as any;
      return c.codigo !== base?.codigo || c.nombre !== base?.nombre;
    }).length,
    inactivas: cuentas.filter((c) => !c.activo).length,
  };

  const hasOverride = stats.personalizadas > 0;

  const exportRows = cuentasFiltradas.map((c) => {
    const b = c.plan_cuentas_base as any;
    return {
      codigo_empresa: c.codigo,
      nombre_empresa: c.nombre,
      codigo_base: b?.codigo || '',
      nivel: b?.nivel || '',
      tipo: b?.tipo || '',
      naturaleza: b?.naturaleza || '',
      movimiento: formatBooleanFlag(!!b?.acepta_movimiento, 'export'),
    };
  });

  const exportColumns: ReportColumn<(typeof exportRows)[number]>[] = [
    { key: 'codigo_empresa', title: 'Codigo Empresa', getValue: (r) => r.codigo_empresa, align: 'left', width: '12%' },
    { key: 'nombre_empresa', title: 'Nombre Empresa', getValue: (r) => r.nombre_empresa, align: 'left', width: '32%' },
    { key: 'codigo_base', title: 'Codigo Base', getValue: (r) => r.codigo_base, width: '12%' },
    { key: 'nivel', title: 'Nivel', getValue: (r) => r.nivel, width: '8%' },
    { key: 'tipo', title: 'Tipo', getValue: (r) => r.tipo, width: '10%' },
    { key: 'naturaleza', title: 'Naturaleza', getValue: (r) => r.naturaleza, width: '14%' },
    { key: 'movimiento', title: 'Mov.', getValue: (r) => r.movimiento, width: '12%' },
  ];

  const exportExcelCatalogoEmpresa = async () => {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Catalogo Empresa', {
      views: [{ state: 'frozen', ySplit: 5, showGridLines: false }],
    });
    const company = (typeof window !== 'undefined' ? localStorage.getItem('mya_report_company_name') : '') || 'Empresa';
    const title = 'Catalogo Contable (EMPRESA)';
    const subtitle = `Total: ${cuentasFiltradas.length} cuentas`;

    ws.columns = [
      { key: 'codigo_empresa', width: 18 },
      { key: 'nombre_empresa', width: 44 },
      { key: 'codigo_base', width: 18 },
      { key: 'nivel', width: 10 },
      { key: 'tipo', width: 14 },
      { key: 'naturaleza', width: 14 },
      { key: 'movimiento', width: 12 },
    ];
    ws.pageSetup = {
      paperSize: 9,
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      horizontalCentered: true,
      margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
    };

    const borderColor = { argb: 'FFD1D5DB' };
    const borderHeader = {
      top: { style: 'thin' as const, color: borderColor },
      bottom: { style: 'thin' as const, color: borderColor },
      left: { style: 'thin' as const, color: borderColor },
      right: { style: 'thin' as const, color: borderColor },
    };
    const borderVertical = {
      left: { style: 'thin' as const, color: borderColor },
      right: { style: 'thin' as const, color: borderColor },
    };
    const borderVerticalBottom = {
      left: { style: 'thin' as const, color: borderColor },
      right: { style: 'thin' as const, color: borderColor },
      bottom: { style: 'thin' as const, color: borderColor },
    };
    const levelFill: Record<number, string> = {
      1: 'FFDBEAFE',
      2: 'FFE0F2FE',
      3: 'FFECFEFF',
      4: 'FFF0F9FF',
      5: 'FFF8FAFC',
    };

    ws.mergeCells('A1:G1');
    ws.getCell('A1').value = company;
    ws.getCell('A1').font = { bold: true, size: 14 };
    ws.getCell('A1').alignment = { horizontal: 'center' };

    ws.mergeCells('A2:G2');
    ws.getCell('A2').value = title;
    ws.getCell('A2').font = { bold: true, size: 13 };
    ws.getCell('A2').alignment = { horizontal: 'center' };

    ws.mergeCells('A3:G3');
    ws.getCell('A3').value = subtitle;
    ws.getCell('A3').font = { italic: true, size: 10 };
    ws.getCell('A3').alignment = { horizontal: 'center' };

    ws.addRow([]);
    const h = ws.addRow(['Codigo Empresa', 'Nombre Empresa', 'Codigo Base', 'Nivel', 'Tipo', 'Naturaleza', 'Movimiento']);
    h.eachCell((c, idx) => {
      c.font = { bold: true, color: { argb: 'FF1F2937' } };
      c.alignment = { horizontal: 'center', vertical: 'middle' };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
      c.border = {
        ...borderHeader,
        left: idx === 1 ? borderHeader.left : borderVertical.left,
        right: idx === 7 ? borderHeader.right : borderVertical.right,
      };
    });

    cuentasFiltradas.forEach((cuenta, i) => {
      const base = cuenta.plan_cuentas_base as any;
      const nivel = Math.max(1, Math.min(5, Number(base?.nivel) || 5));
      const fillArgb = levelFill[nivel] || 'FFF8FAFC';
      const isLast = i === cuentasFiltradas.length - 1;
      const row = ws.addRow([
        cuenta.codigo,
        cuenta.nombre,
        base?.codigo || '',
        `Nivel ${base?.nivel || ''}`,
        base?.tipo || '',
        base?.naturaleza || '',
        formatBooleanFlag(!!base?.acepta_movimiento, 'export'),
      ]);

      row.getCell(1).font = { name: 'Consolas', size: 10, color: { argb: 'FF0F766E' } };
      row.getCell(3).font = { name: 'Consolas', size: 10, color: { argb: 'FF6B7280' } };
      row.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' };

      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillArgb } };
        cell.border = isLast ? borderVerticalBottom : borderVertical;
      });
    });

    ws.pageSetup.printArea = `A1:G${ws.rowCount}`;
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'catalogo_empresa.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="cat-wrap">
        <div className="cat-header">
          <div className="cat-title">
            Catalogo Contable (EMPRESA)
            <span>{cuentasFiltradas.length} cuentas</span>
          </div>
          {canEdit && (
            <button
              className="btn-cancelar"
              onClick={reinicializarDesdeBase}
              disabled={reiniciando}
              style={{ minWidth: '210px' }}
              title="Elimina personalizaciones y vuelve al catalogo base para esta empresa"
            >
              {reiniciando ? 'Restaurando...' : 'Volver a herencia base'}
            </button>
          )}
        </div>

        {errorMsg && <div className="error-msg">{errorMsg}</div>}
        {exito && <div className="success-msg">OK {exito}</div>}
        <div className="cat-mode">
          <span>Modo actual:</span>
          <span className={`cat-mode-badge ${hasOverride ? 'override' : 'inherited'}`}>
            {hasOverride ? 'Override por empresa' : 'Herencia base'}
          </span>
          <span>
            {hasOverride
              ? 'Esta empresa tiene cuentas personalizadas.'
              : 'Esta empresa usa el catalogo base sin cambios.'}
          </span>
        </div>

        <div className="cat-stats">
          <div className="cat-stat">
            <span className="cat-stat-num">{stats.total}</span>
            <span className="cat-stat-label">Total Cuentas</span>
          </div>
          <div className="cat-stat">
            <span className="cat-stat-num" style={{ color: '#16a34a' }}>{stats.movimiento}</span>
            <span className="cat-stat-label">Aceptan Movimiento</span>
          </div>
          <div className="cat-stat">
            <span className="cat-stat-num" style={{ color: '#f59e0b' }}>{stats.personalizadas}</span>
            <span className="cat-stat-label">Personalizadas</span>
          </div>
          <div className="cat-stat">
            <span className="cat-stat-num" style={{ color: '#991b1b' }}>{stats.inactivas}</span>
            <span className="cat-stat-label">Inactivas</span>
          </div>
        </div>

        <div className="cat-toolbar">
          <input
            className="cat-search"
            placeholder="Buscar por codigo o nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <div className="cat-filters">
            {NIVELES.map((n) => (
              <button
                key={n}
                className={`cat-filter-btn ${filtroNivel === n ? 'active' : ''}`}
                onClick={() => setFiltroNivel(filtroNivel === n ? null : n)}
              >
                Nivel {n}
              </button>
            ))}
          </div>
          <div className="cat-filters">
            {TIPOS.map((t) => (
              <button
                key={t}
                className={`tipo-btn ${filtroTipo === t ? t : filtroTipo ? 'inactive' : t}`}
                onClick={() => setFiltroTipo(filtroTipo === t ? null : t)}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="cat-filters">
            <button
              className={`cat-filter-btn ${filtroEstado === 'TODAS' ? 'active' : ''}`}
              onClick={() => setFiltroEstado('TODAS')}
            >
              Todas
            </button>
            <button
              className={`cat-filter-btn ${filtroEstado === 'ACTIVAS' ? 'active' : ''}`}
              onClick={() => setFiltroEstado('ACTIVAS')}
            >
              Activas
            </button>
            <button
              className={`cat-filter-btn ${filtroEstado === 'INACTIVAS' ? 'active' : ''}`}
              onClick={() => setFiltroEstado('INACTIVAS')}
            >
              Inactivas
            </button>
          </div>
          <ListToolbar
            className="cat-export"
            exports={(
              <>
                <button
                  className="cat-export-btn"
                  onClick={() => exportCsv('catalogo_empresa.csv', exportRows, exportColumns)}
                  disabled={exportRows.length === 0}
                >
                  CSV
                </button>
                <button
                  className="cat-export-btn"
                  onClick={exportExcelCatalogoEmpresa}
                  disabled={exportRows.length === 0}
                >
                  EXCEL
                </button>
                <button
                  className="cat-export-btn"
                  onClick={() =>
                    exportPdfWithPrint({
                      title: 'Catalogo Contable (EMPRESA)',
                      subtitle: `Total: ${exportRows.length} cuentas`,
                      rows: exportRows,
                      columns: exportColumns,
                      orientation: 'landscape',
                    })
                  }
                  disabled={exportRows.length === 0}
                >
                  PDF
                </button>
              </>
            )}
          />
        </div>

        <div className="cat-table-wrap rv-desktop-table">
          <table className="cat-table">
            <thead>
              <tr>
                <th>Codigo Empresa</th>
                <th>Nombre Empresa</th>
                <th>Codigo Base</th>
                <th>Nivel</th>
                <th>Tipo</th>
                <th>Naturaleza</th>
                <th>Movimiento</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan={9} className="cat-empty">Cargando catalogo...</td></tr>
              ) : cuentasFiltradas.length === 0 ? (
                <tr><td colSpan={9} className="cat-empty">No se encontraron cuentas</td></tr>
              ) : cuentasFiltradas.map((cuenta) => {
                const base = cuenta.plan_cuentas_base as any;
                const personalizada = cuenta.codigo !== base?.codigo || cuenta.nombre !== base?.nombre;
                return (
                  <tr key={cuenta.id} className={`nivel-${base?.nivel} ${!cuenta.activo ? 'row-inactiva' : ''}`}>
                    <td>
                      <span className="cat-codigo">
                        {cuenta.codigo}
                        {personalizada && <span className="cat-personalizada">MOD</span>}
                      </span>
                    </td>
                    <td>
                      <span className="cat-nombre">
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
                        {formatBooleanFlag(!!base?.acepta_movimiento, 'ui')}
                      </span>
                    </td>
                    <td>
                      <span className={`estado-badge ${cuenta.activo ? 'estado-activo' : 'estado-inactivo'}`}>
                        {cuenta.activo ? 'ACTIVA' : 'INACTIVA'}
                      </span>
                    </td>
                    <td>
                      <button className="btn-editar" onClick={() => abrirEditar(cuenta)} disabled={!canEdit}>
                        Editar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="cat-mobile-list rv-mobile-cards">
          {cargando ? (
            <div className="cat-empty">Cargando catalogo...</div>
          ) : cuentasFiltradas.length === 0 ? (
            <div className="cat-empty">No se encontraron cuentas</div>
          ) : cuentasFiltradas.map((cuenta) => {
            const base = cuenta.plan_cuentas_base as any;
            const personalizada = cuenta.codigo !== base?.codigo || cuenta.nombre !== base?.nombre;
            return (
              <div key={`m-${cuenta.id}`} className={`cat-card nivel-${base?.nivel}`}>
                <div className="cat-card-head">
                  <span className="cat-codigo">
                    {cuenta.codigo}
                    {personalizada && <span className="cat-personalizada">MOD</span>}
                  </span>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>Nivel {base?.nivel}</span>
                </div>
                <div className="cat-card-name">{cuenta.nombre}</div>
                <div className="cat-card-grid">
                  <div className="cat-card-row">
                    <span className="cat-card-label">Codigo Base</span>
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: '#9ca3af' }}>{base?.codigo}</span>
                  </div>
                  <div className="cat-card-row">
                    <span className="cat-card-label">Tipo</span>
                    <span className={`tipo-badge tipo-${base?.tipo}`}>{base?.tipo}</span>
                  </div>
                  <div className="cat-card-row">
                    <span className="cat-card-label">Naturaleza</span>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>{base?.naturaleza}</span>
                  </div>
                  <div className="cat-card-row">
                    <span className="cat-card-label">Movimiento</span>
                    <span style={{ color: base?.acepta_movimiento ? '#16a34a' : '#9ca3af', fontWeight: 600 }}>
                      {formatBooleanFlag(!!base?.acepta_movimiento, 'ui')}
                    </span>
                  </div>
                  <div className="cat-card-row">
                    <span className="cat-card-label">Estado</span>
                    <span className={`estado-badge ${cuenta.activo ? 'estado-activo' : 'estado-inactivo'}`}>
                      {cuenta.activo ? 'ACTIVA' : 'INACTIVA'}
                    </span>
                  </div>
                </div>
                <div style={{ marginTop: '10px' }}>
                  <button className="btn-editar" onClick={() => abrirEditar(cuenta)} disabled={!canEdit}>
                    Editar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {editando && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-title">Personalizar Cuenta</div>
            <div className="modal-sub">Modificando cuenta para esta empresa unicamente</div>
            <div className="modal-info">
              Codigo base: <span>{(editando.plan_cuentas_base as any)?.codigo}</span> - Nombre base:{' '}
              <span>{(editando.plan_cuentas_base as any)?.nombre}</span>
            </div>
            <div className="modal-field">
              <label className="modal-label">Codigo Personalizado</label>
              <input
                className="modal-input"
                value={form.codigo}
                onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))}
              />
            </div>
            <div className="modal-field">
              <label className="modal-label">Nombre Personalizado</label>
              <input
                className="modal-input"
                value={form.nombre}
                onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value.toUpperCase() }))}
              />
            </div>
            <label className="modal-check">
              <input
                type="checkbox"
                checked={form.activo}
                onChange={(e) => setForm((p) => ({ ...p, activo: e.target.checked }))}
              />
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
