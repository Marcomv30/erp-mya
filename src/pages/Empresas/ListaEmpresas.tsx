import React, { useState, useEffect } from 'react';
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

const styles = `
  .emp-wrap { padding: 0; }
  .emp-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
  .emp-title { font-size:20px; font-weight:600; color:#1f2937; letter-spacing:-0.3px; }
  .emp-title span { font-size:13px; font-weight:400; color:#9ca3af; margin-left:8px; }
  .btn-nuevo { display:flex; align-items:center; gap:8px; padding:10px 18px;
    background:linear-gradient(135deg,#16a34a,#22c55e); border:none; border-radius:10px;
    color:white; font-size:13px; font-weight:600; cursor:pointer; transition:opacity 0.2s; }
  .btn-nuevo:hover { opacity:0.9; }
  .emp-table-wrap { background:white; border-radius:14px; border:1px solid #e5e7eb;
    overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.04); }
  .emp-table { width:100%; border-collapse:collapse; }
  .emp-table thead { background:#f9fafb; }
  .emp-table th { padding:12px 16px; text-align:left; font-size:11px; font-weight:600;
    color:#6b7280; letter-spacing:0.06em; text-transform:uppercase;
    border-bottom:1px solid #e5e7eb; }
  .emp-table td { padding:14px 16px; font-size:13px; color:#374151;
    border-bottom:1px solid #f3f4f6; }
  .emp-table tr:last-child td { border-bottom:none; }
  .emp-table tr:hover td { background:#f9fafb; }
  .emp-codigo { font-family:'DM Mono',monospace; font-weight:500; color:#16a34a; }
  .emp-cedula { font-family:'DM Mono',monospace; font-size:12px; color:#6b7280; }
  .emp-badge { display:inline-flex; align-items:center; padding:3px 8px;
    border-radius:6px; font-size:11px; font-weight:500; }
  .emp-badge.activo { background:#dcfce7; color:#16a34a; }
  .emp-badge.inactivo { background:#fee2e2; color:#dc2626; }
  .emp-actions { display:flex; gap:8px; }
  .btn-edit { padding:6px 12px; background:#eff6ff; border:1px solid #bfdbfe;
    border-radius:7px; color:#2563eb; font-size:12px; font-weight:500;
    cursor:pointer; transition:all 0.15s; }
  .btn-edit:hover { background:#2563eb; color:white; }
  .btn-del { padding:6px 12px; background:#fef2f2; border:1px solid #fecaca;
    border-radius:7px; color:#dc2626; font-size:12px; font-weight:500;
    cursor:pointer; transition:all 0.15s; }
  .btn-del:hover { background:#dc2626; color:white; }
  .emp-loading { padding:48px; text-align:center; color:#9ca3af; font-size:13px; }
  .emp-empty { padding:48px; text-align:center; color:#9ca3af; font-size:13px; }
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

  const cargarEmpresas = async () => {
    setCargando(true);
    const { data } = await supabase.from('empresas').select('*').order('codigo');
    if (data) setEmpresas(data);
    setCargando(false);
  };

  useEffect(() => { cargarEmpresas(); }, []);

    const eliminar = async () => {
    if (!confirmarEliminar) return;

    // Verificar si tiene usuarios asignados
    const { data: usuarios } = await supabase
        .from('usuarios_empresas')
        .select('id')
        .eq('empresa_id', confirmarEliminar.id);

    if (usuarios && usuarios.length > 0) {
        alert('⚠️ Esta empresa tiene usuarios asignados. Use la opción Desactivar en lugar de Eliminar.');
        setConfirmarEliminar(null);
        return;
    }

    // Sin movimientos: eliminar
    const { error } = await supabase
        .from('empresas').delete().eq('id', confirmarEliminar.id);

    if (error) {
        alert('Error al eliminar: ' + error.message);
        setConfirmarEliminar(null);
        return;
    }

    setConfirmarEliminar(null);
    cargarEmpresas();
    };

  if (vista === 'nuevo') {
    return <FormEmpresa
      empresa={null}
      onGuardar={() => { setVista('lista'); cargarEmpresas(); }}
      onCancelar={() => setVista('lista')}
    />;
  }

  if (vista === 'editar' && empresaEditar) {
    return <FormEmpresa
      empresa={empresaEditar}
      onGuardar={() => { setVista('lista'); cargarEmpresas(); }}
      onCancelar={() => setVista('lista')}
    />;
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
          <button className="btn-nuevo" onClick={() => setVista('nuevo')}>
            + Nueva Empresa
          </button>
        </div>

        <div className="emp-table-wrap">
          <table className="emp-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Cédula</th>
                <th>Teléfono</th>
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
                empresas.map(emp => (
                  <tr key={emp.id}>
                    <td><span className="emp-codigo">{emp.codigo}</span></td>
                    <td><strong>{emp.nombre}</strong></td>
                    <td><span className="emp-cedula">{emp.cedula}</span></td>
                    <td>{emp.telefono || '—'}</td>
                    <td>{emp.email || '—'}</td>
                    <td>{emp.actividad || '—'}</td>
                    <td>
                      <span className={`emp-badge ${emp.activo ? 'activo' : 'inactivo'}`}>
                        {emp.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className="emp-actions">
                        <button className="btn-edit"
                          onClick={() => { setEmpresaEditar(emp); setVista('editar'); }}>
                          Editar
                        </button>
                        <button className="btn-del"
                          onClick={() => setConfirmarEliminar(emp)}>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmación eliminar */}
      {confirmarEliminar && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <div className="confirm-title">¿Eliminar empresa?</div>
            <div className="confirm-msg">
              Está a punto de eliminar <strong>{confirmarEliminar.nombre}</strong>.
              Esta acción no se puede deshacer.
            </div>
            <div className="confirm-actions">
              <button className="btn-cancel" onClick={() => setConfirmarEliminar(null)}>
                Cancelar
              </button>
              <button className="btn-confirmar" onClick={eliminar}>
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}