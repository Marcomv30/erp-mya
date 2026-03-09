import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../supabase';
import FormEmpresa from './FormEmpresa';

import { exportCsv, exportExcelXml, exportPdfWithPrint, ReportColumn } from '../../utils/reporting';
import ListToolbar from '../../components/ListToolbar';

interface Empresa {
  id: number;
  codigo: string;
  cedula: string;
  nombre: string;
  domicilio: string;
  provincia: string;
  canton: string;
  distrito: string;
  apartado: string;
  lugar: string;
  telefono: string;
  fax: string;
  actividad: string;
  email: string;
  rep_nombre: string;
  rep_apellido1: string;
  rep_apellido2: string;
  rep_cedula: string;
  rep_domicilio: string;
  contador: string;
  imp_venta: number;
  imp_incluido: boolean;
  activo: boolean;
  multimoneda: boolean;
  factura_electronica: boolean;
  actividad_id: number | null;
}

interface ModuloActividad {
  id: number;
  codigo: string;
  nombre: string;
  icono?: string | null;
}

interface ModuloSistema {
  id: number;
  codigo: string;
  nombre: string;
  icono?: string | null;
}

const styles = `
  .emp-wrap { padding: 0; }
  .emp-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
  .emp-title { font-size:20px; font-weight:600; color:#1f2937; letter-spacing:-0.3px; }
  .emp-title span { font-size:13px; font-weight:400; color:#9ca3af; margin-left:8px; }
  .emp-search-row { margin-bottom:12px; }
  .emp-search-input { width:100%; max-width:420px; padding:9px 12px; border:1px solid #e5e7eb; border-radius:8px; font-size:13px; color:#1f2937; outline:none; }
  .emp-search-input:focus { border-color:#22c55e; box-shadow:0 0 0 3px rgba(34,197,94,0.1); }
  .btn-nuevo { display:flex; align-items:center; gap:8px; padding:10px 18px;
    background:linear-gradient(135deg,#16a34a,#22c55e); border:none; border-radius:10px;
    color:white; font-size:13px; font-weight:600; cursor:pointer; transition:opacity 0.2s; }
  .btn-nuevo:hover { opacity:0.9; }

  .emp-layout { display:grid; grid-template-columns:1fr 1.25fr; gap:20px; align-items:start; }

  .emp-table-wrap { background:white; border-radius:14px; border:1px solid #e5e7eb;
    overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.04); }
  .emp-table { width:100%; border-collapse:collapse; }
  .emp-table thead { background:#f9fafb; }
  .emp-table th { padding:12px 16px; text-align:left; font-size:11px; font-weight:600;
    color:#6b7280; letter-spacing:0.06em; text-transform:uppercase; border-bottom:1px solid #e5e7eb; }
  .emp-table td { padding:14px 16px; font-size:13px; color:#374151; border-bottom:1px solid #f3f4f6; }
  .emp-table tr:last-child td { border-bottom:none; }
  .emp-table tr:hover td { background:#f9fafb; }
  .emp-table tr.selected td { background:#dcfce7; }
  .emp-mobile-list { display:none; }
  .emp-card { background:#fff; border:1px solid #e5e7eb; border-radius:10px; padding:12px; margin-bottom:8px; }
  .emp-card-head { display:flex; justify-content:space-between; gap:8px; margin-bottom:8px; }
  .emp-codigo { font-family:'DM Mono',monospace; font-weight:500; color:#16a34a; }
  .emp-cedula { font-family:'DM Mono',monospace; font-size:12px; color:#6b7280; }
  .emp-badge { display:inline-flex; align-items:center; padding:3px 8px;
    border-radius:6px; font-size:11px; font-weight:500; }
  .emp-badge.activo { background:#dcfce7; color:#16a34a; }
  .emp-badge.inactivo { background:#fee2e2; color:#dc2626; }
  .emp-actions { display:flex; gap:8px; }
  .btn-edit { padding:6px 12px; background:#eff6ff; border:1px solid #bfdbfe;
    border-radius:7px; color:#2563eb; font-size:12px; font-weight:500; cursor:pointer; transition:all 0.15s; }
  .btn-edit:hover { background:#2563eb; color:white; }
  .btn-del { padding:6px 12px; background:#fef2f2; border:1px solid #fecaca;
    border-radius:7px; color:#dc2626; font-size:12px; font-weight:500; cursor:pointer; transition:all 0.15s; }
  .btn-del:hover { background:#dc2626; color:white; }
  .emp-loading, .emp-empty { padding:48px; text-align:center; color:#9ca3af; font-size:13px; }

  .emp-panel { background:white; border-radius:14px; border:1px solid #e5e7eb;
    padding:24px; box-shadow:0 1px 3px rgba(0,0,0,0.04); }
  .emp-panel-empty { text-align:center; color:#9ca3af; font-size:13px; padding:48px 16px; }
  .emp-panel-title { font-size:14px; font-weight:600; color:#1f2937; margin-bottom:4px; }
  .emp-panel-sub { font-size:12px; color:#6b7280; margin-bottom:14px; }

  .emp-accordion-btn { width:100%; display:flex; justify-content:space-between; align-items:center;
    padding:10px 12px; border:1px solid #e5e7eb; border-radius:10px; background:#f9fafb;
    color:#1f2937; font-size:12px; font-weight:600; cursor:pointer; }
  .emp-accordion-btn:hover { border-color:#22c55e; background:#f0fdf4; }
  .emp-accordion-icon { color:#16a34a; font-size:12px; }

  .emp-modulos { margin-top:12px; padding-top:12px; border-top:1px solid #f3f4f6; }
  .emp-modulos-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
  .emp-modulo-item { display:flex; align-items:center; gap:8px; border:1px solid #e5e7eb;
    border-radius:8px; padding:8px 10px; background:#f8fafc; }
  .emp-modulo-item input { width:15px; height:15px; accent-color:#16a34a; cursor:pointer; }
  .emp-modulo-item.checked { border-color:#22c55e; background:#dcfce7; }
  .emp-modulo-label { font-size:12px; color:#374151; }
  .emp-modulo-actions { display:flex; gap:8px; align-items:center; margin-bottom:10px; }
  .emp-modulo-btn { padding:8px 12px; border-radius:8px; border:1px solid; font-size:12px; font-weight:600; cursor:pointer; }
  .emp-modulo-btn.save { background:#dcfce7; border-color:#bbf7d0; color:#166534; }
  .emp-modulo-btn.save:hover { background:#bbf7d0; }
  .emp-modulo-btn.reset { background:#fff1f2; border-color:#fecdd3; color:#9f1239; }
  .emp-modulo-btn.reset:hover { background:#ffe4e6; }
  .emp-modulo-btn:disabled { opacity:0.6; cursor:not-allowed; }
  .emp-hint { font-size:12px; color:#6b7280; margin-bottom:10px; }
  .emp-hint strong { color:#111827; }
  .emp-msg-ok { font-size:12px; color:#166534; background:#dcfce7; border:1px solid #bbf7d0; padding:8px 10px; border-radius:8px; margin-bottom:10px; }
  .emp-msg-err { font-size:12px; color:#9f1239; background:#fff1f2; border:1px solid #fecdd3; padding:8px 10px; border-radius:8px; margin-bottom:10px; }
  .emp-warning { font-size:12px; color:#92400e; background:#fffbeb; border:1px solid #fde68a;
    padding:10px 12px; border-radius:8px; margin-top:10px; }

  .confirm-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5);
    display:flex; align-items:center; justify-content:center; z-index:1000; }
  .confirm-box { background:white; border-radius:16px; padding:32px; width:360px;
    box-shadow:0 20px 60px rgba(0,0,0,0.2); }
  .confirm-title { font-size:17px; font-weight:600; color:#1f2937; margin-bottom:8px; }
  .confirm-msg { font-size:13px; color:#6b7280; margin-bottom:24px; line-height:1.5; }
  .confirm-actions { display:flex; gap:10px; justify-content:flex-end; }
  .btn-cancel { padding:9px 16px; background:#f3f4f6; border:none; border-radius:8px;
    color:#374151; font-size:13px; font-weight:500; cursor:pointer; }
  .btn-cancel:hover { background:#e5e7eb; }
  .btn-confirmar { padding:9px 16px; background:#dc2626; border:none; border-radius:8px;
    color:white; font-size:13px; font-weight:500; cursor:pointer; }
  .btn-confirmar:hover { background:#b91c1c; }

  @media (max-width: 980px) {
    .emp-layout { grid-template-columns:1fr; }
  }

  @media (max-width: 620px) {
    .emp-header { flex-wrap:wrap; gap:10px; }
    .btn-nuevo { width:100%; justify-content:center; }
    .emp-table-wrap { display:none; }
    .emp-mobile-list { display:block; }
    .emp-modulos-grid { grid-template-columns:1fr; }
    .confirm-box { width:92vw; padding:20px; border-radius:12px; }
    .confirm-actions { flex-direction:column; }
    .btn-cancel, .btn-confirmar { width:100%; }
  }
`;

