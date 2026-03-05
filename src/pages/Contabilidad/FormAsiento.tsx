import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

interface Linea {
  id?: number;
  cuenta_id: number | null;
  cuenta_codigo: string;
  cuenta_nombre: string;
  descripcion: string;
  debito_crc: number;
  credito_crc: number;
  debito_usd: number;
  credito_usd: number;
}

interface Props {
  empresaId: number;
  asiento?: any;
  onGuardar: () => void;
  onCancelar: () => void;
}

const styles = `
  .fa-wrap { max-width:1000px; margin:0 auto; }
  .fa-topbar { display:flex; align-items:center; gap:12px; margin-bottom:24px; }
  .btn-back { display:flex; align-items:center; gap:6px; padding:8px 14px;
    background:#f3f4f6; border:1px solid #e5e7eb; border-radius:8px;
    color:#374151; font-size:13px; font-weight:500; cursor:pointer; }
  .btn-back:hover { background:#e5e7eb; }
  .fa-page-title { font-size:18px; font-weight:600; color:#1f2937; }
  .fa-num-badge { font-family:'DM Mono',monospace; font-size:14px; font-weight:700;
    color:#16a34a; background:#dcfce7; padding:4px 12px; border-radius:8px;
    border:1px solid #bbf7d0; }
  .fa-card { background:white; border:1px solid #e5e7eb; border-radius:14px;
    padding:24px; margin-bottom:16px; box-shadow:0 1px 3px rgba(0,0,0,0.04); }
  .fa-section-title { font-size:11px; font-weight:600; color:#16a34a;
    letter-spacing:0.08em; text-transform:uppercase; margin-bottom:18px;
    padding-bottom:8px; border-bottom:1px solid #dcfce7; }
  .fa-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
  .fa-grid-4 { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
  .fa-group { display:flex; flex-direction:column; gap:5px; }
  .fa-group.span2 { grid-column:span 2; }
  .fa-group.span3 { grid-column:span 3; }
  .fa-label { font-size:11px; font-weight:500; color:#6b7280;
    letter-spacing:0.04em; text-transform:uppercase; }
  .fa-input { padding:9px 12px; border:1px solid #e5e7eb; border-radius:8px;
    font-size:13px; color:#1f2937; font-family:'DM Sans',sans-serif;
    outline:none; transition:border-color 0.2s; width:100%; }
  .fa-input:focus { border-color:#22c55e; box-shadow:0 0 0 3px rgba(34,197,94,0.1); }
  .fa-input:disabled { background:#f9fafb; color:#9ca3af; }

  /* Tabla de líneas */
  .lineas-table-wrap { overflow-x:auto; }
  .lineas-table { width:100%; border-collapse:collapse; min-width:800px; }
  .lineas-table th { padding:10px 12px; text-align:left; font-size:11px; font-weight:600;
    color:#6b7280; letter-spacing:0.05em; text-transform:uppercase;
    background:#f9fafb; border-bottom:1px solid #e5e7eb; }
  .lineas-table td { padding:8px 6px; border-bottom:1px solid #f3f4f6; vertical-align:middle; }
  .lineas-table tr:last-child td { border-bottom:none; }
  .linea-input { padding:7px 10px; border:1px solid #e5e7eb; border-radius:7px;
    font-size:12px; color:#1f2937; font-family:'DM Sans',sans-serif;
    outline:none; width:100%; transition:border-color 0.2s; }
  .linea-input:focus { border-color:#22c55e; }
  .linea-input.mono { font-family:'DM Mono',monospace; text-align:right; }
  .linea-input.cuenta { font-family:'DM Mono',monospace; width:140px; }
  .btn-add-linea { display:flex; align-items:center; gap:6px; padding:8px 16px;
    background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px;
    color:#16a34a; font-size:13px; font-weight:500; cursor:pointer;
    margin-top:12px; transition:all 0.15s; }
  .btn-add-linea:hover { background:#16a34a; color:white; }
  .btn-del-linea { padding:5px 8px; background:#fef2f2; border:1px solid #fecaca;
    border-radius:6px; color:#dc2626; font-size:12px; cursor:pointer; }
  .btn-del-linea:hover { background:#dc2626; color:white; }

  /* Totales */
  .totales-bar { display:flex; gap:16px; align-items:center; justify-content:flex-end;
    padding:16px 0; border-top:2px solid #e5e7eb; margin-top:8px; flex-wrap:wrap; }
  .total-item { display:flex; flex-direction:column; align-items:flex-end; gap:2px; }
  .total-label { font-size:11px; color:#6b7280; font-weight:500; text-transform:uppercase; }
  .total-value { font-size:16px; font-weight:700; font-family:'DM Mono',monospace; }
  .total-ok { color:#16a34a; }
  .total-error { color:#dc2626; }
  .balance-ok { padding:8px 16px; background:#dcfce7; border:1px solid #bbf7d0;
    border-radius:8px; color:#16a34a; font-size:13px; font-weight:600; }
  .balance-error { padding:8px 16px; background:#fee2e2; border:1px solid #fecaca;
    border-radius:8px; color:#dc2626; font-size:13px; font-weight:600; }

  /* Footer */
  .fa-footer { display:flex; justify-content:flex-end; gap:10px; margin-top:8px; }
  .btn-borrador { padding:11px 20px; background:#fef9c3; border:1px solid #fde68a;
    border-radius:10px; color:#854d0e; font-size:13px; font-weight:600; cursor:pointer; }
  .btn-borrador:hover { background:#fde68a; }
  .btn-confirmar { padding:11px 24px; background:linear-gradient(135deg,#16a34a,#22c55e);
    border:none; border-radius:10px; color:white; font-size:14px;
    font-weight:600; cursor:pointer; transition:opacity 0.2s; }
  .btn-confirmar:hover { opacity:0.9; }
  .btn-confirmar:disabled { opacity:0.6; cursor:not-allowed; }
  .btn-cancelar { padding:11px 20px; background:#f3f4f6; border:1px solid #e5e7eb;
    border-radius:10px; color:#374151; font-size:13px; font-weight:500; cursor:pointer; }
  .btn-cancelar:hover { background:#e5e7eb; }
  .fa-success { padding:12px 16px; background:#dcfce7; border:1px solid #bbf7d0;
    border-radius:8px; color:#16a34a; font-size:13px; font-weight:500; margin-bottom:16px; }

  /* Búsqueda cuenta */
  .cuenta-search-wrap { position:relative; }
  .cuenta-dropdown { position:absolute; top:100%; left:0; right:0; background:white;
    border:1px solid #e5e7eb; border-radius:8px; box-shadow:0 8px 24px rgba(0,0,0,0.12);
    z-index:100; max-height:200px; overflow-y:auto; }
  .cuenta-option { padding:8px 12px; cursor:pointer; font-size:12px;
    border-bottom:1px solid #f3f4f6; transition:background 0.1s; }
  .cuenta-option:hover { background:#f0fdf4; }
  .cuenta-option-codigo { font-family:'DM Mono',monospace; color:#16a34a; font-weight:600; }
  .cuenta-option-nombre { color:#374151; margin-left:8px; }
  .estado-view { display:inline-flex; align-items:center; padding:4px 12px;
    border-radius:8px; font-size:13px; font-weight:600; }
  .estado-view.CONFIRMADO { background:#dcfce7; color:#16a34a; }
  .estado-view.ANULADO { background:#fee2e2; color:#dc2626; }
  .estado-view.BORRADOR { background:#fef9c3; color:#854d0e; }
`;

