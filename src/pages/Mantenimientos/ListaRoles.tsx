import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

interface Rol {
  id: number;
  nombre: string;
  descripcion: string;
}

const styles = `
  .rol-wrap { padding:0; }
  .rol-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
  .rol-title { font-size:20px; font-weight:600; color:#1f2937; letter-spacing:-0.3px; }
  .rol-title span { font-size:13px; font-weight:400; color:#9ca3af; margin-left:8px; }
  .btn-nuevo { display:flex; align-items:center; gap:8px; padding:10px 18px;
    background:linear-gradient(135deg,#16a34a,#22c55e); border:none; border-radius:10px;
    color:white; font-size:13px; font-weight:600; cursor:pointer; transition:opacity 0.2s; }
  .btn-nuevo:hover { opacity:0.9; }
  .rol-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(280px,1fr)); gap:16px; }
  .rol-card { background:white; border:1px solid #e5e7eb; border-radius:14px;
    padding:20px; box-shadow:0 1px 3px rgba(0,0,0,0.04); transition:all 0.2s; }
  .rol-card:hover { border-color:#22c55e; box-shadow:0 4px 12px rgba(34,197,94,0.1); }
  .rol-card-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
  .rol-icon { width:40px; height:40px; border-radius:10px;
    background:linear-gradient(135deg,#16a34a,#22c55e);
    display:flex; align-items:center; justify-content:center; font-size:18px; }
  .rol-actions { display:flex; gap:6px; }
  .btn-edit { padding:5px 10px; background:#eff6ff; border:1px solid #bfdbfe;
    border-radius:6px; color:#2563eb; font-size:11px; font-weight:500; cursor:pointer; }
  .btn-edit:hover { background:#2563eb; color:white; }
  .btn-del { padding:5px 10px; background:#fef2f2; border:1px solid #fecaca;
    border-radius:6px; color:#dc2626; font-size:11px; font-weight:500; cursor:pointer; }
  .btn-del:hover { background:#dc2626; color:white; }
  .rol-nombre { font-size:15px; font-weight:600; color:#1f2937; margin-bottom:4px; }
  .rol-desc { font-size:12px; color:#9ca3af; line-height:1.4; }
  .rol-usuarios { font-size:11px; color:#16a34a; font-weight:500; margin-top:12px;
    padding-top:12px; border-top:1px solid #f3f4f6; }
  .success-msg { padding:10px 14px; background:#dcfce7; border:1px solid #bbf7d0;
    border-radius:8px; color:#16a34a; font-size:12px; font-weight:500; margin-bottom:16px; }

  /* Modal */
  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5);
    display:flex; align-items:center; justify-content:center; z-index:1000; }
  .modal-box { background:white; border-radius:16px; padding:32px; width:420px;
    box-shadow:0 20px 60px rgba(0,0,0,0.2); }
  .modal-title { font-size:17px; font-weight:600; color:#1f2937; margin-bottom:20px; }
  .modal-field { margin-bottom:16px; }
  .modal-label { display:block; font-size:11px; font-weight:500; color:#6b7280;
    letter-spacing:0.04em; text-transform:uppercase; margin-bottom:6px; }
  .modal-input { width:100%; padding:9px 12px; border:1px solid #e5e7eb;
    border-radius:8px; font-size:13px; color:#1f2937; outline:none;
    font-family:'DM Sans',sans-serif; transition:border-color 0.2s; }
  .modal-input:focus { border-color:#22c55e; box-shadow:0 0 0 3px rgba(34,197,94,0.1); }
  .modal-actions { display:flex; gap:10px; justify-content:flex-end; margin-top:24px; }
  .btn-cancelar { padding:9px 16px; background:#f3f4f6; border:none; border-radius:8px;
    color:#374151; font-size:13px; font-weight:500; cursor:pointer; }
  .btn-cancelar:hover { background:#e5e7eb; }
  .btn-guardar { padding:9px 20px; background:linear-gradient(135deg,#16a34a,#22c55e);
    border:none; border-radius:8px; color:white; font-size:13px; font-weight:600; cursor:pointer; }
  .btn-guardar:hover { opacity:0.9; }
`;

