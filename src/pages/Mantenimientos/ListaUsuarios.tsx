import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

interface Usuario {
  id: number;
  username: string;
  password: string;
  nombre: string;
  email: string;
  activo: boolean;
}

interface Empresa {
  id: number;
  codigo: string;
  nombre: string;
}

interface Rol {
  id: number;
  nombre: string;
}

interface UsuarioEmpresa {
  id: number;
  empresa_id: number;
  rol_id: number;
  activo: boolean;
  empresas: { codigo: string; nombre: string };
  roles: { nombre: string };
}

const styles = `
  .usr-wrap { padding:0; }
  .usr-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
  .usr-title { font-size:20px; font-weight:600; color:#1f2937; letter-spacing:-0.3px; }
  .usr-title span { font-size:13px; font-weight:400; color:#9ca3af; margin-left:8px; }
  .btn-nuevo { display:flex; align-items:center; gap:8px; padding:10px 18px;
    background:linear-gradient(135deg,#16a34a,#22c55e); border:none; border-radius:10px;
    color:white; font-size:13px; font-weight:600; cursor:pointer; transition:opacity 0.2s; }
  .btn-nuevo:hover { opacity:0.9; }
  .usr-layout { display:grid; grid-template-columns:1fr 1.4fr; gap:20px; align-items:start; }
  .usr-table-wrap { background:white; border-radius:14px; border:1px solid #e5e7eb;
    overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.04); }
  .usr-table { width:100%; border-collapse:collapse; }
  .usr-table thead { background:#f9fafb; }
  .usr-table th { padding:12px 16px; text-align:left; font-size:11px; font-weight:600;
    color:#6b7280; letter-spacing:0.06em; text-transform:uppercase; border-bottom:1px solid #e5e7eb; }
  .usr-table td { padding:12px 16px; font-size:13px; color:#374151; border-bottom:1px solid #f3f4f6; }
  .usr-table tr:last-child td { border-bottom:none; }
  .usr-table tr:hover td { background:#f9fafb; cursor:pointer; }
  .usr-table tr.selected td { background:#dcfce7; }
  .usr-avatar { width:32px; height:32px; border-radius:8px;
    background:linear-gradient(135deg,#16a34a,#22c55e);
    display:inline-flex; align-items:center; justify-content:center;
    color:white; font-size:13px; font-weight:600; }
  .usr-badge { display:inline-flex; align-items:center; padding:3px 8px;
    border-radius:6px; font-size:11px; font-weight:500; }
  .usr-badge.activo { background:#dcfce7; color:#16a34a; }
  .usr-badge.inactivo { background:#fee2e2; color:#dc2626; }
  .usr-actions { display:flex; gap:6px; }
  .btn-edit { padding:5px 10px; background:#eff6ff; border:1px solid #bfdbfe;
    border-radius:6px; color:#2563eb; font-size:11px; font-weight:500; cursor:pointer; }
  .btn-edit:hover { background:#2563eb; color:white; }
  .btn-del { padding:5px 10px; background:#fef2f2; border:1px solid #fecaca;
    border-radius:6px; color:#dc2626; font-size:11px; font-weight:500; cursor:pointer; }
  .btn-del:hover { background:#dc2626; color:white; }

  /* Panel empresas */
  .emp-panel { background:white; border-radius:14px; border:1px solid #e5e7eb;
    padding:24px; box-shadow:0 1px 3px rgba(0,0,0,0.04); }
  .emp-panel-title { font-size:13px; font-weight:600; color:#1f2937; margin-bottom:4px; }
  .emp-panel-sub { font-size:12px; color:#9ca3af; margin-bottom:16px; }
  .emp-asignada { display:flex; align-items:center; justify-content:space-between;
    padding:10px 14px; border:1px solid #e5e7eb; border-radius:10px; margin-bottom:8px; }
  .emp-asignada-info { display:flex; flex-direction:column; gap:2px; }
  .emp-asignada-nombre { font-size:13px; font-weight:500; color:#1f2937; }
  .emp-asignada-rol { font-size:11px; color:#16a34a; font-weight:500; }
  .btn-quitar { padding:4px 10px; background:#fef2f2; border:1px solid #fecaca;
    border-radius:6px; color:#dc2626; font-size:11px; cursor:pointer; }
  .btn-quitar:hover { background:#dc2626; color:white; }
  .emp-agregar { display:grid; grid-template-columns:1fr 1fr auto; gap:8px;
    margin-top:16px; padding-top:16px; border-top:1px solid #f3f4f6; align-items:end; }
  .emp-agregar-label { font-size:11px; font-weight:500; color:#6b7280;
    text-transform:uppercase; letter-spacing:0.04em; margin-bottom:4px; }
  .emp-select { width:100%; padding:8px 10px; border:1px solid #e5e7eb;
    border-radius:8px; font-size:13px; color:#1f2937; outline:none;
    font-family:'DM Sans',sans-serif; }
  .emp-select:focus { border-color:#22c55e; }
  .btn-agregar { padding:9px 14px; background:linear-gradient(135deg,#16a34a,#22c55e);
    border:none; border-radius:8px; color:white; font-size:12px;
    font-weight:600; cursor:pointer; white-space:nowrap; }
  .btn-agregar:hover { opacity:0.9; }
  .panel-empty { text-align:center; padding:32px; color:#9ca3af; font-size:13px; }
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
  .modal-check { display:flex; align-items:center; gap:8px; cursor:pointer; }
  .modal-check input { width:15px; height:15px; accent-color:#16a34a; }
  .modal-check span { font-size:13px; color:#374151; }
  .modal-actions { display:flex; gap:10px; justify-content:flex-end; margin-top:24px; }
  .btn-cancelar { padding:9px 16px; background:#f3f4f6; border:none; border-radius:8px;
    color:#374151; font-size:13px; font-weight:500; cursor:pointer; }
  .btn-cancelar:hover { background:#e5e7eb; }
  .btn-guardar { padding:9px 20px; background:linear-gradient(135deg,#16a34a,#22c55e);
    border:none; border-radius:8px; color:white; font-size:13px;
    font-weight:600; cursor:pointer; }
  .btn-guardar:hover { opacity:0.9; }
  .modal-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
`;