export default function ListaEmpresas() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [cargando, setCargando] = useState(true);
  const [vista, setVista] = useState<'lista' | 'nuevo' | 'editar'>('lista');
  const [empresaEditar, setEmpresaEditar] = useState<Empresa | null>(null);
  const [confirmarEliminar, setConfirmarEliminar] = useState<Empresa | null>(null);
  const [seleccionada, setSeleccionada] = useState<Empresa | null>(null);
  const [modulosActividad, setModulosActividad] = useState<ModuloActividad[]>([]);
  const [modulosSistema, setModulosSistema] = useState<ModuloSistema[]>([]);
  const [modulosSeleccionadosEmpresa, setModulosSeleccionadosEmpresa] = useState<number[]>([]);
  const [tieneOverrideEmpresa, setTieneOverrideEmpresa] = useState(false);
  const [guardandoModulosEmpresa, setGuardandoModulosEmpresa] = useState(false);
  const [msgOkModulosEmpresa, setMsgOkModulosEmpresa] = useState('');
  const [msgErrModulosEmpresa, setMsgErrModulosEmpresa] = useState('');
  const [cargandoModulos, setCargandoModulos] = useState(false);
  const [search, setSearch] = useState('');

  const empresasFiltradas = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return empresas;
    return empresas.filter((e) =>
      (e.codigo || '').toLowerCase().includes(term) ||
      (e.nombre || '').toLowerCase().includes(term) ||
      (e.cedula || '').toLowerCase().includes(term) ||
      (e.telefono || '').toLowerCase().includes(term) ||
      (e.email || '').toLowerCase().includes(term)
    );
  }, [empresas, search]);

  const exportRows = empresasFiltradas.map((e) => ({
    codigo: e.codigo,
    nombre: e.nombre,
    cedula: e.cedula,
    telefono: e.telefono || '',
    email: e.email || '',
    actividad: e.actividad || '',
    estado: e.activo ? 'Activo' : 'Inactivo',
  }));

  const exportColumns: ReportColumn<(typeof exportRows)[number]>[] = [
    { key: 'codigo', title: 'Codigo', getValue: (r) => r.codigo, align: 'left', width: '9%' },
    { key: 'nombre', title: 'Nombre', getValue: (r) => r.nombre, align: 'left', width: '26%' },
    { key: 'cedula', title: 'Cedula', getValue: (r) => r.cedula, width: '12%' },
    { key: 'telefono', title: 'Telefono', getValue: (r) => r.telefono, width: '11%' },
    { key: 'email', title: 'Email', getValue: (r) => r.email, align: 'left', width: '18%' },
    { key: 'actividad', title: 'Actividad', getValue: (r) => r.actividad, width: '12%' },
    { key: 'estado', title: 'Estado', getValue: (r) => r.estado, width: '12%' },
  ];

  const cargarEmpresas = async () => {
    setCargando(true);
    const { data } = await supabase.from('empresas').select('*').order('codigo');
    if (data) {
      setEmpresas(data);
      setSeleccionada((prev) => {
        if (!prev) return null;
        return data.find((e) => e.id === prev.id) || null;
      });
    }
    setCargando(false);
  };

  const cargarModulosEmpresa = async (empresa: Empresa) => {
    setCargandoModulos(true);
    setModulosActividad([]);
    setMsgErrModulosEmpresa('');
    setMsgOkModulosEmpresa('');

    const { data: modulosActivos } = await supabase
      .from('modulos')
      .select('id,codigo,nombre,icono')
      .eq('activo', true)
      .order('orden')
      .order('nombre');

    setModulosSistema((modulosActivos || []) as ModuloSistema[]);

    if (!empresa.actividad_id) {
      setModulosSeleccionadosEmpresa([]);
      setTieneOverrideEmpresa(false);
      setCargandoModulos(false);
      return;
    }

    const { data } = await supabase
      .from('actividad_modulos')
      .select('modulos:modulo_id(id,codigo,nombre,icono)')
      .eq('actividad_id', empresa.actividad_id);

    const modulos = (data || [])
      .map((row: any) => row.modulos)
      .filter(Boolean) as ModuloActividad[];

    modulos.sort((a, b) => a.nombre.localeCompare(b.nombre));
    setModulosActividad(modulos);

    const inheritedIds = modulos.map((m) => m.id);

    const { data: overrideRows, error: overrideError } = await supabase
      .from('empresa_modulos')
      .select('modulo_id')
      .eq('empresa_id', empresa.id);

    if (overrideError) {
      setMsgErrModulosEmpresa(overrideError.message || 'No se pudo cargar override de módulos por empresa.');
      setTieneOverrideEmpresa(false);
      setModulosSeleccionadosEmpresa(inheritedIds);
      setCargandoModulos(false);
      return;
    }

    const overrideIds = (overrideRows || []).map((r: any) => Number(r.modulo_id));
    const hasOverride = overrideIds.length > 0;
    setTieneOverrideEmpresa(hasOverride);
    setModulosSeleccionadosEmpresa(hasOverride ? overrideIds : inheritedIds);
    setCargandoModulos(false);
  };

  const seleccionarEmpresa = async (empresa: Empresa) => {
    setSeleccionada(empresa);
    await cargarModulosEmpresa(empresa);
  };

  const toggleModuloEmpresa = (moduloId: number) => {
    setModulosSeleccionadosEmpresa((prev) =>
      prev.includes(moduloId) ? prev.filter((id) => id !== moduloId) : [...prev, moduloId]
    );
  };

  const guardarModulosEmpresa = async () => {
    if (!seleccionada) return;
    setGuardandoModulosEmpresa(true);
    setMsgErrModulosEmpresa('');
    setMsgOkModulosEmpresa('');

    const { error } = await supabase.rpc('set_empresa_modules', {
      p_empresa_id: seleccionada.id,
      p_modulo_ids: modulosSeleccionadosEmpresa,
    });

    if (error) {
      setMsgErrModulosEmpresa(error.message || 'No se pudieron guardar los módulos de la empresa.');
      setGuardandoModulosEmpresa(false);
      return;
    }

    setMsgOkModulosEmpresa('Módulos por empresa guardados correctamente.');
    await cargarModulosEmpresa(seleccionada);
    setGuardandoModulosEmpresa(false);
  };

  const volverHerenciaActividad = async () => {
    if (!seleccionada) return;
    setGuardandoModulosEmpresa(true);
    setMsgErrModulosEmpresa('');
    setMsgOkModulosEmpresa('');

    const { error } = await supabase.rpc('clear_empresa_modules_override', {
      p_empresa_id: seleccionada.id,
    });

    if (error) {
      setMsgErrModulosEmpresa(error.message || 'No se pudo restaurar la herencia por actividad.');
      setGuardandoModulosEmpresa(false);
      return;
    }

    setMsgOkModulosEmpresa('Se restauró la herencia por actividad para esta empresa.');
    await cargarModulosEmpresa(seleccionada);
    setGuardandoModulosEmpresa(false);
  };

  useEffect(() => {
    cargarEmpresas();
  }, []);

  const eliminar = async () => {
    if (!confirmarEliminar) return;

    const { data: usuarios } = await supabase
      .from('usuarios_empresas')
      .select('id')
      .eq('empresa_id', confirmarEliminar.id);

    if (usuarios && usuarios.length > 0) {
      alert('Esta empresa tiene usuarios asignados. Use desactivar en lugar de eliminar.');
      setConfirmarEliminar(null);
      return;
    }

    const { error } = await supabase
      .from('empresas').delete().eq('id', confirmarEliminar.id);

    if (error) {
      alert(`Error al eliminar: ${error.message}`);
      setConfirmarEliminar(null);
      return;
    }

    if (seleccionada?.id === confirmarEliminar.id) {
      setSeleccionada(null);
      setModulosActividad([]);
    }

    setConfirmarEliminar(null);
    cargarEmpresas();
  };

  if (vista === 'nuevo') {
    return (
      <FormEmpresa
        empresa={null}
        onGuardar={() => { setVista('lista'); cargarEmpresas(); }}
        onCancelar={() => setVista('lista')}
      />
    );
  }

  if (vista === 'editar' && empresaEditar) {
    return (
      <FormEmpresa
        empresa={empresaEditar}
        onGuardar={() => { setVista('lista'); cargarEmpresas(); }}
        onCancelar={() => setVista('lista')}
      />
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="emp-wrap">
        <div className="emp-header">
          <div className="emp-title">
            Empresas
            <span>{empresas.length} registros</span>
          </div>
          <ListToolbar
            exports={(
              <>
                <button
                  className="btn-edit"
                  onClick={() => exportCsv('empresas.csv', exportRows, exportColumns)}
                  disabled={exportRows.length === 0}
                >
                  CSV
                </button>
                <button
                  className="btn-edit"
                  onClick={() => exportExcelXml('empresas.xls', exportRows, exportColumns)}
                  disabled={exportRows.length === 0}
                >
                  EXCEL
                </button>
                <button
                  className="btn-edit"
                  onClick={() =>
                    exportPdfWithPrint({
                      title: 'Empresas',
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
            actions={<button className="btn-nuevo" onClick={() => setVista('nuevo')}>+ Nueva Empresa</button>}
          />
        </div>

        <div className="emp-search-row">
          <input
            className="emp-search-input"
            placeholder="Buscar empresa por codigo, nombre, cedula, telefono o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="emp-layout">
          <div className="emp-table-wrap rv-desktop-table">
            <table className="emp-table">
              <thead>
                <tr>
                  <th>Codigo</th>
                  <th>Nombre</th>
                  <th>Cedula</th>
                  <th>Telefono</th>
                  <th>Email</th>
                  <th>Actividad</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr><td colSpan={8} className="emp-loading">Cargando empresas...</td></tr>
                ) : empresasFiltradas.length === 0 ? (
                  <tr><td colSpan={8} className="emp-empty">No hay empresas registradas</td></tr>
                ) : (
                  empresasFiltradas.map((emp) => (
                    <tr key={emp.id} className={seleccionada?.id === emp.id ? 'selected' : ''} onClick={() => seleccionarEmpresa(emp)}>
                      <td><span className="emp-codigo">{emp.codigo}</span></td>
                      <td><strong>{emp.nombre}</strong></td>
                      <td><span className="emp-cedula">{emp.cedula}</span></td>
                      <td>{emp.telefono || '-'}</td>
                      <td>{emp.email || '-'}</td>
                      <td>{emp.actividad || '-'}</td>
                      <td>
                        <span className={`emp-badge ${emp.activo ? 'activo' : 'inactivo'}`}>
                          {emp.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <div className="emp-actions" onClick={(e) => e.stopPropagation()}>
                          <button className="btn-edit" onClick={() => { setEmpresaEditar(emp); setVista('editar'); }}>Editar</button>
                          <button className="btn-del" onClick={() => setConfirmarEliminar(emp)}>Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="emp-mobile-list rv-mobile-cards">
            {cargando ? (
              <div className="emp-loading">Cargando empresas...</div>
            ) : empresasFiltradas.length === 0 ? (
              <div className="emp-empty">No hay empresas registradas</div>
            ) : (
              empresasFiltradas.map((emp) => (
                <div
                  key={`m-${emp.id}`}
                  className="emp-card"
                  style={seleccionada?.id === emp.id ? { borderColor: '#22c55e', background: '#f0fdf4' } : undefined}
                  onClick={() => seleccionarEmpresa(emp)}
                >
                  <div className="emp-card-head">
                    <span className="emp-codigo">{emp.codigo}</span>
                    <span className={`emp-badge ${emp.activo ? 'activo' : 'inactivo'}`}>{emp.activo ? 'Activo' : 'Inactivo'}</span>
                  </div>
                  <div style={{ fontWeight: 700, color: '#1f2937', marginBottom: '6px' }}>{emp.nombre}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>Cedula: <span className="emp-cedula">{emp.cedula}</span></div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>Actividad: {emp.actividad || '-'}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>{emp.telefono || '-'} · {emp.email || '-'}</div>
                  <div className="emp-actions" onClick={(e) => e.stopPropagation()}>
                    <button className="btn-edit" onClick={() => { setEmpresaEditar(emp); setVista('editar'); }}>Editar</button>
                    <button className="btn-del" onClick={() => setConfirmarEliminar(emp)}>Eliminar</button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="emp-panel">
            {!seleccionada ? (
              <div className="emp-panel-empty">Seleccione una empresa para ver sus modulos por actividad</div>
            ) : (
              <>
                <div className="emp-panel-title">{seleccionada.codigo} - {seleccionada.nombre}</div>
                <div className="emp-panel-sub">
                  Los modulos se heredan desde la Actividad de la empresa ({seleccionada.actividad || 'sin actividad'}).
                </div>

                <div className="emp-modulos">
                  <div className="emp-hint">
                    Modo actual: <strong>{tieneOverrideEmpresa ? 'Override por empresa' : 'Herencia por actividad'}</strong>
                  </div>
                  {msgOkModulosEmpresa && <div className="emp-msg-ok">{msgOkModulosEmpresa}</div>}
                  {msgErrModulosEmpresa && <div className="emp-msg-err">{msgErrModulosEmpresa}</div>}
                  <div className="emp-modulo-actions">
                    <button
                      className="emp-modulo-btn save"
                      onClick={guardarModulosEmpresa}
                      disabled={guardandoModulosEmpresa}
                    >
                      {guardandoModulosEmpresa ? 'Guardando...' : 'Guardar módulos de esta empresa'}
                    </button>
                    <button
                      className="emp-modulo-btn reset"
                      onClick={volverHerenciaActividad}
                      disabled={guardandoModulosEmpresa}
                    >
                      Volver a herencia por actividad
                    </button>
                  </div>
                  {cargandoModulos ? (
                    <div className="emp-panel-sub">Cargando modulos...</div>
                  ) : modulosSistema.length === 0 ? (
                    <div className="emp-warning">
                      No hay módulos activos definidos en catálogo.
                    </div>
                  ) : (
                    <div className="emp-modulos-grid">
                      {modulosSistema.map((mod) => (
                        <label
                          key={mod.id}
                          className={`emp-modulo-item ${modulosSeleccionadosEmpresa.includes(mod.id) ? 'checked' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={modulosSeleccionadosEmpresa.includes(mod.id)}
                            onChange={() => toggleModuloEmpresa(mod.id)}
                          />
                          <span>{mod.icono || '•'}</span>
                          <span className="emp-modulo-label">{mod.nombre}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {confirmarEliminar && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <div className="confirm-title">Eliminar empresa?</div>
            <div className="confirm-msg">
              Esta a punto de eliminar <strong>{confirmarEliminar.nombre}</strong>. Esta accion no se puede deshacer.
            </div>
            <div className="confirm-actions">
              <button className="btn-cancel" onClick={() => setConfirmarEliminar(null)}>Cancelar</button>
              <button className="btn-confirmar" onClick={eliminar}>Si, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