const iconos = ['🔑', '👤', '👑', '🛡️', '⚙️', '📋', '🔒', '🌟'];

export default function ListaRoles() {
  const [roles, setRoles] = useState<Rol[]>([]);
  const [usuariosPorRol, setUsuariosPorRol] = useState<Record<number, number>>({});
  const [exito, setExito] = useState('');
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<Rol | null>(null);
  const [form, setForm] = useState({ nombre: '', descripcion: '' });

  const cargar = async () => {
    const { data } = await supabase.from('roles').select('*').order('nombre');
    if (data) {
      setRoles(data);
      // Contar usuarios por rol
      const conteos: Record<number, number> = {};
      for (const rol of data) {
        const { count } = await supabase
          .from('usuarios_empresas')
          .select('*', { count: 'exact', head: true })
          .eq('rol_id', rol.id);
        conteos[rol.id] = count || 0;
      }
      setUsuariosPorRol(conteos);
    }
  };

  useEffect(() => { cargar(); }, []);

  const mostrarExito = (msg: string) => {
    setExito(msg); setTimeout(() => setExito(''), 3000);
  };

  const abrirNuevo = () => {
    setEditando(null);
    setForm({ nombre: '', descripcion: '' });
    setModal(true);
  };

  const abrirEditar = (rol: Rol) => {
    setEditando(rol);
    setForm({ nombre: rol.nombre, descripcion: rol.descripcion || '' });
    setModal(true);
  };

  const guardar = async () => {
    if (!form.nombre) return;
    if (editando) {
      await supabase.from('roles').update(form).eq('id', editando.id);
      mostrarExito('Rol actualizado correctamente');
    } else {
      await supabase.from('roles').insert(form);
      mostrarExito('Rol creado correctamente');
    }
    setModal(false);
    cargar();
  };

  const eliminar = async (rol: Rol) => {
    const { count } = await supabase
      .from('usuarios_empresas')
      .select('*', { count: 'exact', head: true })
      .eq('rol_id', rol.id);
    if (count && count > 0) {
      alert('⚠️ Este rol está asignado a usuarios. No se puede eliminar.');
      return;
    }
    await supabase.from('roles').delete().eq('id', rol.id);
    mostrarExito('Rol eliminado');
    cargar();
  };

  return (
    <>
      <style>{styles}</style>
      <div className="rol-wrap">
        <div className="rol-header">
          <div className="rol-title">
            Roles <span>{roles.length} registros</span>
          </div>
          <button className="btn-nuevo" onClick={abrirNuevo}>+ Nuevo Rol</button>
        </div>

        {exito && <div className="success-msg">{exito}</div>}

        <div className="rol-grid">
          {roles.map((rol, i) => (
            <div key={rol.id} className="rol-card">
              <div className="rol-card-header">
                <div className="rol-icon">{iconos[i % iconos.length]}</div>
                <div className="rol-actions">
                  <button className="btn-edit" onClick={() => abrirEditar(rol)}>Editar</button>
                  <button className="btn-del" onClick={() => eliminar(rol)}>Eliminar</button>
                </div>
              </div>
              <div className="rol-nombre">{rol.nombre}</div>
              <div className="rol-desc">{rol.descripcion || 'Sin descripción'}</div>
              <div className="rol-usuarios">
                👥 {usuariosPorRol[rol.id] || 0} asignaciones
              </div>
            </div>
          ))}
        </div>
      </div>

      {modal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-title">{editando ? 'Editar Rol' : 'Nuevo Rol'}</div>
            <div className="modal-field">
              <label className="modal-label">Nombre *</label>
              <input className="modal-input" value={form.nombre}
                onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                placeholder="Administrador" />
            </div>
            <div className="modal-field">
              <label className="modal-label">Descripción</label>
              <input className="modal-input" value={form.descripcion}
                onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
                placeholder="Acceso total al sistema" />
            </div>
            <div className="modal-actions">
              <button className="btn-cancelar" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn-guardar" onClick={guardar}>
                {editando ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}