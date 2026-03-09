import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import ListToolbar from '../../components/ListToolbar';

interface ParametrosEmpresaProps {
  empresaId: number;
  canEdit?: boolean;
}

interface ParametrosEmpresaState {
  fiscal: {
    fecha_inicio: string | null;
    fecha_fin: string | null;
    semana_inicia_en: number;
  };
  cierre_contable: {
    activo: boolean;
    fecha_inicio: string | null;
    fecha_fin: string | null;
  };
  impuestos: {
    impuesto_ventas: number;
    otros_impuestos: number;
    impuesto_renta: number;
    impuesto_consumo: number;
  };
  facturacion: {
    tipo_facturacion: string;
    impuesto_venta_incluido: boolean;
    facturar_en_negativo: boolean;
    impresion_en_linea: boolean;
    ver_saldo_inventario: boolean;
    consulta_hacienda: boolean;
    lineas_por_factura: number;
  };
  redondeo: {
    modo: string;
    descripcion: string;
  };
  varios: {
    aplica_proyectos: boolean;
    catalogo_unico_proveedores: boolean;
    planilla_por_horas: boolean;
    aplica_cobros_contabilidad: boolean;
    aplica_descuentos: boolean;
    imprimir_cheques_formularios: boolean;
    control_limite_credito: boolean;
    aplica_compras_contabilidad: boolean;
    control_cheques_postfechados: boolean;
    tipo_cambio: {
      fecha: string | null;
      compra: number;
      venta: number;
      fijar: number;
    };
  };
  _meta?: {
    version?: number;
    modo?: string;
    updated_at?: string | null;
  };
}

const styles = `
  .pe-wrap { padding:0; }
  .pe-head { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:14px; }
  .pe-title { font-size:20px; font-weight:600; color:#1f2937; }
  .pe-sub { font-size:12px; color:#6b7280; margin-top:3px; }
  .pe-msg-ok { padding:10px 12px; border:1px solid #bbf7d0; background:#dcfce7; color:#166534; border-radius:8px; font-size:12px; margin-bottom:10px; }
  .pe-msg-err { padding:10px 12px; border:1px solid #fecaca; background:#fee2e2; color:#991b1b; border-radius:8px; font-size:12px; margin-bottom:10px; }
  .pe-msg-warn { padding:10px 12px; border:1px solid #fcd34d; background:#fffbeb; color:#92400e; border-radius:8px; font-size:12px; margin-bottom:10px; }
  .pe-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .pe-card { background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:14px; }
  .pe-card-title { font-size:13px; font-weight:700; color:#1f2937; margin-bottom:10px; text-transform:uppercase; letter-spacing:.03em; }
  .pe-row { display:grid; grid-template-columns:1fr 120px; gap:8px; align-items:center; margin-bottom:8px; }
  .pe-row label { font-size:12px; color:#4b5563; }
  .pe-row-inline { display:flex; gap:10px; align-items:center; margin-bottom:8px; }
  .pe-input, .pe-select { width:100%; border:1px solid #d1d5db; border-radius:8px; padding:8px 10px; font-size:12px; color:#1f2937; outline:none; background:#fff; }
  .pe-input:focus, .pe-select:focus { border-color:#22c55e; box-shadow:0 0 0 3px rgba(34,197,94,.12); }
  .pe-checks { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
  .pe-check { display:flex; gap:6px; align-items:flex-start; font-size:12px; color:#374151; }
  .pe-check input { margin-top:2px; }
  .pe-footer { font-size:11px; color:#6b7280; margin-top:10px; }

  @media (max-width: 900px) {
    .pe-grid { grid-template-columns:1fr; }
    .pe-row { grid-template-columns:1fr; }
  }
`;

