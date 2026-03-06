import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabase';

interface TipoAsiento {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  color: string;
  orden: number;
  activo: boolean;
}

const styles = `
  .ta-wrap { padding:0; }
  .ta-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
  .ta-title { font-size:20px; font-weight:600; color:#1f2937; letter-spacing:-0.3px; }
  .ta-title span { font-size:13px; font-weight:400; color:#9ca3af; margin-left:8px; }
  .ta-btn { padding:9px 16px; border-radius:9px; border:none; cursor:pointer; font-size:13px; font-weight:600; }
  .ta-btn.primary { color:#fff; background:linear-gradient(135deg,#16a34a,#22c55e); }
  .ta-btn.neutral { color:#374151; background:#f3f4f6; border:1px solid #e5e7eb; }
  .ta-btn:disabled { opacity:.6; cursor:not-allowed; }
  .ta-msg-ok { margin-bottom:12px; padding:10px 14px; border-radius:8px; border:1px solid #bbf7d0; background:#dcfce7; color:#166534; font-size:12px; }
  .ta-msg-err { margin-bottom:12px; padding:10px 14px; border-radius:8px; border:1px solid #fecaca; background:#fef2f2; color:#b91c1c; font-size:12px; }
  .ta-table-wrap { background:#fff; border:1px solid #e5e7eb; border-radius:14px; overflow:hidden; }
  .ta-table { width:100%; border-collapse:collapse; }
  .ta-table th { background:#f9fafb; padding:12px 14px; font-size:11px; text-transform:uppercase; letter-spacing:.05em; color:#6b7280; text-align:left; border-bottom:1px solid #e5e7eb; }
  .ta-table td { padding:12px 14px; border-bottom:1px solid #f3f4f6; font-size:13px; color:#374151; }
  .ta-table tr:last-child td { border-bottom:none; }
  .ta-mobile-list { display:none; }
  .ta-row-card { background:#fff; border:1px solid #e5e7eb; border-radius:10px; padding:12px; margin-bottom:8px; }
  .ta-row-head { display:flex; justify-content:space-between; gap:8px; margin-bottom:8px; }
  .ta-chip { display:inline-flex; align-items:center; gap:6px; padding:4px 8px; border-radius:999px; font-size:11px; font-weight:600; background:#f8fafc; border:1px solid #e2e8f0; }
  .ta-dot { width:10px; height:10px; border-radius:50%; display:inline-block; }
  .ta-actions { display:flex; gap:8px; }
  .ta-link { padding:5px 10px; border-radius:6px; border:1px solid #bfdbfe; background:#eff6ff; color:#2563eb; cursor:pointer; font-size:11px; }
  .ta-link.danger { border-color:#fecaca; background:#fef2f2; color:#dc2626; }
  .ta-modal-bg { position:fixed; inset:0; background:rgba(0,0,0,.42); display:flex; align-items:center; justify-content:center; z-index:1000; }
  .ta-modal { width:min(560px,96vw); background:#fff; border-radius:14px; border:1px solid #e5e7eb; padding:22px; }
  .ta-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .ta-group { display:flex; flex-direction:column; gap:6px; }
  .ta-group.span2 { grid-column:span 2; }
  .ta-label { font-size:11px; color:#6b7280; text-transform:uppercase; letter-spacing:.04em; }
  .ta-input { width:100%; padding:9px 10px; border:1px solid #e5e7eb; border-radius:8px; font-size:13px; outline:none; }
  .ta-input:focus { border-color:#22c55e; box-shadow:0 0 0 3px rgba(34,197,94,0.1); }
  .ta-footer { margin-top:16px; display:flex; justify-content:flex-end; gap:8px; }

  @media (max-width: 620px) {
    .ta-header { flex-wrap:wrap; gap:10px; }
    .ta-btn.primary { width:100%; }
    .ta-table-wrap { display:none; }
    .ta-mobile-list { display:block; }
    .ta-grid { grid-template-columns:1fr; gap:8px; }
    .ta-group.span2 { grid-column:span 1; }
    .ta-footer { flex-direction:column; }
    .ta-btn.neutral, .ta-btn.primary { width:100%; }
  }
`;

const defaultForm = {
  codigo: '',
  nombre: '',
  descripcion: '',
  color: '#16a34a',
  orden: 100,
  activo: true,
};

