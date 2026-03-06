import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

interface Actividad {
  id: number;
  codigo: string;
  descripcion: string;
  activo: boolean;
}

interface Modulo {
  id: number;
  codigo: string;
  nombre: string;
  icono: string;
  orden: number;
}

const styles = `
  .act-wrap { padding:0; }
  .act-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
  .act-title { font-size:20px; font-weight:600; color:#1f2937; letter-spacing:-0.3px; }
  .act-title span { font-size:13px; font-weight:400; color:#9ca3af; margin-left:8px; }
  .btn-nuevo { display:flex; align-items:center; gap:8px; padding:10px 18px;
    background:linear-gradient(135deg,#16a34a,#22c55e); border:none; border-radius:10px;
    color:white; font-size:13px; font-weight:600; cursor:pointer; transition:opacity 0.2s; }
  .btn-nuevo:hover { opacity:0.9; }
  .act-layout { display:grid; grid-template-columns:1fr 1.5fr; gap:20px; align-items:start; }
  .act-table-wrap { background:white; border-radius:14px; border:1px solid #e5e7eb;
    overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.04); }
  .act-table { width:100%; border-collapse:collapse; }
  .act-table thead { background:#f9fafb; }
  .act-table th { padding:12px 16px; text-align:left; font-size:11px; font-weight:600;
    color:#6b7280; letter-spacing:0.06em; text-transform:uppercase; border-bottom:1px solid #e5e7eb; }
  .act-table td { padding:12px 16px; font-size:13px; color:#374151; border-bottom:1px solid #f3f4f6; }
  .act-table tr:last-child td { border-bottom:none; }
  .act-table tr:hover td { background:#f9fafb; cursor:pointer; }
  .act-table tr.selected td { background:#dcfce7; }
  .act-mobile-list { display:none; }
  .act-card { background:#fff; border:1px solid #e5e7eb; border-radius:10px; padding:12px; margin-bottom:8px; }
  .act-card-head { display:flex; justify-content:space-between; gap:8px; margin-bottom:8px; }
  .act-codigo { font-family:'DM Mono',monospace; font-weight:500; color:#16a34a; }
  .act-badge { display:inline-flex; align-items:center; padding:3px 8px;
    border-radius:6px; font-size:11px; font-weight:500; }
  .act-badge.activo { background:#dcfce7; color:#16a34a; }
  .act-badge.inactivo { background:#fee2e2; color:#dc2626; }
  .act-actions { display:flex; gap:6px; }
  .btn-edit { padding:5px 10px; background:#eff6ff; border:1px solid #bfdbfe;
    border-radius:6px; color:#2563eb; font-size:11px; font-weight:500; cursor:pointer; }
  .btn-edit:hover { background:#2563eb; color:white; }
  .btn-del { padding:5px 10px; background:#fef2f2; border:1px solid #fecaca;
    border-radius:6px; color:#dc2626; font-size:11px; font-weight:500; cursor:pointer; }
  .btn-del:hover { background:#dc2626; color:white; }

  /* Panel modulos */
  .modulos-panel { background:white; border-radius:14px; border:1px solid #e5e7eb;
    padding:24px; box-shadow:0 1px 3px rgba(0,0,0,0.04); }
  .modulos-panel-title { font-size:13px; font-weight:600; color:#1f2937; margin-bottom:4px; }
  .modulos-panel-sub { font-size:12px; color:#9ca3af; margin-bottom:20px; }
  .modulos-grid-check { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .mod-check-item { display:flex; align-items:center; gap:10px; padding:10px 12px;
    border:1px solid #e5e7eb; border-radius:10px; cursor:pointer; transition:all 0.15s; }
  .mod-check-item:hover { border-color:#22c55e; background:#f0fdf4; }
  .mod-check-item.checked { border-color:#22c55e; background:#dcfce7; }
  .mod-check-item input { width:15px; height:15px; accent-color:#16a34a; cursor:pointer; }
  .mod-check-icon { font-size:18px; }
  .mod-check-name { font-size:12px; font-weight:500; color:#374151; }
  .btn-guardar-mods { width:100%; margin-top:16px; padding:11px;
    background:linear-gradient(135deg,#16a34a,#22c55e);
    border:none; border-radius:10px; color:white; font-size:13px;
    font-weight:600; cursor:pointer; transition:opacity 0.2s; }
  .btn-guardar-mods:hover { opacity:0.9; }
  .btn-guardar-mods:disabled { opacity:0.6; cursor:not-allowed; }
  .panel-empty { text-align:center; padding:32px; color:#9ca3af; font-size:13px; }

  /* Modal */
  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5);
    display:flex; align-items:center; justify-content:center; z-index:1000; }
  .modal-box { background:white; border-radius:16px; padding:32px; width:400px;
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
  .success-msg { padding:10px 14px; background:#dcfce7; border:1px solid #bbf7d0;
    border-radius:8px; color:#16a34a; font-size:12px; font-weight:500; margin-bottom:16px; }
  .info-msg { padding:10px 14px; background:#e0f2fe; border:1px solid #bae6fd;
    border-radius:8px; color:#075985; font-size:12px; font-weight:500; margin-bottom:12px; }
  .error-msg { padding:10px 14px; background:#fef2f2; border:1px solid #fecaca;
    border-radius:8px; color:#b91c1c; font-size:12px; font-weight:500; margin-bottom:12px; }

  @media (max-width: 980px) {
    .act-layout { grid-template-columns:1fr; }
  }

  @media (max-width: 620px) {
    .act-header { flex-wrap:wrap; gap:10px; }
    .btn-nuevo { width:100%; justify-content:center; }
    .modulos-grid-check { grid-template-columns:1fr; }
    .act-table-wrap { display:none; }
    .act-mobile-list { display:block; }
    .modal-box { width:92vw; padding:20px; border-radius:12px; }
    .modal-actions { flex-direction:column; }
    .btn-cancelar, .btn-guardar { width:100%; }
  }
`;