const emptyState: ParametrosEmpresaState = {
  fiscal: { fecha_inicio: null, fecha_fin: null, semana_inicia_en: 1 },
  cierre_contable: { activo: false, fecha_inicio: null, fecha_fin: null },
  impuestos: { impuesto_ventas: 13, otros_impuestos: 0, impuesto_renta: 30, impuesto_consumo: 0 },
  facturacion: {
    tipo_facturacion: 'inventario',
    impuesto_venta_incluido: true,
    facturar_en_negativo: false,
    impresion_en_linea: false,
    ver_saldo_inventario: false,
    consulta_hacienda: false,
    lineas_por_factura: 0,
  },
  redondeo: { modo: '0.05', descripcion: 'A 5 centimos' },
  varios: {
    aplica_proyectos: false,
    catalogo_unico_proveedores: false,
    planilla_por_horas: false,
    aplica_cobros_contabilidad: false,
    aplica_descuentos: false,
    imprimir_cheques_formularios: false,
    control_limite_credito: false,
    aplica_compras_contabilidad: false,
    control_cheques_postfechados: false,
    tipo_cambio: { fecha: null, compra: 0, venta: 0, fijar: 0 },
  },
  _meta: { version: 0, modo: 'default', updated_at: null },
};

function toNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function ParametrosEmpresa({ empresaId, canEdit = false }: ParametrosEmpresaProps) {
  const [data, setData] = useState<ParametrosEmpresaState>(emptyState);
  const [draft, setDraft] = useState<ParametrosEmpresaState>(emptyState);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [ok, setOk] = useState('');
  const [err, setErr] = useState('');
  const cierreActivo = Boolean(draft.cierre_contable.activo);
  const cierreConRango =
    Boolean(draft.cierre_contable.fecha_inicio)
    && Boolean(draft.cierre_contable.fecha_fin);
  const cierreConfigurado = cierreActivo && cierreConRango;

  const showOk = (msg: string) => {
    setOk(msg);
    setTimeout(() => setOk(''), 2400);
  };

  const showErr = (msg: string) => {
    setErr(msg);
    setTimeout(() => setErr(''), 3400);
  };

  const load = async () => {
    setLoading(true);
    setErr('');
    const { data: rpcData, error } = await supabase.rpc('get_empresa_parametros', { p_empresa_id: empresaId });
    setLoading(false);
    if (error) {
      showErr(error.message);
      return;
    }
    const parsed = (rpcData || emptyState) as ParametrosEmpresaState;
    setData(parsed);
    setDraft(parsed);
  };

  useEffect(() => {
    setEditing(false);
    setOk('');
    setErr('');
    load();
  }, [empresaId]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    if (!canEdit) return;
    if (draft.cierre_contable.activo) {
      if (!draft.cierre_contable.fecha_inicio || !draft.cierre_contable.fecha_fin) {
        showErr('Si activa el bloqueo, debe definir Inicio/Final de cierre contable.');
        return;
      }
      if (draft.cierre_contable.fecha_inicio > draft.cierre_contable.fecha_fin) {
        showErr('Rango de cierre invalido: Inicio cierre no puede ser mayor que Final cierre.');
        return;
      }
    }
    setLoading(true);
    setErr('');
    const payload = {
      fiscal: draft.fiscal,
      cierre_contable: draft.cierre_contable,
      impuestos: draft.impuestos,
      facturacion: draft.facturacion,
      redondeo: draft.redondeo,
      varios: draft.varios,
    };
    const { data: rpcData, error } = await supabase.rpc('set_empresa_parametros', {
      p_empresa_id: empresaId,
      p_payload: payload,
    });
    setLoading(false);
    if (error) {
      showErr(error.message);
      return;
    }
    const parsed = (rpcData || emptyState) as ParametrosEmpresaState;
    setData(parsed);
    setDraft(parsed);
    setEditing(false);
    showOk('Parametros guardados correctamente');
  };

  const resetDefaults = async () => {
    if (!canEdit) return;
    if (!window.confirm('Â¿Restaurar parametros por defecto para esta empresa?')) return;
    setLoading(true);
    const { data: rpcData, error } = await supabase.rpc('reset_empresa_parametros', { p_empresa_id: empresaId });
    setLoading(false);
    if (error) {
      showErr(error.message);
      return;
    }
    const parsed = (rpcData || emptyState) as ParametrosEmpresaState;
    setData(parsed);
    setDraft(parsed);
    setEditing(false);
    showOk('Parametros restablecidos a valores por defecto');
  };

  const readonly = !editing || !canEdit || loading;

  return (
    <>
      <style>{styles}</style>
      <div className="pe-wrap">
        <div className="pe-head">
          <div>
            <div className="pe-title">ParÃ¡metros de Empresa</div>
            <div className="pe-sub">
              ConfiguraciÃ³n global por empresa para impuestos, facturaciÃ³n, redondeo y reglas operativas.
            </div>
          </div>
          <ListToolbar
            actions={(
              <>
                {!editing && canEdit && <button className="pe-select" style={{ width: 'auto' }} onClick={() => setEditing(true)}>Editar</button>}
                {editing && (
                  <>
                    <button className="pe-select" style={{ width: 'auto' }} onClick={save} disabled={loading}>Guardar</button>
                    <button
                      className="pe-select"
                      style={{ width: 'auto' }}
                      onClick={() => { setDraft(data); setEditing(false); }}
                      disabled={loading}
                    >
                      Cancelar
                    </button>
                  </>
                )}
                {canEdit && (
                  <button className="pe-select" style={{ width: 'auto' }} onClick={resetDefaults} disabled={loading}>
                    Reset
                  </button>
                )}
              </>
            )}
          />
        </div>

        {ok && <div className="pe-msg-ok">{ok}</div>}
        {err && <div className="pe-msg-err">{err}</div>}
        {!cierreActivo && (
          <div className="pe-msg-warn">
            Cierre contable desactivado: se permiten asientos en fechas abiertas.
          </div>
        )}
        {cierreActivo && !cierreConRango && (
          <div className="pe-msg-warn">
            Advertencia: active el rango de cierre (inicio/fin) para aplicar bloqueo de fechas cerradas.
          </div>
        )}

        <div className="pe-grid">
          <section className="pe-card">
            <div className="pe-card-title">Periodo Fiscal</div>
            <div className="pe-row">
              <label>Inicio</label>
              <input
                className="pe-input"
                type="date"
                value={draft.fiscal.fecha_inicio || ''}
                disabled={readonly}
                onChange={(e) => setDraft((p) => ({ ...p, fiscal: { ...p.fiscal, fecha_inicio: e.target.value || null } }))}
              />
            </div>
            <div className="pe-row">
              <label>Final</label>
              <input
                className="pe-input"
                type="date"
                value={draft.fiscal.fecha_fin || ''}
                disabled={readonly}
                onChange={(e) => setDraft((p) => ({ ...p, fiscal: { ...p.fiscal, fecha_fin: e.target.value || null } }))}
              />
            </div>
            <div className="pe-row">
              <label>Semana inicia en</label>
              <select
                className="pe-select"
                value={draft.fiscal.semana_inicia_en}
                disabled={readonly}
                onChange={(e) => setDraft((p) => ({ ...p, fiscal: { ...p.fiscal, semana_inicia_en: Number(e.target.value) } }))}
              >
                <option value={1}>Lunes</option>
                <option value={2}>Martes</option>
                <option value={3}>MiÃ©rcoles</option>
                <option value={4}>Jueves</option>
                <option value={5}>Viernes</option>
                <option value={6}>SÃ¡bado</option>
                <option value={0}>Domingo</option>
              </select>
            </div>
          </section>

          <section className="pe-card">
            <div className="pe-card-title">Cierre Contable</div>
            <label className="pe-check" style={{ marginBottom: '10px' }}>
              <input
                type="checkbox"
                checked={draft.cierre_contable.activo}
                disabled={readonly}
                onChange={(e) =>
                  setDraft((p) => ({
                    ...p,
                    cierre_contable: { ...p.cierre_contable, activo: e.target.checked },
                  }))
                }
              />
              Activar control de periodo contable
            </label>
            <div className="pe-row">
              <label>Inicio cierre</label>
              <input
                className="pe-input"
                type="date"
                value={draft.cierre_contable.fecha_inicio || ''}
                disabled={readonly}
                onChange={(e) =>
                  setDraft((p) => ({
                    ...p,
                    cierre_contable: { ...p.cierre_contable, fecha_inicio: e.target.value || null },
                  }))
                }
              />
            </div>
            <div className="pe-row">
              <label>Final cierre</label>
              <input
                className="pe-input"
                type="date"
                value={draft.cierre_contable.fecha_fin || ''}
                disabled={readonly}
                onChange={(e) =>
                  setDraft((p) => ({
                    ...p,
                    cierre_contable: { ...p.cierre_contable, fecha_fin: e.target.value || null },
                  }))
                }
              />
            </div>
            <div className="pe-footer" style={{ marginTop: 6 }}>
              Con el control activo, solo se permiten asientos dentro de este rango.
            </div>
          </section>

          <section className="pe-card">
            <div className="pe-card-title">Impuestos (%)</div>
            <div className="pe-row"><label>Impuesto de Ventas</label><input className="pe-input" type="number" step="0.01" value={draft.impuestos.impuesto_ventas} disabled={readonly} onChange={(e) => setDraft((p) => ({ ...p, impuestos: { ...p.impuestos, impuesto_ventas: toNumber(e.target.value) } }))} /></div>
            <div className="pe-row"><label>Otros Impuestos</label><input className="pe-input" type="number" step="0.01" value={draft.impuestos.otros_impuestos} disabled={readonly} onChange={(e) => setDraft((p) => ({ ...p, impuestos: { ...p.impuestos, otros_impuestos: toNumber(e.target.value) } }))} /></div>
            <div className="pe-row"><label>Impuesto de Renta</label><input className="pe-input" type="number" step="0.01" value={draft.impuestos.impuesto_renta} disabled={readonly} onChange={(e) => setDraft((p) => ({ ...p, impuestos: { ...p.impuestos, impuesto_renta: toNumber(e.target.value) } }))} /></div>
            <div className="pe-row"><label>Impuesto de Consumo</label><input className="pe-input" type="number" step="0.01" value={draft.impuestos.impuesto_consumo} disabled={readonly} onChange={(e) => setDraft((p) => ({ ...p, impuestos: { ...p.impuestos, impuesto_consumo: toNumber(e.target.value) } }))} /></div>
          </section>

          <section className="pe-card">
            <div className="pe-card-title">FacturaciÃ³n</div>
            <div className="pe-row">
              <label>Tipo de FacturaciÃ³n</label>
              <select
                className="pe-select"
                value={draft.facturacion.tipo_facturacion}
                disabled={readonly}
                onChange={(e) => setDraft((p) => ({ ...p, facturacion: { ...p.facturacion, tipo_facturacion: e.target.value } }))}
              >
                <option value="inventario">Inventario</option>
                <option value="puntoventas">Punto Ventas</option>
                <option value="servicios">Servicios</option>
                <option value="todas">Todas</option>
                <option value="ninguna">Ninguna</option>
              </select>
            </div>
            <div className="pe-row">
              <label>LÃ­neas por Factura</label>
              <input className="pe-input" type="number" value={draft.facturacion.lineas_por_factura} disabled={readonly} onChange={(e) => setDraft((p) => ({ ...p, facturacion: { ...p.facturacion, lineas_por_factura: toNumber(e.target.value) } }))} />
            </div>
            <div className="pe-checks">
              <label className="pe-check"><input type="checkbox" checked={draft.facturacion.impuesto_venta_incluido} disabled={readonly} onChange={(e) => setDraft((p) => ({ ...p, facturacion: { ...p.facturacion, impuesto_venta_incluido: e.target.checked } }))} />Impuesto de Venta Incluido</label>
              <label className="pe-check"><input type="checkbox" checked={draft.facturacion.facturar_en_negativo} disabled={readonly} onChange={(e) => setDraft((p) => ({ ...p, facturacion: { ...p.facturacion, facturar_en_negativo: e.target.checked } }))} />Facturar en Negativo</label>
              <label className="pe-check"><input type="checkbox" checked={draft.facturacion.impresion_en_linea} disabled={readonly} onChange={(e) => setDraft((p) => ({ ...p, facturacion: { ...p.facturacion, impresion_en_linea: e.target.checked } }))} />ImpresiÃ³n en LÃ­nea</label>
              <label className="pe-check"><input type="checkbox" checked={draft.facturacion.ver_saldo_inventario} disabled={readonly} onChange={(e) => setDraft((p) => ({ ...p, facturacion: { ...p.facturacion, ver_saldo_inventario: e.target.checked } }))} />Ver Saldo Inventario</label>
              <label className="pe-check"><input type="checkbox" checked={draft.facturacion.consulta_hacienda} disabled={readonly} onChange={(e) => setDraft((p) => ({ ...p, facturacion: { ...p.facturacion, consulta_hacienda: e.target.checked } }))} />Consulta AutomÃ¡tica Hacienda</label>
            </div>
          </section>

          <section className="pe-card">
            <div className="pe-card-title">Redondeo y Varios</div>
            <div className="pe-row">
              <label>Redondeo</label>
              <select className="pe-select" value={draft.redondeo.modo} disabled={readonly} onChange={(e) => setDraft((p) => ({ ...p, redondeo: { ...p.redondeo, modo: e.target.value } }))}>
                <option value="0.00">Sin redondeo</option>
                <option value="0.05">A 5 centimos</option>
                <option value="0.50">A 50 centimos</option>
                <option value="1.00">A colÃ³n completo</option>
                <option value="5.00">A 5 colones</option>
                <option value="50.00">A 50 colones</option>
              </select>
            </div>
            <div className="pe-checks">
              <label className="pe-check"><input type="checkbox" checked={draft.varios.aplica_proyectos} disabled={readonly} onChange={(e) => setDraft((p) => ({ ...p, varios: { ...p.varios, aplica_proyectos: e.target.checked } }))} />Aplicar proyectos</label>
              <label className="pe-check"><input type="checkbox" checked={draft.varios.catalogo_unico_proveedores} disabled={readonly} onChange={(e) => setDraft((p) => ({ ...p, varios: { ...p.varios, catalogo_unico_proveedores: e.target.checked } }))} />CatÃ¡logo Ãºnico de proveedores</label>
              <label className="pe-check"><input type="checkbox" checked={draft.varios.planilla_por_horas} disabled={readonly} onChange={(e) => setDraft((p) => ({ ...p, varios: { ...p.varios, planilla_por_horas: e.target.checked } }))} />Planilla por horas</label>
              <label className="pe-check"><input type="checkbox" checked={draft.varios.aplica_cobros_contabilidad} disabled={readonly} onChange={(e) => setDraft((p) => ({ ...p, varios: { ...p.varios, aplica_cobros_contabilidad: e.target.checked } }))} />Aplica cobros a contabilidad</label>
              <label className="pe-check"><input type="checkbox" checked={draft.varios.aplica_descuentos} disabled={readonly} onChange={(e) => setDraft((p) => ({ ...p, varios: { ...p.varios, aplica_descuentos: e.target.checked } }))} />Aplica descuentos</label>
              <label className="pe-check"><input type="checkbox" checked={draft.varios.imprimir_cheques_formularios} disabled={readonly} onChange={(e) => setDraft((p) => ({ ...p, varios: { ...p.varios, imprimir_cheques_formularios: e.target.checked } }))} />Imprimir cheques en formularios</label>
              <label className="pe-check"><input type="checkbox" checked={draft.varios.control_limite_credito} disabled={readonly} onChange={(e) => setDraft((p) => ({ ...p, varios: { ...p.varios, control_limite_credito: e.target.checked } }))} />Control lÃ­mite de crÃ©dito</label>
              <label className="pe-check"><input type="checkbox" checked={draft.varios.aplica_compras_contabilidad} disabled={readonly} onChange={(e) => setDraft((p) => ({ ...p, varios: { ...p.varios, aplica_compras_contabilidad: e.target.checked } }))} />Aplica compras a contabilidad</label>
              <label className="pe-check"><input type="checkbox" checked={draft.varios.control_cheques_postfechados} disabled={readonly} onChange={(e) => setDraft((p) => ({ ...p, varios: { ...p.varios, control_cheques_postfechados: e.target.checked } }))} />Control cheques post-fechados</label>
            </div>
          </section>
        </div>

        <div className="pe-footer">
          VersiÃ³n: {data?._meta?.version ?? 0} | Modo: {data?._meta?.modo || 'default'} | Ãšltima actualizaciÃ³n: {data?._meta?.updated_at || '-'}
        </div>
      </div>
    </>
  );
}