export default function ListaUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [seleccionado, setSeleccionado] = useState<Usuario | null>(null);
  const [empresasUsuario, setEmpresasUsuario] = useState<UsuarioEmpresa[]>([]);
  const [empresaAgregar, setEmpresaAgregar] = useState('');
  const [rolAgregar, setRolAgregar] = useState('');
  const [exito, setExito] = useState('');
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [form, setForm] = useState({
    username: '', password: '', nombre: '', email: '', activo: true
  });

  const cargar = async () => {
    const { data } = await supabase.from('usuarios').select('*').order('nombre');
    if (data) setUsuarios(data);
  };

  const cargarCatalogos = async () => {
    const [{ data: emps }, { data: rols }] = await Promise.all([
      supabase.from('empresas').select('id,codigo,nombre').eq('activo', true).order('codigo'),
      supabase.from('roles').select('*').order('nombre'),
    ]);
    if (emps) { setEmpresas(emps); setEmpresaAgregar(String(emps[0]?.id || '')); }
    if (rols) { setRoles(rols); setRolAgregar(String(rols[0]?.id || '')); }
  };

  const cargarEmpresasUsuario = async (usuarioId: number) => {
    const { data } = await supabase
      .from('usuarios_empresas')
      .select('id, empresa_id, rol_id, activo, empresas(codigo, nombre), roles(nombre)')
      .eq('usuario_id', usuarioId);
    if (data) setEmpresasUsuario(data as any);
  };

  useEffect(() => { cargar(); cargarCatalogos(); }, []);

  const seleccionar = (usr: Usuario) => {
    setSeleccionado(usr);
    cargarEmpresasUsuario(usr.id);
    setExito('');
  };

  const agregarEmpresa = async () => {
    if (!seleccionado || !empresaAgregar || !rolAgregar) return;
    const yaExiste = empresasUsuario.find(e => e.empresa_id === parseInt(empresaAgregar));
    if (yaExiste) { setExito('⚠️ Ya tiene acceso a esa empresa'); return; }
    await supabase.from('usuarios_empresas').insert({
      usuario_id: seleccionado.id,
      empresa_id: parseInt(empresaAgregar),
      rol_id: parseInt(rolAgregar),
      activo: true,
    });
    cargarEmpresasUsuario(seleccionado.id);
    mostrarExito(`Empresa asignada correctamente`);
  };

  const quitarEmpresa = async (id: number) => {
    await supabase.from('usuarios_empresas').delete().eq('id', id);
    if (seleccionado) cargarEmpresasUsuario(seleccionado.id);
  };

  const mostrarExito = (msg: string) => {
    setExito(msg); setTimeout(() => setExito(''), 3000);
  };

  const abrirNuevo = () => {
    setEditando(null);
    setForm({ username: '', password: '', nombre: '', email: '', activo: true });
    setModal(true);
  };

  const abrirEditar = (usr: Usuario) => {
    setEditando(usr);
    setForm({ username: usr.username, password: usr.password,
      nombre: usr.nombre, email: usr.email || '', activo: usr.activo });
    setModal(true);
  };

  const guardarUsuario = async () => {
    if (!form.username || !form.password || !form.nombre) return;
    if (editando) {
      await supabase.from('usuarios').update(form).eq('id', editando.id);
    } else {
      await supabase.from('usuarios').insert(form);
    }
    setModal(false);
    cargar();
    mostrarExito(editando ? 'Usuario actualizado' : 'Usuario creado correctamente');
  };

  const eliminar = async (usr: Usuario) => {
    await supabase.from('usuarios_empresas').delete().eq('usuario_id', usr.id);
    await supabase.from('usuarios').delete().eq('id', usr.id);
    if (seleccionado?.id === usr.id) setSeleccionado(null);
    cargar();
  };

  return (
    <>
      <style>{styles}</style>
      <div className="usr-wrap">
        <div className="usr-header">
          <div className="usr-title">
            Usuarios <span>{usuarios.length} registros</span>
          </div>
          <button className="btn-nuevo" onClick={abrirNuevo}>+ Nuevo Usuario</button>
        </div>

        {exito && <div className="success-msg">{exito}</div>}

        <div className="usr-layout">
          {/* Tabla usuarios */}
          <div className="usr-table-wrap">
            <table className="usr-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Usuario</th>
                  <th>Nombre</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>
                    No hay usuarios registrados
                  </td></tr>
                ) : usuarios.map(usr => (
                  <tr key={usr.id}
                    className={seleccionado?.id === usr.id ? 'selected' : ''}
                    onClick={() => seleccionar(usr)}>
                    <td>
                      <div className="usr-avatar">{usr.nombre[0]?.toUpperCase()}</div>
                    </td>
                    <td><strong>{usr.username}</strong></td>
                    <td>{usr.nombre}</td>
                    <td>
                      <span className={`usr-badge ${usr.activo ? 'activo' : 'inactivo'}`}>
                        {usr.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className="usr-actions" onClick={e => e.stopPropagation()}>
                        <button className="btn-edit" onClick={() => abrirEditar(usr)}>Editar</button>
                        <button className="btn-del" onClick={() => eliminar(usr)}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Panel empresas del usuario */}
          <div className="emp-panel">
            {!seleccionado ? (
              <div className="panel-empty">
                👆 Seleccione un usuario para gestionar sus empresas
              </div>
            ) : (
              <>
                <div className="emp-panel-title">
                  Empresas de: {seleccionado.nombre}
                </div>
                <div className="emp-panel-sub">
                  Empresas y roles asignados a este usuario
                </div>

                {empresasUsuario.length === 0 ? (
                  <div style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '16px' }}>
                    Sin empresas asignadas aún
                  </div>
                ) : empresasUsuario.map(eu => (
                  <div key={eu.id} className="emp-asignada">
                    <div className="emp-asignada-info">
                      <span className="emp-asignada-nombre">
                        {(eu.empresas as any)?.codigo} — {(eu.empresas as any)?.nombre}
                      </span>
                      <span className="emp-asignada-rol">
                        🔑 {(eu.roles as any)?.nombre}
                      </span>
                    </div>
                    <button className="btn-quitar" onClick={() => quitarEmpresa(eu.id)}>
                      Quitar
                    </button>
                  </div>
                ))}

                {/* Agregar empresa */}
                <div className="emp-agregar">
                  <div>
                    <div className="emp-agregar-label">Empresa</div>
                    <select className="emp-select" value={empresaAgregar}
                      onChange={e => setEmpresaAgregar(e.target.value)}>
                      {empresas.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.codigo} — {emp.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div className="emp-agregar-label">Rol</div>
                    <select className="emp-select" value={rolAgregar}
                      onChange={e => setRolAgregar(e.target.value)}>
                      {roles.map(rol => (
                        <option key={rol.id} value={rol.id}>{rol.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <button className="btn-agregar" onClick={agregarEmpresa}>
                    + Asignar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-title">
              {editando ? 'Editar Usuario' : 'Nuevo Usuario'}
            </div>
            <div className="modal-grid">
              <div className="modal-field">
                <label className="modal-label">Usuario *</label>
                <input className="modal-input" value={form.username}
                  onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                  placeholder="marco" />
              </div>
              <div className="modal-field">
                <label className="modal-label">Contraseña *</label>
                <input className="modal-input" type="password" value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••" />
              </div>
            </div>
            <div className="modal-field">
              <label className="modal-label">Nombre completo *</label>
              <input className="modal-input" value={form.nombre}
                onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                placeholder="Marco Antonio Morales" />
            </div>
            <div className="modal-field">
              <label className="modal-label">Email</label>
              <input className="modal-input" type="email" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="correo@ejemplo.com" />
            </div>
            <label className="modal-check">
              <input type="checkbox" checked={form.activo}
                onChange={e => setForm(p => ({ ...p, activo: e.target.checked }))} />
              <span>Usuario Activo</span>
            </label>
            <div className="modal-actions">
              <button className="btn-cancelar" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn-guardar" onClick={guardarUsuario}>
                {editando ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}