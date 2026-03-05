import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import FormEmpresa from './FormEmpresa';

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

const styles = `
  .emp-wrap { padding: 0; }
  .emp-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
  .emp-title { font-size:20px; font-weight:600; color:#1f2937; letter-spacing:-0.3px; }
  .emp-title span { font-size:13px; font-weight:400; color:#9ca3af; margin-left:8px; }
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
  .emp-modulo-label { font-size:12px; color:#374151; }
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
`;

export default function ListaEmpresas() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [cargando, setCargando] = useState(true);
  const [vista, setVista] = useState<'lista' | 'nuevo' | 'editar'>('lista');
  const [empresaEditar, setEmpresaEditar] = useState<Empresa | null>(null);
  const [confirmarEliminar, setConfirmarEliminar] = useState<Empresa | null>(null);
  const [seleccionada, setSeleccionada] = useState<Empresa | null>(null);
  const [accordionOpen, setAccordionOpen] = useState(false);
  const [modulosActividad, setModulosActividad] = useState<ModuloActividad[]>([]);
  const [cargandoModulos, setCargandoModulos] = useState(false);

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

    if (!empresa.actividad_id) {
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
    setCargandoModulos(false);
  };

  const seleccionarEmpresa = async (empresa: Empresa) => {
    setSeleccionada(empresa);
    setAccordionOpen(false);
    await cargarModulosEmpresa(empresa);
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
      setAccordionOpen(false);
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
          <button className="btn-nuevo" onClick={() => setVista('nuevo')}>+ Nueva Empresa</button>
        </div>

        <div className="emp-layout">
          <div className="emp-table-wrap">
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
                ) : empresas.length === 0 ? (
                  <tr><td colSpan={8} className="emp-empty">No hay empresas registradas</td></tr>
                ) : (
                  empresas.map((emp) => (
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

          <div className="emp-panel">
            {!seleccionada ? (
              <div className="emp-panel-empty">Seleccione una empresa para ver sus modulos por actividad</div>
            ) : (
              <>
                <div className="emp-panel-title">{seleccionada.codigo} - {seleccionada.nombre}</div>
                <div className="emp-panel-sub">
                  Los modulos se heredan desde la Actividad de la empresa ({seleccionada.actividad || 'sin actividad'}).
                </div>

                <button className="emp-accordion-btn" onClick={() => setAccordionOpen((v) => !v)}>
                  <span>Modulos de esta empresa</span>
                  <span className="emp-accordion-icon">{accordionOpen ? '▲' : '▼'}</span>
                </button>

                {accordionOpen && (
                  <div className="emp-modulos">
                    {cargandoModulos ? (
                      <div className="emp-panel-sub">Cargando modulos...</div>
                    ) : modulosActividad.length === 0 ? (
                      <div className="emp-warning">
                        Esta empresa no tiene modulos heredados. Revise la configuracion en Mantenimientos {'>'} Actividades.
                      </div>
                    ) : (
                      <div className="emp-modulos-grid">
                        {modulosActividad.map((mod) => (
                          <div key={mod.id} className="emp-modulo-item">
                            <span>{mod.icono || '•'}</span>
                            <span className="emp-modulo-label">{mod.nombre}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
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