const lineaVacia = (): Linea => ({
  cuenta_id: null, cuenta_codigo: '', cuenta_nombre: '',
  descripcion: '', debito_crc: 0, credito_crc: 0,
  debito_usd: 0, credito_usd: 0,
});

function BuscarCuenta({ value, onChange }: {
  value: string;
  onChange: (cuenta: any) => void;
}) {
  const [query, setQuery] = useState(value);
  const [resultados, setResultados] = useState<any[]>([]);
  const [abierto, setAbierto] = useState(false);

  const buscar = async (q: string) => {
    setQuery(q);
    if (q.length < 2) { setResultados([]); return; }
    const { data } = await supabase
      .from('plan_cuentas_base')
      .select('id, codigo, nombre')
      .eq('acepta_movimiento', true)
      .eq('activo', true)
      .or(`codigo.ilike.%${q}%,nombre.ilike.%${q}%`)
      .limit(10);
    if (data) { setResultados(data); setAbierto(true); }
  };

  const seleccionar = (cuenta: any) => {
    setQuery(cuenta.codigo);
    setAbierto(false);
    onChange(cuenta);
  };

  return (
    <div className="cuenta-search-wrap">
      <input className="linea-input cuenta"
        value={query}
        onChange={e => buscar(e.target.value)}
        onFocus={() => query.length >= 2 && setAbierto(true)}
        placeholder="Código o nombre"
      />
      {abierto && resultados.length > 0 && (
        <div className="cuenta-dropdown">
          {resultados.map(c => (
            <div key={c.id} className="cuenta-option" onClick={() => seleccionar(c)}>
              <span className="cuenta-option-codigo">{c.codigo}</span>
              <span className="cuenta-option-nombre">{c.nombre}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FormAsiento({ empresaId, asiento, onGuardar, onCancelar }: Props) {
  const [categorias, setCategorias] = useState<any[]>([]);
  const [form, setForm] = useState({
    categoria_id: asiento?.categoria_id || '',
    fecha: asiento?.fecha || new Date().toISOString().split('T')[0],
    descripcion: asiento?.descripcion || '',
    moneda: asiento?.moneda || 'CRC',
    tipo_cambio: asiento?.tipo_cambio || 1,
  });
  const [lineas, setLineas] = useState<Linea[]>(
    asiento ? [] : [lineaVacia(), lineaVacia()]
  );
  const [numeroFormato, setNumeroFormato] = useState(asiento?.numero_formato || '');
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState('');
  const esVista = asiento?.estado === 'CONFIRMADO' || asiento?.estado === 'ANULADO';

  useEffect(() => {
    supabase.from('asiento_categorias').select('*').eq('activo', true).order('codigo')
      .then(({ data }) => { if (data) setCategorias(data); });

    if (asiento?.id) {
      supabase.from('asiento_lineas')
        .select('*, plan_cuentas_base(codigo, nombre)')
        .eq('asiento_id', asiento.id)
        .order('linea')
        .then(({ data }) => {
          if (data) {
            setLineas(data.map((l: any) => ({
              id: l.id,
              cuenta_id: l.cuenta_id,
              cuenta_codigo: l.plan_cuentas_base?.codigo || '',
              cuenta_nombre: l.plan_cuentas_base?.nombre || '',
              descripcion: l.descripcion || '',
              debito_crc: l.debito_crc || 0,
              credito_crc: l.credito_crc || 0,
              debito_usd: l.debito_usd || 0,
              credito_usd: l.credito_usd || 0,
            })));
          }
        });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Calcular número cuando cambia categoría
  useEffect(() => {
    if (!form.categoria_id || asiento?.id) return;
    const calcularNumero = async () => {
      const anio = new Date(form.fecha).getFullYear();
      const cat = categorias.find(c => c.id === parseInt(String(form.categoria_id)));
      if (!cat) return;

      // Obtener o crear numeración
      const { data } = await supabase
        .from('asiento_numeracion')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('categoria_id', form.categoria_id)
        .eq('anio', anio)
        .single();

      const siguiente = (data?.ultimo_numero || 0) + 1;
      setNumeroFormato(`${cat.codigo}-${String(siguiente).padStart(3, '0')}-${anio}`);
    };
    calcularNumero();
  }, [form.categoria_id, form.fecha]); // eslint-disable-line react-hooks/exhaustive-deps

  const actualizarLinea = (idx: number, campo: keyof Linea, valor: any) => {
    setLineas(prev => prev.map((l, i) => i === idx ? { ...l, [campo]: valor } : l));
  };

  const setCuenta = (idx: number, cuenta: any) => {
    setLineas(prev => prev.map((l, i) => i === idx ? {
      ...l, cuenta_id: cuenta.id,
      cuenta_codigo: cuenta.codigo, cuenta_nombre: cuenta.nombre
    } : l));
  };

  const agregarLinea = () => setLineas(prev => [...prev, lineaVacia()]);

  const eliminarLinea = (idx: number) => {
    if (lineas.length <= 2) return;
    setLineas(prev => prev.filter((_, i) => i !== idx));
  };

  // Totales
  const totalDebitoCRC = lineas.reduce((s, l) => s + (Number(l.debito_crc) || 0), 0);
  const totalCreditoCRC = lineas.reduce((s, l) => s + (Number(l.credito_crc) || 0), 0);
  const totalDebitoUSD = lineas.reduce((s, l) => s + (Number(l.debito_usd) || 0), 0);
  const totalCreditoUSD = lineas.reduce((s, l) => s + (Number(l.credito_usd) || 0), 0);
  const balanceado = totalDebitoCRC === totalCreditoCRC &&
    (form.moneda === 'CRC' || totalDebitoUSD === totalCreditoUSD);

  const fmt = (n: number) => n.toLocaleString('es-CR', { minimumFractionDigits: 2 });

const guardar = async (estado: 'BORRADOR' | 'CONFIRMADO') => {
  if (!form.categoria_id || !form.fecha || !form.descripcion) {
    alert('Complete los datos del encabezado'); return;
  }
  if (estado === 'CONFIRMADO' && !balanceado) {
    alert('⚠️ El asiento no está balanceado. Débitos deben ser iguales a Créditos.'); return;
  }
  const lineasValidas = lineas.filter(l => l.cuenta_id);
  if (lineasValidas.length < 2) {
    alert('Ingrese al menos 2 líneas con cuenta'); return;
  }

  setGuardando(true);
  const anio = new Date(form.fecha).getFullYear();

  // Guardar asiento
  const datosAsiento = {
    empresa_id: empresaId,
    categoria_id: parseInt(String(form.categoria_id)),
    fecha: form.fecha,
    descripcion: form.descripcion.toUpperCase(),
    moneda: form.moneda,
    tipo_cambio: Number(form.tipo_cambio),
    estado,
    numero_formato: numeroFormato,
  };

  const { data: asientoGuardado, error } = await supabase
    .from('asientos').insert(datosAsiento).select().single();

  if (error || !asientoGuardado) {
    alert('Error: ' + error?.message); setGuardando(false); return;
  }

  // Guardar líneas PRIMERO
  await supabase.from('asiento_lineas').insert(
    lineasValidas.map((l, i) => ({
      asiento_id: asientoGuardado.id,
      linea: i + 1,
      cuenta_id: l.cuenta_id,
      descripcion: l.descripcion,
      debito_crc: Number(l.debito_crc) || 0,
      credito_crc: Number(l.credito_crc) || 0,
      debito_usd: Number(l.debito_usd) || 0,
      credito_usd: Number(l.credito_usd) || 0,
    }))
  );

  // DESPUÉS actualizar saldos
  if (estado === 'CONFIRMADO') {
    const { error: rpcError } = await supabase.rpc('actualizar_saldos_asiento', {
      p_asiento_id: asientoGuardado.id
    });
    if (rpcError) {
      console.error('Error saldos:', rpcError);
      alert('Asiento guardado pero error en saldos: ' + rpcError.message);
    }
  }

  // Actualizar numeración
  if (estado === 'CONFIRMADO') {
    const { data: numData } = await supabase
      .from('asiento_numeracion').select('*')
      .eq('empresa_id', empresaId)
      .eq('categoria_id', form.categoria_id)
      .eq('anio', anio).single();

    if (numData) {
      await supabase.from('asiento_numeracion')
        .update({ ultimo_numero: numData.ultimo_numero + 1 })
        .eq('id', numData.id);
    } else {
      await supabase.from('asiento_numeracion').insert({
        empresa_id: empresaId,
        categoria_id: form.categoria_id,
        anio, ultimo_numero: 1,
      });
    }
  }

  setGuardando(false);
  setExito(`Asiento ${estado === 'BORRADOR' ? 'guardado como borrador' : 'confirmado'} correctamente`);
  setTimeout(() => onGuardar(), 1500);
};

  return (
    <>
      <style>{styles}</style>
      <div className="fa-wrap">
        <div className="fa-topbar">
          <button className="btn-back" onClick={onCancelar}>← Volver</button>
          <div className="fa-page-title">
            {asiento ? 'Ver Asiento' : 'Nuevo Asiento'}
          </div>
          {numeroFormato && <span className="fa-num-badge">{numeroFormato}</span>}
          {asiento?.estado && (
            <span className={`estado-view ${asiento.estado}`}>{asiento.estado}</span>
          )}
        </div>

        {exito && <div className="fa-success">✓ {exito}</div>}

        {/* Encabezado */}
        <div className="fa-card">
          <div className="fa-section-title">Encabezado del Asiento</div>
          <div className="fa-grid">
            <div className="fa-group">
              <label className="fa-label">Categoría *</label>
              <select className="fa-input" value={form.categoria_id}
                disabled={esVista}
                onChange={e => setForm(p => ({ ...p, categoria_id: e.target.value }))}>
                <option value="">-- Seleccione --</option>
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.codigo} - {cat.descripcion}
                  </option>
                ))}
              </select>
            </div>
            <div className="fa-group">
              <label className="fa-label">Fecha *</label>
              <input className="fa-input" type="date" value={form.fecha}
                disabled={esVista}
                onChange={e => setForm(p => ({ ...p, fecha: e.target.value }))} />
            </div>
            <div className="fa-group">
              <label className="fa-label">Moneda</label>
              <select className="fa-input" value={form.moneda}
                disabled={esVista}
                onChange={e => setForm(p => ({ ...p, moneda: e.target.value }))}>
                <option value="CRC">₡ Colones (CRC)</option>
                <option value="USD">$ Dólares (USD)</option>
                <option value="AMBAS">Ambas monedas</option>
              </select>
            </div>
            <div className="fa-group span2">
              <label className="fa-label">Descripción *</label>
              <input className="fa-input" value={form.descripcion}
                disabled={esVista}
                onChange={e => setForm(p => ({ ...p, descripcion: e.target.value.toUpperCase() }))}
                placeholder="DESCRIPCIÓN DEL ASIENTO" />
            </div>
            {form.moneda === 'USD' && (
              <div className="fa-group">
                <label className="fa-label">Tipo de Cambio</label>
                <input className="fa-input" type="number" step="0.01"
                  value={form.tipo_cambio} disabled={esVista}
                  onChange={e => setForm(p => ({ ...p, tipo_cambio: parseFloat(e.target.value) }))} />
              </div>
            )}
          </div>
        </div>

        {/* Líneas */}
        <div className="fa-card">
          <div className="fa-section-title">Líneas del Asiento</div>
          <div className="lineas-table-wrap">
            <table className="lineas-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Cuenta</th>
                  <th>Nombre Cuenta</th>
                  <th>Descripción</th>
                  {(form.moneda === 'CRC' || form.moneda === 'AMBAS') && <>
                    <th>Débito ₡</th>
                    <th>Crédito ₡</th>
                  </>}
                  {(form.moneda === 'USD' || form.moneda === 'AMBAS') && <>
                    <th>Débito $</th>
                    <th>Crédito $</th>
                  </>}
                  {!esVista && <th></th>}
                </tr>
              </thead>
              <tbody>
                {lineas.map((linea, idx) => (
                  <tr key={idx}>
                    <td style={{ color: '#9ca3af', fontSize: '12px', width: '30px' }}>
                      {idx + 1}
                    </td>
                    <td>
                      {esVista
                        ? <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '12px', color: '#16a34a' }}>{linea.cuenta_codigo}</span>
                        : <BuscarCuenta value={linea.cuenta_codigo} onChange={c => setCuenta(idx, c)} />
                      }
                    </td>
                    <td style={{ fontSize: '12px', color: '#6b7280', minWidth: '180px' }}>
                      {linea.cuenta_nombre}
                    </td>
                    <td>
                      <input className="linea-input" value={linea.descripcion}
                        disabled={esVista}
                        onChange={e => actualizarLinea(idx, 'descripcion', e.target.value)}
                        placeholder="Detalle..." style={{ minWidth: '140px' }} />
                    </td>
                    {(form.moneda === 'CRC' || form.moneda === 'AMBAS') && <>
                      <td>
                        <input className="linea-input mono" type="number" step="0.01"
                          value={linea.debito_crc || ''} disabled={esVista}
                          onChange={e => actualizarLinea(idx, 'debito_crc', e.target.value)}
                          style={{ width: '110px' }} />
                      </td>
                      <td>
                        <input className="linea-input mono" type="number" step="0.01"
                          value={linea.credito_crc || ''} disabled={esVista}
                          onChange={e => actualizarLinea(idx, 'credito_crc', e.target.value)}
                          style={{ width: '110px' }} />
                      </td>
                    </>}
                    {(form.moneda === 'USD' || form.moneda === 'AMBAS') && <>
                      <td>
                        <input className="linea-input mono" type="number" step="0.01"
                          value={linea.debito_usd || ''} disabled={esVista}
                          onChange={e => actualizarLinea(idx, 'debito_usd', e.target.value)}
                          style={{ width: '100px' }} />
                      </td>
                      <td>
                        <input className="linea-input mono" type="number" step="0.01"
                          value={linea.credito_usd || ''} disabled={esVista}
                          onChange={e => actualizarLinea(idx, 'credito_usd', e.target.value)}
                          style={{ width: '100px' }} />
                      </td>
                    </>}
                    {!esVista && (
                      <td>
                        <button className="btn-del-linea" onClick={() => eliminarLinea(idx)}>✕</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!esVista && (
            <button className="btn-add-linea" onClick={agregarLinea}>
              + Agregar Línea
            </button>
          )}

          {/* Totales */}
          <div className="totales-bar">
            {(form.moneda === 'CRC' || form.moneda === 'AMBAS') && (
              <>
                <div className="total-item">
                  <span className="total-label">Total Débito ₡</span>
                  <span className={`total-value ${totalDebitoCRC > 0 ? 'total-ok' : ''}`}>
                    ₡ {fmt(totalDebitoCRC)}
                  </span>
                </div>
                <div className="total-item">
                  <span className="total-label">Total Crédito ₡</span>
                  <span className={`total-value ${totalCreditoCRC > 0 ? 'total-ok' : ''}`}>
                    ₡ {fmt(totalCreditoCRC)}
                  </span>
                </div>
              </>
            )}
            {(form.moneda === 'USD' || form.moneda === 'AMBAS') && (
              <>
                <div className="total-item">
                  <span className="total-label">Total Débito $</span>
                  <span className={`total-value ${totalDebitoUSD > 0 ? 'total-ok' : ''}`}>
                    $ {fmt(totalDebitoUSD)}
                  </span>
                </div>
                <div className="total-item">
                  <span className="total-label">Total Crédito $</span>
                  <span className={`total-value ${totalCreditoUSD > 0 ? 'total-ok' : ''}`}>
                    $ {fmt(totalCreditoUSD)}
                  </span>
                </div>
              </>
            )}
            <div>
              {balanceado && (totalDebitoCRC > 0 || totalDebitoUSD > 0)
                ? <span className="balance-ok">✓ Balanceado</span>
                : <span className="balance-error">⚠ No balanceado</span>
              }
            </div>
          </div>
        </div>

        {!esVista && (
          <div className="fa-footer">
            <button className="btn-cancelar" onClick={onCancelar}>Cancelar</button>
            <button className="btn-borrador" onClick={() => guardar('BORRADOR')} disabled={guardando}>
              💾 Guardar Borrador
            </button>
            <button className="btn-confirmar" onClick={() => guardar('CONFIRMADO')} disabled={guardando || !balanceado}>
              ✓ Confirmar Asiento
            </button>
          </div>
        )}
      </div>
    </>
  );
}