export default function ListaActividades() {
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [seleccionada, setSeleccionada] = useState<Actividad | null>(null);
  const [modulosSeleccionados, setModulosSeleccionados] = useState<number[]>([]);
  const [guardandoMods, setGuardandoMods] = useState(false);
  const [exito, setExito] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<Actividad | null>(null);
  const [form, setForm] = useState({ codigo: '', descripcion: '', activo: true });

  const cargar = async () => {
    const { data } = await supabase.from('actividad_empresa').select('*').order('descripcion');
    if (data) setActividades(data);
  };

  const cargarModulos = async () => {
    const { data } = await supabase.from('modulos').select('*').eq('activo', true).order('orden');
    if (data) setModulos(data);
  };

  const cargarModulosActividad = async (actividadId: number) => {
    const { data } = await supabase
      .from('actividad_modulos').select('modulo_id').eq('actividad_id', actividadId);
    if (data) setModulosSeleccionados(data.map(d => d.modulo_id));
  };

  useEffect(() => { cargar(); cargarModulos(); }, []);

  const seleccionar = (act: Actividad) => {
    setSeleccionada(act);
    cargarModulosActividad(act.id);
    setExito('');
    setErrorMsg('');
  };

  const toggleModulo = (moduloId: number) => {
    setModulosSeleccionados(prev =>
      prev.includes(moduloId) ? prev.filter(id => id !== moduloId) : [...prev, moduloId]
    );
  };

  const guardarModulos = async () => {
    if (!seleccionada) return;
    setErrorMsg('');
    setGuardandoMods(true);
    try {
      const { error: errDelete } = await supabase
        .from('actividad_modulos')
        .delete()
        .eq('actividad_id', seleccionada.id);

      if (errDelete) throw errDelete;

      if (modulosSeleccionados.length > 0) {
        const { error: errInsert } = await supabase
          .from('actividad_modulos')
          .insert(modulosSeleccionados.map(modulo_id => ({ actividad_id: seleccionada.id, modulo_id })));

        if (errInsert) throw errInsert;
      }

      await cargarModulosActividad(seleccionada.id);
      setExito(`Modulos guardados para ${seleccionada.descripcion}`);
      setTimeout(() => setExito(''), 3000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'No se pudieron guardar los modulos de la actividad');
    } finally {
      setGuardandoMods(false);
    }
  };

  const abrirNuevo = () => {
    setEditando(null);
    setForm({ codigo: '', descripcion: '', activo: true });
    setModal(true);
  };

  const abrirEditar = (act: Actividad) => {
    setEditando(act);
    setForm({ codigo: act.codigo, descripcion: act.descripcion, activo: act.activo });
    setModal(true);
  };

  const guardarActividad = async () => {
    if (!form.codigo || !form.descripcion) return;
    if (editando) {
      await supabase.from('actividad_empresa').update(form).eq('id', editando.id);
    } else {
      await supabase.from('actividad_empresa').insert(form);
    }
    setModal(false);
    cargar();
  };

  const eliminar = async (act: Actividad) => {
    const { data } = await supabase.from('empresas').select('id').eq('actividad_id', act.id);
    if (data && data.length > 0) {
      alert('Esta actividad esta asignada a empresas. No se puede eliminar.');
      return;
    }
    await supabase.from('actividad_modulos').delete().eq('actividad_id', act.id);
    await supabase.from('actividad_empresa').delete().eq('id', act.id);
    if (seleccionada?.id === act.id) setSeleccionada(null);
    cargar();
  };

  return (
    <>
      <style>{styles}</style>
      <div className="act-wrap">
        <div className="act-header">
          <div className="act-title">
            Actividades de Empresa
            <span>{actividades.length} registros</span>
          </div>
          <button className="btn-nuevo" onClick={abrirNuevo}>+ Nueva Actividad</button>
        </div>

        <div className="info-msg">
          Aqui se define que modulos hereda cada actividad. Esto impacta la visibilidad en Empresas y menu del usuario.
        </div>
        {exito && <div className="success-msg">✓ {exito}</div>}
        {errorMsg && <div className="error-msg">⚠ {errorMsg}</div>}

        <div className="act-layout">
          {/* Tabla actividades */}
          <div className="act-table-wrap rv-desktop-table">
            <table className="act-table">
              <thead>
                <tr>
                  <th>Codigo</th>
                  <th>Descripcion</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {actividades.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>
                    No hay actividades. Cree una nueva.
                  </td></tr>
                ) : actividades.map(act => (
                  <tr key={act.id}
                    className={seleccionada?.id === act.id ? 'selected' : ''}
                    onClick={() => seleccionar(act)}>
                    <td><span className="act-codigo">{act.codigo}</span></td>
                    <td>{act.descripcion}</td>
                    <td>
                      <span className={`act-badge ${act.activo ? 'activo' : 'inactivo'}`}>
                        {act.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className="act-actions" onClick={e => e.stopPropagation()}>
                        <button className="btn-edit" onClick={() => abrirEditar(act)}>Editar</button>
                        <button className="btn-del" onClick={() => eliminar(act)}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="act-mobile-list rv-mobile-cards">
            {actividades.length === 0 ? (
              <div className="panel-empty">No hay actividades. Cree una nueva.</div>
            ) : actividades.map((act) => (
              <div
                key={`m-${act.id}`}
                className="act-card"
                style={seleccionada?.id === act.id ? { borderColor: '#22c55e', background: '#f0fdf4' } : undefined}
                onClick={() => seleccionar(act)}
              >
                <div className="act-card-head">
                  <span className="act-codigo">{act.codigo}</span>
                  <span className={`act-badge ${act.activo ? 'activo' : 'inactivo'}`}>
                    {act.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937', marginBottom: '8px' }}>
                  {act.descripcion}
                </div>
                <div className="act-actions" onClick={(e) => e.stopPropagation()}>
                  <button className="btn-edit" onClick={() => abrirEditar(act)}>Editar</button>
                  <button className="btn-del" onClick={() => eliminar(act)}>Eliminar</button>
                </div>
              </div>
            ))}
          </div>

          {/* Panel modulos */}
          <div className="modulos-panel">
            {!seleccionada ? (
              <div className="panel-empty">
                Seleccione una actividad para asignar sus modulos
              </div>
            ) : (
              <>
                <div className="modulos-panel-title">
                  Modulos para: {seleccionada.descripcion}
                </div>
                <div className="modulos-panel-sub">
                  Seleccione los modulos que tendra acceso esta actividad
                </div>
                <div className="modulos-grid-check">
                  {modulos.map(mod => (
                    <div key={mod.id}
                      className={`mod-check-item ${modulosSeleccionados.includes(mod.id) ? 'checked' : ''}`}
                      onClick={() => toggleModulo(mod.id)}>
                      <input type="checkbox" readOnly
                        checked={modulosSeleccionados.includes(mod.id)} />
                      <span className="mod-check-icon">{mod.icono}</span>
                      <span className="mod-check-name">{mod.nombre}</span>
                    </div>
                  ))}
                </div>
                <button className="btn-guardar-mods" onClick={guardarModulos} disabled={guardandoMods}>
                  {guardandoMods ? 'Guardando...' : 'Guardar Modulos'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal nueva/editar actividad */}
      {modal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-title">
              {editando ? 'Editar Actividad' : 'Nueva Actividad'}
            </div>
            <div className="modal-field">
              <label className="modal-label">Codigo *</label>
              <input className="modal-input" value={form.codigo} maxLength={10}
                onChange={e => setForm(p => ({ ...p, codigo: e.target.value.toUpperCase() }))}
                placeholder="AGR" />
            </div>
            <div className="modal-field">
              <label className="modal-label">Descripcion *</label>
              <input className="modal-input" value={form.descripcion}
                onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
                placeholder="Agricultura" />
            </div>
            <label className="modal-check">
              <input type="checkbox" checked={form.activo}
                onChange={e => setForm(p => ({ ...p, activo: e.target.checked }))} />
              <span>Activo</span>
            </label>
            <div className="modal-actions">
              <button className="btn-cancelar" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn-guardar" onClick={guardarActividad}>
                {editando ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