export default function TiposAsiento({ canEdit }: { canEdit: boolean }) {
  const [tipos, setTipos] = useState<TipoAsiento[]>([]);
  const [msgOk, setMsgOk] = useState('');
  const [msgErr, setMsgErr] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(defaultForm);

  const cargar = async () => {
    setMsgErr('');
    const { data, error } = await supabase
      .from('asiento_tipos')
      .select('*')
      .order('orden', { ascending: true })
      .order('codigo', { ascending: true });
    if (error) {
      setMsgErr(error.message);
      setTipos([]);
      return;
    }
    setTipos((data || []) as TipoAsiento[]);
  };

  useEffect(() => { cargar(); }, []);

  const abrirNuevo = () => {
    setEditingId(null);
    setForm(defaultForm);
    setModalOpen(true);
  };

  const abrirEditar = (t: TipoAsiento) => {
    setEditingId(t.id);
    setForm({
      codigo: t.codigo,
      nombre: t.nombre,
      descripcion: t.descripcion || '',
      color: t.color || '#16a34a',
      orden: t.orden ?? 100,
      activo: !!t.activo,
    });
    setModalOpen(true);
  };

  const guardar = async () => {
    if (!form.codigo.trim() || !form.nombre.trim()) {
      setMsgErr('Codigo y nombre son obligatorios.');
      return;
    }
    setSaving(true);
    setMsgErr('');

    const payload = {
      codigo: form.codigo.trim().toUpperCase(),
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      color: form.color || '#16a34a',
      orden: Number(form.orden) || 100,
      activo: !!form.activo,
    };

    let error: any = null;
    if (editingId) {
      ({ error } = await supabase.from('asiento_tipos').update(payload).eq('id', editingId));
    } else {
      ({ error } = await supabase.from('asiento_tipos').insert(payload));
    }

    setSaving(false);
    if (error) {
      setMsgErr(error.message || 'No se pudo guardar.');
      return;
    }

    setModalOpen(false);
    setMsgOk(editingId ? 'Tipo actualizado.' : 'Tipo creado.');
    setTimeout(() => setMsgOk(''), 2500);
    await cargar();
  };

  const toggleActivo = async (t: TipoAsiento) => {
    if (!canEdit) return;
    const { error } = await supabase.from('asiento_tipos').update({ activo: !t.activo }).eq('id', t.id);
    if (error) {
      setMsgErr(error.message);
      return;
    }
    await cargar();
  };

  return (
    <>
      <style>{styles}</style>
      <div className="ta-wrap">
        <div className="ta-header">
          <div className="ta-title">Tipos de Asiento <span>{tipos.length} registros</span></div>
          <button className="ta-btn primary" onClick={abrirNuevo} disabled={!canEdit}>+ Nuevo Tipo</button>
        </div>

        {msgOk && <div className="ta-msg-ok">{msgOk}</div>}
        {msgErr && <div className="ta-msg-err">{msgErr}</div>}

        <div className="ta-table-wrap">
          <table className="ta-table">
            <thead>
              <tr>
                <th>Codigo</th>
                <th>Nombre</th>
                <th>Descripcion</th>
                <th>Color</th>
                <th>Orden</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tipos.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: '#9ca3af' }}>Sin tipos de asiento</td></tr>
              ) : tipos.map((t) => (
                <tr key={t.id}>
                  <td style={{ fontFamily: 'DM Mono, monospace' }}>{t.codigo}</td>
                  <td>{t.nombre}</td>
                  <td>{t.descripcion || '-'}</td>
                  <td>
                    <span className="ta-chip">
                      <span className="ta-dot" style={{ background: t.color || '#16a34a' }} />
                      {t.color || '#16a34a'}
                    </span>
                  </td>
                  <td>{t.orden}</td>
                  <td>{t.activo ? 'Activo' : 'Inactivo'}</td>
                  <td>
                    <div className="ta-actions">
                      <button className="ta-link" disabled={!canEdit} onClick={() => abrirEditar(t)}>Editar</button>
                      <button className="ta-link danger" disabled={!canEdit} onClick={() => toggleActivo(t)}>
                        {t.activo ? 'Inactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="ta-mobile-list">
          {tipos.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#9ca3af', padding: '20px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px' }}>
              Sin tipos de asiento
            </div>
          ) : tipos.map((t) => (
            <div key={`m-${t.id}`} className="ta-row-card">
              <div className="ta-row-head">
                <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 700 }}>{t.codigo}</span>
                <span>{t.activo ? 'Activo' : 'Inactivo'}</span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937', marginBottom: '6px' }}>{t.nombre}</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>{t.descripcion || '-'}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="ta-chip">
                  <span className="ta-dot" style={{ background: t.color || '#16a34a' }} />
                  {t.color || '#16a34a'}
                </span>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>Orden: {t.orden}</span>
              </div>
              <div className="ta-actions">
                <button className="ta-link" disabled={!canEdit} onClick={() => abrirEditar(t)}>Editar</button>
                <button className="ta-link danger" disabled={!canEdit} onClick={() => toggleActivo(t)}>
                  {t.activo ? 'Inactivar' : 'Activar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {modalOpen && (
        <div className="ta-modal-bg">
          <div className="ta-modal">
            <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 14 }}>
              {editingId ? 'Editar Tipo de Asiento' : 'Nuevo Tipo de Asiento'}
            </div>
            <div className="ta-grid">
              <div className="ta-group">
                <label className="ta-label">Codigo *</label>
                <input className="ta-input" value={form.codigo} onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))} />
              </div>
              <div className="ta-group">
                <label className="ta-label">Nombre *</label>
                <input className="ta-input" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} />
              </div>
              <div className="ta-group span2">
                <label className="ta-label">Descripcion</label>
                <input className="ta-input" value={form.descripcion} onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))} />
              </div>
              <div className="ta-group">
                <label className="ta-label">Color</label>
                <input className="ta-input" type="color" value={form.color} onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))} />
              </div>
              <div className="ta-group">
                <label className="ta-label">Orden</label>
                <input className="ta-input" type="number" value={form.orden} onChange={(e) => setForm((p) => ({ ...p, orden: Number(e.target.value) || 100 }))} />
              </div>
              <div className="ta-group span2" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={form.activo} onChange={(e) => setForm((p) => ({ ...p, activo: e.target.checked }))} />
                <label>Activo</label>
              </div>
            </div>
            <div className="ta-footer">
              <button className="ta-btn neutral" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</button>
              <button className="ta-btn primary" onClick={guardar} disabled={saving || !canEdit}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
