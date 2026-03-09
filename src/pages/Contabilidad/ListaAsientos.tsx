import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import FormAsiento from './FormAsiento';
import { exportCsv, exportExcelXml, exportPdfWithPrint, formatMoneyCRC, ReportColumn } from '../../utils/reporting';
import ListToolbar from '../../components/ListToolbar';

const ASIENTO_OPEN_PREFILL_KEY = 'mya_asiento_open_prefill';

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
  categoria_id: number;
  categoria_base_id: number;
  codigo: string;
  descripcion: string;
  tipo_id: number | null;
  modo: 'override_empresa' | 'herencia_base';
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

interface EmpresaParametrosResp {
  fiscal?: {
    fecha_inicio?: string | null;
    fecha_fin?: string | null;
  };
  cierre_contable?: {
    activo?: boolean;
    fecha_inicio?: string | null;
    fecha_fin?: string | null;
    modulos_aplica?: string[] | null;
  };
}

const styles = `
  .asi-wrap { padding:0; }
  .asi-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
  .asi-head-right { display:flex; flex-direction:column; align-items:flex-end; gap:6px; }
  .asi-title { font-size:22px; font-weight:600; color:#1f2937; letter-spacing:-0.3px; }
  .asi-title span { font-size:13px; font-weight:400; color:#9ca3af; margin-left:8px; }
  .asi-toolbar { display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin-bottom:18px; }
  .asi-export { margin-left:auto; display:flex; gap:8px; }
  .asi-export-btn { padding:7px 12px; border-radius:8px; border:1px solid #e5e7eb; background:#fff; color:#334155; font-size:12px; font-weight:600; cursor:pointer; }
  .asi-export-btn:hover { border-color:#22c55e; color:#16a34a; background:#f0fdf4; }
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
  .btn-ver:disabled { background:#f8fafc; border-color:#e5e7eb; color:#94a3b8; cursor:not-allowed; }
  .btn-anular { padding:5px 10px; background:#fef2f2; border:1px solid #fecaca;
    border-radius:6px; color:#dc2626; font-size:11px; font-weight:500; cursor:pointer; }
  .btn-anular:hover { background:#dc2626; color:white; }
  .btn-anular:disabled { background:#f8fafc; border-color:#e5e7eb; color:#94a3b8; cursor:not-allowed; }
  .asi-empty { padding:48px; text-align:center; color:#9ca3af; font-size:13px; }
  .asi-stats { display:flex; gap:12px; margin-bottom:18px; flex-wrap:wrap; }
  .asi-stat { background:white; border:1px solid #e5e7eb; border-radius:10px;
    padding:12px 16px; display:flex; flex-direction:column; gap:2px; min-width:120px; }
  .asi-stat-num { font-size:20px; font-weight:700; color:#1f2937; }
  .asi-stat-label { font-size:11px; color:#9ca3af; font-weight:500; }
  .money-head { text-align:right !important; }
  .money-right { text-align:right !important; }
  .money-cell { font-family:'DM Mono',monospace; }
  .btn-nuevo { padding:10px 18px; background:linear-gradient(135deg,#16a34a,#22c55e);
    border:none; border-radius:10px; color:white; font-size:13px; font-weight:600;
    cursor:pointer; transition:opacity 0.2s; }
  .btn-nuevo:hover { opacity:0.9; }
  .btn-nuevo:disabled { opacity:0.55; cursor:not-allowed; }
  .anio-select { padding:8px 12px; border:1px solid #e5e7eb; border-radius:8px;
    font-size:13px; color:#1f2937; outline:none; font-family:'DM Sans',sans-serif; }
  .asi-periodo { margin-bottom:10px; font-size:12px; color:#16a34a; text-align:right; }
  .asi-periodo .lbl { font-weight:700; margin-right:6px; color:#16a34a; }
  .asi-periodo-fiscal { margin-bottom:6px; font-size:12px; color:#0f766e; text-align:right; }
  .asi-periodo-fiscal .lbl { font-weight:700; margin-right:6px; color:#0f766e; }
  .asi-periodo-estado { margin-bottom:6px; font-size:12px; color:#16a34a; text-align:right; }
  .asi-periodo-estado .lbl { font-weight:700; margin-right:6px; color:#16a34a; }
  .asi-warn { margin:0 0 12px; padding:10px 12px; border:1px solid #fcd34d; background:#fffbeb; color:#92400e; border-radius:8px; font-size:12px; display:flex; align-items:center; justify-content:space-between; gap:10px; }
  .asi-warn-btn { padding:7px 10px; border-radius:8px; border:1px solid #f59e0b; background:#fff; color:#92400e; font-size:12px; font-weight:600; cursor:pointer; }
  .asi-warn-btn:hover { background:#fef3c7; }
  .asi-modal-backdrop { position:fixed; inset:0; background:rgba(15,23,42,.38); display:flex; align-items:center; justify-content:center; z-index:1200; padding:16px; }
  .asi-modal { width:min(460px, 100%); background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:14px; }
  .asi-modal-title { font-size:16px; font-weight:700; color:#1f2937; margin-bottom:6px; }
  .asi-modal-sub { font-size:12px; color:#64748b; margin-bottom:12px; }
  .asi-modal-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px; }
  .asi-modal-field { display:flex; flex-direction:column; gap:4px; }
  .asi-modal-field label { font-size:11px; color:#475569; }
  .asi-modal-field input { width:100%; border:1px solid #d1d5db; border-radius:8px; padding:8px 10px; font-size:12px; }
  .asi-modal-actions { display:flex; justify-content:flex-end; gap:8px; margin-top:8px; }
  .asi-modal-btn { padding:8px 10px; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer; border:1px solid #d1d5db; background:#fff; color:#334155; }
  .asi-modal-btn.primary { border-color:#16a34a; background:#16a34a; color:#fff; }
  .asi-modal-btn:disabled { opacity:.6; cursor:not-allowed; }
  .asi-modal-err { margin-bottom:8px; border:1px solid #fecaca; background:#fef2f2; color:#b91c1c; border-radius:8px; padding:8px 10px; font-size:12px; }

  @media (max-width: 900px) {
    .asi-header { flex-wrap:wrap; gap:10px; }
    .asi-title { font-size:20px; }
    .asi-toolbar { gap:8px; }
    .asi-search { width:100%; }
    .anio-select { width:100%; }
    .btn-nuevo { width:100%; }
    .asi-stats { gap:8px; }
    .asi-stat { min-width:calc(50% - 4px); padding:10px 12px; }
    .asi-export { margin-left:0; width:100%; }
    .asi-export-btn { flex:1; text-align:center; }
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

export default function ListaAsientos({ empresaId, canConfigurarCierreRapido = false }: { empresaId: number; canConfigurarCierreRapido?: boolean }) {
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
  const [categoriasById, setCategoriasById] = useState<Record<number, CategoriaAsiento>>({});
  const [errorLista, setErrorLista] = useState('');
  const [errorConsolidado, setErrorConsolidado] = useState('');
  const [cierreContable, setCierreContable] = useState<{
    activo: boolean;
    fechaInicio: string | null;
    fechaFin: string | null;
    fiscalInicio: string | null;
    fiscalFin: string | null;
    modulosAplica: string[];
  }>({ activo: false, fechaInicio: null, fechaFin: null, fiscalInicio: null, fiscalFin: null, modulosAplica: ['contabilidad'] });
  const [cierreLoaded, setCierreLoaded] = useState(false);
  const cierreActivo = Boolean(cierreContable.activo);
  const cierreConRango = Boolean(cierreContable.fechaInicio && cierreContable.fechaFin);
  const periodoConfigurado = cierreActivo && cierreConRango;
  const estadoCierreTexto = !cierreLoaded
    ? 'Cargando...'
    : (periodoConfigurado
        ? 'Periodo Cerrado'
        : (cierreActivo ? 'Cierre activo sin rango' : 'Sin cierre activo'));
  const puedeOperarAsientos = true;
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [cfgInicio, setCfgInicio] = useState('');
  const [cfgFin, setCfgFin] = useState('');
  const [cfgErr, setCfgErr] = useState('');
  const [cfgSaving, setCfgSaving] = useState(false);

  const formatMoney = (n: number, moneda: 'CRC' | 'USD' = 'CRC') => {
    const valor = Number(n || 0);
    if (moneda === 'USD') {
      return `$ ${valor.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `₡ ${formatMoneyCRC(valor)}`;
  };


  const formatFechaDDMMAAAA = (value: string | null) => {
    if (!value) return '';
    const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return String(value);
    return `${m[3]}/${m[2]}/${m[1]}`;
  };
  const fechaHoy = formatFechaDDMMAAAA(new Date().toISOString().slice(0, 10));
  const periodoTexto = (() => {
    if (!cierreLoaded) return 'Cargando...';
    const ini = formatFechaDDMMAAAA(cierreContable.fechaInicio);
    const fin = formatFechaDDMMAAAA(cierreContable.fechaFin);
    if (ini && fin) return `${ini} al ${fin}`;
    if (ini) return `Desde ${ini}`;
    if (fin) return `Hasta ${fin}`;
    return `No configurado (${fechaHoy})`;
  })();
  const periodoFiscalTexto = (() => {
    if (!cierreLoaded) return 'Cargando...';
    const ini = formatFechaDDMMAAAA(cierreContable.fiscalInicio);
    const fin = formatFechaDDMMAAAA(cierreContable.fiscalFin);
    if (ini && fin) return `${ini} al ${fin}`;
    if (ini) return `Desde ${ini}`;
    if (fin) return `Hasta ${fin}`;
    return 'No configurado';
  })();

  const cargar = async () => {
    setCargando(true);
    setErrorLista('');
    let query = supabase
      .from('asientos')
      .select('*, asiento_categorias(codigo, descripcion)')
      .eq('empresa_id', empresaId)
      .order('id', { ascending: false });

    const { data, error } = await query;
    if (error) {
      setAsientos([]);
      setErrorLista(error.message || 'No se pudo cargar la lista de asientos');
    } else if (data) {
      setAsientos(data as any);
    }
    setCargando(false);
  };

  const cargarCategorias = async () => {
    const { data, error } = await supabase.rpc('get_asiento_categorias_effective', {
      p_empresa_id: empresaId,
    });

    if (!error && data) {
      const catRows = data as CategoriaAsiento[];
      setCategorias(catRows);
      const map: Record<number, CategoriaAsiento> = {};
      catRows.forEach((c) => { map[c.categoria_base_id] = c; });
      setCategoriasById(map);
      return;
    }

    const { data: fallback } = await supabase
      .from('asiento_categorias')
      .select('id, codigo, descripcion, tipo_id, activo')
      .eq('activo', true)
      .order('codigo');

    if (fallback) {
      const mapped = fallback.map((c: any) => ({
        categoria_id: c.id,
        categoria_base_id: c.id,
        codigo: c.codigo,
        descripcion: c.descripcion,
        tipo_id: c.tipo_id ?? null,
        modo: 'herencia_base' as const,
      }));
      setCategorias(mapped);
      const map: Record<number, CategoriaAsiento> = {};
      mapped.forEach((c) => { map[c.categoria_base_id] = c; });
      setCategoriasById(map);
    }
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
    setErrorConsolidado('');
    const fechaDesde = `${anioTarget}-01-01`;
    const fechaHasta = `${anioTarget}-12-31`;
    const { data, error } = await supabase.rpc('reporte_asientos_por_tipo', {
      p_empresa_id: empresaId,
      p_fecha_desde: fechaDesde,
      p_fecha_hasta: fechaHasta,
    });
    if (error) {
      setConsolidado([]);
      setErrorConsolidado(error.message || 'No se pudo cargar el consolidado por tipo');
    } else {
      setConsolidado((data || []) as ConsolidadoTipo[]);
    }
  };

  const cargarPeriodoContable = async () => {
    setCierreLoaded(false);
    const { data, error } = await supabase.rpc('get_empresa_parametros', { p_empresa_id: empresaId });
    if (error || !data) {
      setCierreContable({ activo: false, fechaInicio: null, fechaFin: null, fiscalInicio: null, fiscalFin: null, modulosAplica: ['contabilidad'] });
      setCierreLoaded(true);
      return;
    }
    const parsed = data as EmpresaParametrosResp;
    setCierreContable({
      activo: Boolean(parsed?.cierre_contable?.activo),
      fechaInicio: parsed?.cierre_contable?.fecha_inicio || null,
      fechaFin: parsed?.cierre_contable?.fecha_fin || null,
      fiscalInicio: parsed?.fiscal?.fecha_inicio || null,
      fiscalFin: parsed?.fiscal?.fecha_fin || null,
      modulosAplica: (parsed?.cierre_contable?.modulos_aplica || ['contabilidad']) as string[],
    });
    setCierreLoaded(true);
  };

  const guardarConfiguracionRapida = async () => {
    setCfgErr('');
    if (!cfgInicio || !cfgFin) {
      setCfgErr('Debe indicar Inicio y Final del cierre contable.');
      return;
    }
    if (cfgInicio > cfgFin) {
      setCfgErr('Rango invalido: Inicio no puede ser mayor que Final.');
      return;
    }
    setCfgSaving(true);
    const modulos = cierreContable.modulosAplica?.length ? cierreContable.modulosAplica : ['contabilidad'];
    const { error } = await supabase.rpc('set_empresa_parametros', {
      p_empresa_id: empresaId,
      p_payload: {
        cierre_contable: {
          activo: true,
          fecha_inicio: cfgInicio,
          fecha_fin: cfgFin,
          modulos_aplica: modulos,
        },
      },
    });
    setCfgSaving(false);
    if (error) {
      setCfgErr(error.message || 'No se pudo guardar la configuracion de cierre.');
      return;
    }
    setShowConfigModal(false);
    await cargarPeriodoContable();
  };

  useEffect(() => { cargar(); cargarCategorias(); cargarTipos(); cargarPeriodoContable(); }, [empresaId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { cargarConsolidado(anio); }, [empresaId, anio]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (vista !== 'lista' || asientos.length === 0) return;
    try {
      const raw = sessionStorage.getItem(ASIENTO_OPEN_PREFILL_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as { empresaId?: number; asientoId?: number };
      if (Number(data.empresaId || 0) !== Number(empresaId)) return;
      const targetId = Number(data.asientoId || 0);
      if (!targetId) return;
      const target = asientos.find((a) => Number(a.id) === targetId);
      if (!target) return;
      setAsientoVer(target);
      setVista('ver');
      sessionStorage.removeItem(ASIENTO_OPEN_PREFILL_KEY);
    } catch {
      // ignore storage errors
    }
  }, [asientos, vista, empresaId]);

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
      const cat = categoriasById[a.categoria_id];
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

  const exportRows = asientosFiltrados.map((a) => ({
    numero: a.numero_formato,
    categoria: categoriasById[a.categoria_id]?.codigo || (a.asiento_categorias as any)?.codigo || '',
    fecha: a.fecha,
    descripcion: a.descripcion,
    moneda: a.moneda,
    tipo_cambio: a.tipo_cambio ?? '',
    estado: a.estado,
  }));

  const exportColumns: ReportColumn<(typeof exportRows)[number]>[] = [
    { key: 'numero', title: 'Numero', getValue: (r) => r.numero, align: 'left', width: '15%' },
    { key: 'categoria', title: 'Categoria', getValue: (r) => r.categoria, width: '10%' },
    { key: 'fecha', title: 'Fecha', getValue: (r) => r.fecha, width: '12%' },
    { key: 'descripcion', title: 'Descripcion', getValue: (r) => r.descripcion, align: 'left', width: '33%' },
    { key: 'moneda', title: 'Moneda', getValue: (r) => r.moneda, width: '8%' },
    { key: 'tipo_cambio', title: 'Tipo Cambio', getValue: (r) => r.tipo_cambio, width: '10%' },
    { key: 'estado', title: 'Estado', getValue: (r) => r.estado, width: '12%' },
  ];

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
          <div className="asi-head-right">
            <div className="asi-periodo-estado">
              <span className="lbl">Estado:</span>
              {estadoCierreTexto}
            </div>
            <div className="asi-periodo-fiscal">
              <span className="lbl">Periodo Fiscal:</span>
              {periodoFiscalTexto}
            </div>
            <div className="asi-periodo">
              <span className="lbl">Periodo Contable:</span>
              {periodoTexto}
            </div>
            <button
              className="btn-nuevo"
              onClick={() => setVista('nuevo')}
              disabled={!puedeOperarAsientos}
              title={!puedeOperarAsientos ? 'Operacion no disponible' : undefined}
            >
              + Añadir Asiento
            </button>
          </div>
        </div>

        {cierreLoaded && cierreActivo && !cierreConRango && (
          <div className="asi-warn">
            <span>
              Cierre activo sin rango completo: defina inicio/fin para aplicar bloqueo por fechas.
            </span>
            {canConfigurarCierreRapido && (
              <button
                className="asi-warn-btn"
                onClick={() => {
                  setCfgInicio(cierreContable.fechaInicio || '');
                  setCfgFin(cierreContable.fechaFin || '');
                  setCfgErr('');
                  setShowConfigModal(true);
                }}
              >
                Configurar cierre
              </button>
            )}
          </div>
        )}

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
          {errorConsolidado && (
            <div style={{ margin: '10px', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 8, padding: '10px 12px', fontSize: 12 }}>
              Error consolidado: {errorConsolidado}
            </div>
          )}
          <table className="asi-table">
            <thead>
              <tr>
                <th>Consolidado por Tipo ({anio})</th>
                <th>Asientos</th>
                <th>Moneda</th>
                <th className="money-head">Debito</th>
                <th className="money-head">Credito</th>
              </tr>
            </thead>
            <tbody>
              {consolidado.length === 0 ? (
                <tr><td colSpan={5} className="asi-empty">Sin movimientos confirmados para el año seleccionado</td></tr>
              ) : consolidado.map((row) => (
                <tr key={row.tipo_id}>
                  <td>
                    <span className="cat-badge">{row.tipo_codigo}</span>
                    <span style={{ marginLeft: '8px' }}>{row.tipo_nombre}</span>
                  </td>
                  <td style={{ fontFamily: 'DM Mono, monospace' }}>{row.cantidad_asientos}</td>
                  <td style={{ fontFamily: 'DM Mono, monospace', fontSize: '12px' }}>CRC</td>
                  <td className="money-cell money-right">{formatMoney(Number(row.total_debito_crc || 0), 'CRC')}</td>
                  <td className="money-cell money-right">{formatMoney(Number(row.total_credito_crc || 0), 'CRC')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {errorLista && (
          <div style={{ marginBottom: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 8, padding: '10px 12px', fontSize: 12 }}>
            Error lista: {errorLista}
          </div>
        )}

        {/* Toolbar */}
        <ListToolbar
          className="asi-toolbar"
          search={(
            <>
              <input className="asi-search" placeholder="Buscar número o descripción..."
                value={busqueda} onChange={e => setBusqueda(e.target.value)} />
              <select className="anio-select" value={anio}
                onChange={e => setAnio(parseInt(e.target.value, 10))}>
                {[2023, 2024, 2025, 2026].map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </>
          )}
          filters={(
            <>
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
                  <button key={cat.categoria_id}
                    className={`asi-filtro-btn ${filtroCategoria === cat.categoria_base_id ? 'active' : ''}`}
                    onClick={() => setFiltroCategoria(filtroCategoria === cat.categoria_base_id ? null : cat.categoria_base_id)}>
                    {cat.codigo}
                  </button>
                ))}
              </div>
            </>
          )}
          exports={(
            <>
              <button
                className="asi-export-btn"
                onClick={() => exportCsv('asientos_contables.csv', exportRows, exportColumns)}
                disabled={exportRows.length === 0}
              >
                CSV
              </button>
              <button
                className="asi-export-btn"
                onClick={() => exportExcelXml('asientos_contables.xls', exportRows, exportColumns)}
                disabled={exportRows.length === 0}
              >
                EXCEL
              </button>
              <button
                className="asi-export-btn"
                onClick={() =>
                  exportPdfWithPrint({
                    title: 'Asientos Contables',
                    subtitle: `Total: ${exportRows.length} registros`,
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
                <tr key={asi.id} onClick={() => { if (puedeOperarAsientos) { setAsientoVer(asi); setVista('ver'); } }}>
                  <td><span className="asi-num">{asi.numero_formato}</span></td>
                  <td>
                    <span className="cat-badge">
                      {categoriasById[asi.categoria_id]?.codigo || (asi.asiento_categorias as any)?.codigo}
                    </span>
                  </td>
                  <td><span className="asi-fecha">{asi.fecha}</span></td>
                  <td>{asi.descripcion}</td>
                  <td>
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '12px' }}>
                      {asi.moneda} {(asi.moneda === 'USD' || asi.moneda === 'AMBAS') ? `TC Venta: ${asi.tipo_cambio}` : ''}
                    </span>
                  </td>
                  <td>
                    <span className={`estado-badge estado-${asi.estado}`}>{asi.estado}</span>
                  </td>
                  <td>
                    <div className="asi-actions" onClick={e => e.stopPropagation()}>
                      <button className="btn-ver"
                        onClick={() => { setAsientoVer(asi); setVista('ver'); }}
                        disabled={!puedeOperarAsientos}>
                        Ver
                      </button>
                      {asi.estado !== 'ANULADO' && asi.estado !== 'BORRADOR' && (
                        <button className="btn-anular" onClick={() => anular(asi)} disabled={!puedeOperarAsientos}>
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
            <div key={`m-${asi.id}`} className="asi-card" onClick={() => { if (puedeOperarAsientos) { setAsientoVer(asi); setVista('ver'); } }}>
              <div className="asi-card-head">
                <span className="asi-num">{asi.numero_formato}</span>
                <span className={`estado-badge estado-${asi.estado}`}>{asi.estado}</span>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <span className="cat-badge">
                  {categoriasById[asi.categoria_id]?.codigo || (asi.asiento_categorias as any)?.codigo}
                </span>
              </div>
              <div className="asi-card-grid">
                <div className="asi-card-row">
                  <span className="asi-card-label">Fecha</span>
                  <span className="asi-fecha">{asi.fecha}</span>
                </div>
                <div className="asi-card-row">
                  <span className="asi-card-label">Moneda</span>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '12px' }}>
                    {asi.moneda} {(asi.moneda === 'USD' || asi.moneda === 'AMBAS') ? `TC Venta: ${asi.tipo_cambio}` : ''}
                  </span>
                </div>
              </div>
              <div style={{ marginBottom: '10px', fontSize: '13px', color: '#374151' }}>{asi.descripcion}</div>
              <div className="asi-actions" onClick={(e) => e.stopPropagation()}>
                <button className="btn-ver" onClick={() => { setAsientoVer(asi); setVista('ver'); }} disabled={!puedeOperarAsientos}>Ver</button>
                {asi.estado !== 'ANULADO' && asi.estado !== 'BORRADOR' && (
                  <button className="btn-anular" onClick={() => anular(asi)} disabled={!puedeOperarAsientos}>Anular</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      {showConfigModal && (
        <div className="asi-modal-backdrop" onClick={() => { if (!cfgSaving) setShowConfigModal(false); }}>
          <div className="asi-modal" onClick={(e) => e.stopPropagation()}>
            <div className="asi-modal-title">Configurar Cierre Contable</div>
            <div className="asi-modal-sub">Defina solo Inicio y Final para habilitar control de asientos.</div>
            {cfgErr && <div className="asi-modal-err">{cfgErr}</div>}
            <div className="asi-modal-row">
              <div className="asi-modal-field">
                <label>Inicio cierre</label>
                <input type="date" value={cfgInicio} onChange={(e) => setCfgInicio(e.target.value)} disabled={cfgSaving} />
              </div>
              <div className="asi-modal-field">
                <label>Final cierre</label>
                <input type="date" value={cfgFin} onChange={(e) => setCfgFin(e.target.value)} disabled={cfgSaving} />
              </div>
            </div>
            <div className="asi-modal-actions">
              <button className="asi-modal-btn" onClick={() => setShowConfigModal(false)} disabled={cfgSaving}>Cancelar</button>
              <button className="asi-modal-btn primary" onClick={guardarConfiguracionRapida} disabled={cfgSaving}>
                {cfgSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


