import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabase';

interface Modulo {
  id: number;
  codigo: string;
  nombre: string;
  icono: string;
  orden: number;
  activo: boolean;
}

const styles = `
  .mod-wrap { padding:0; }
  .mod-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
  .mod-title { font-size:20px; font-weight:600; color:#1f2937; letter-spacing:-0.3px; }
  .mod-title span { font-size:13px; font-weight:400; color:#9ca3af; margin-left:8px; }
  .btn-nuevo { display:flex; align-items:center; gap:8px; padding:10px 18px;
    background:linear-gradient(135deg,#16a34a,#22c55e); border:none; border-radius:10px;
    color:white; font-size:13px; font-weight:600; cursor:pointer; transition:opacity 0.2s; }
  .btn-nuevo:hover { opacity:0.9; }

  .mod-table-wrap { background:white; border-radius:14px; border:1px solid #e5e7eb;
    overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.04); }
  .mod-table { width:100%; border-collapse:collapse; }
  .mod-table thead { background:#f9fafb; }
  .mod-table th { padding:12px 16px; text-align:left; font-size:11px; font-weight:600;
    color:#6b7280; letter-spacing:0.06em; text-transform:uppercase; border-bottom:1px solid #e5e7eb; }
  .mod-table td { padding:12px 16px; font-size:13px; color:#374151; border-bottom:1px solid #f3f4f6; }
  .mod-table tr:last-child td { border-bottom:none; }
  .mod-table tr:hover td { background:#f9fafb; }
  .mod-codigo { font-family:'DM Mono',monospace; color:#16a34a; font-weight:500; }
  .mod-icono { font-size:18px; }
  .mod-order { font-family:'DM Mono',monospace; color:#6b7280; }
  .mod-badge { display:inline-flex; align-items:center; padding:3px 8px; border-radius:6px; font-size:11px; font-weight:500; }
  .mod-badge.activo { background:#dcfce7; color:#16a34a; }
  .mod-badge.inactivo { background:#fee2e2; color:#dc2626; }
  .mod-actions { display:flex; gap:6px; }
  .btn-edit { padding:5px 10px; background:#eff6ff; border:1px solid #bfdbfe;
    border-radius:6px; color:#2563eb; font-size:11px; font-weight:500; cursor:pointer; }
  .btn-edit:hover { background:#2563eb; color:white; }
  .btn-del { padding:5px 10px; background:#fef2f2; border:1px solid #fecaca;
    border-radius:6px; color:#dc2626; font-size:11px; font-weight:500; cursor:pointer; }
  .btn-del:hover { background:#dc2626; color:white; }

  .success-msg { padding:10px 14px; background:#dcfce7; border:1px solid #bbf7d0;
    border-radius:8px; color:#16a34a; font-size:12px; font-weight:500; margin-bottom:16px; }

  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5);
    display:flex; align-items:center; justify-content:center; z-index:1000; }
  .modal-box { background:white; border-radius:16px; padding:32px; width:460px;
    box-shadow:0 20px 60px rgba(0,0,0,0.2); }
  .modal-title { font-size:17px; font-weight:600; color:#1f2937; margin-bottom:20px; }
  .modal-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .modal-field { margin-bottom:16px; }
  .modal-field.full { grid-column:1 / -1; }
  .modal-label { display:block; font-size:11px; font-weight:500; color:#6b7280;
    letter-spacing:0.04em; text-transform:uppercase; margin-bottom:6px; }
  .modal-input { width:100%; padding:9px 12px; border:1px solid #e5e7eb;
    border-radius:8px; font-size:13px; color:#1f2937; outline:none;
    font-family:'DM Sans',sans-serif; transition:border-color 0.2s; }
  .modal-input:focus { border-color:#22c55e; box-shadow:0 0 0 3px rgba(34,197,94,0.1); }
  .modal-check { display:flex; align-items:center; gap:8px; cursor:pointer; margin-top:4px; }
  .modal-check input { width:15px; height:15px; accent-color:#16a34a; }
  .modal-check span { font-size:13px; color:#374151; }
  .modal-actions { display:flex; gap:10px; justify-content:flex-end; margin-top:24px; }
  .btn-cancelar { padding:9px 16px; background:#f3f4f6; border:none; border-radius:8px;
    color:#374151; font-size:13px; font-weight:500; cursor:pointer; }
  .btn-cancelar:hover { background:#e5e7eb; }
  .btn-guardar { padding:9px 20px; background:linear-gradient(135deg,#16a34a,#22c55e);
    border:none; border-radius:8px; color:white; font-size:13px; font-weight:600; cursor:pointer; }
  .btn-guardar:hover { opacity:0.9; }
`;

const iconosBase = ['🧮', '🏛️', '📬', '🧑‍💼', '📦', '🪪', '🏗️', '🗂️', '🧾', '💳', '📈', '📊', '🛠️'];

interface ListaModulosProps {
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

export default function ListaModulos({
  canCreate = true,
  canEdit = true,
  canDelete = true
}: ListaModulosProps) {
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<Modulo | null>(null);
  const [exito, setExito] = useState('');
  const [form, setForm] = useState({
    codigo: '',
    nombre: '',
    icono: '🧩',
    orden: 1,
    activo: true
  });

  const cargar = async () => {
    const { data } = await supabase.from('modulos').select('*').order('orden');
    if (data) setModulos(data);
  };

  useEffect(() => {
    cargar();
  }, []);

  const mostrarExito = (msg: string) => {
    setExito(msg);
    setTimeout(() => setExito(''), 3000);
  };

  const abrirNuevo = () => {
    if (!canCreate) return;
    setEditando(null);
    setForm({
      codigo: '',
      nombre: '',
      icono: '🧩',
      orden: modulos.length + 1,
      activo: true
    });
    setModal(true);
  };

  const abrirEditar = (modulo: Modulo) => {
    if (!canEdit) return;
    setEditando(modulo);
    setForm({
      codigo: modulo.codigo,
      nombre: modulo.nombre,
      icono: modulo.icono || '🧩',
      orden: modulo.orden ?? 1,
      activo: modulo.activo
    });
    setModal(true);
  };

  const guardar = async () => {
    if (editando && !canEdit) return;
    if (!editando && !canCreate) return;
    if (!form.codigo.trim() || !form.nombre.trim()) return;

    const payload = {
      codigo: form.codigo.trim().toUpperCase(),
      nombre: form.nombre.trim(),
      icono: form.icono || '🧩',
      orden: Number(form.orden) || 1,
      activo: form.activo
    };

    if (editando) {
      await supabase.from('modulos').update(payload).eq('id', editando.id);
      mostrarExito('Módulo actualizado correctamente');
    } else {
      await supabase.from('modulos').insert(payload);
      mostrarExito('Módulo creado correctamente');
    }

    setModal(false);
    cargar();
  };

  const eliminar = async (modulo: Modulo) => {
    if (!canDelete) return;
    const { count } = await supabase
      .from('actividad_modulos')
      .select('*', { count: 'exact', head: true })
      .eq('modulo_id', modulo.id);

    if (count && count > 0) {
      alert('⚠️ Este módulo está asignado a actividades. No se puede eliminar.');
      return;
    }

    await supabase.from('modulos').delete().eq('id', modulo.id);
    mostrarExito('Módulo eliminado');
    cargar();
  };

  return (
    <>
      <style>{styles}</style>
      <div className="mod-wrap">
        <div className="mod-header">
          <div className="mod-title">
            Módulos
            <span>{modulos.length} registros</span>
          </div>
          {canCreate && (
            <button className="btn-nuevo" onClick={abrirNuevo}>+ Nuevo Módulo</button>
          )}
        </div>

        {exito && <div className="success-msg">{exito}</div>}

        <div className="mod-table-wrap">
          <table className="mod-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Ícono</th>
                <th>Orden</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {modulos.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>
                    No hay módulos registrados
                  </td>
                </tr>
              ) : modulos.map(modulo => (
                <tr key={modulo.id}>
                  <td><span className="mod-codigo">{modulo.codigo}</span></td>
                  <td>{modulo.nombre}</td>
                  <td><span className="mod-icono">{modulo.icono || '🧩'}</span></td>
                  <td><span className="mod-order">{modulo.orden}</span></td>
                  <td>
                    <span className={`mod-badge ${modulo.activo ? 'activo' : 'inactivo'}`}>
                      {modulo.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="mod-actions">
                      {canEdit && (
                        <button className="btn-edit" onClick={() => abrirEditar(modulo)}>Editar</button>
                      )}
                      {canDelete && (
                        <button className="btn-del" onClick={() => eliminar(modulo)}>Eliminar</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-title">{editando ? 'Editar Módulo' : 'Nuevo Módulo'}</div>

            <div className="modal-grid">
              <div className="modal-field">
                <label className="modal-label">Código *</label>
                <input
                  className="modal-input"
                  maxLength={20}
                  value={form.codigo}
                  onChange={e => setForm(prev => ({ ...prev, codigo: e.target.value.toUpperCase() }))}
                  placeholder="CONTAB"
                />
              </div>

              <div className="modal-field">
                <label className="modal-label">Orden</label>
                <input
                  className="modal-input"
                  type="number"
                  min={1}
                  value={form.orden}
                  onChange={e => setForm(prev => ({ ...prev, orden: Number(e.target.value) || 1 }))}
                />
              </div>

              <div className="modal-field full">
                <label className="modal-label">Nombre *</label>
                <input
                  className="modal-input"
                  value={form.nombre}
                  onChange={e => setForm(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Contabilidad"
                />
              </div>

              <div className="modal-field full">
                <label className="modal-label">Ícono</label>
                <input
                  className="modal-input"
                  maxLength={4}
                  value={form.icono}
                  onChange={e => setForm(prev => ({ ...prev, icono: e.target.value }))}
                  placeholder="🧩"
                />
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                  {iconosBase.map(icono => (
                    <button
                      key={icono}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, icono }))}
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        border: form.icono === icono ? '1px solid #22c55e' : '1px solid #e5e7eb',
                        background: form.icono === icono ? '#f0fdf4' : '#fff',
                        cursor: 'pointer'
                      }}
                    >
                      {icono}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <label className="modal-check">
              <input
                type="checkbox"
                checked={form.activo}
                onChange={e => setForm(prev => ({ ...prev, activo: e.target.checked }))}
              />
              <span>Activo</span>
            </label>

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


