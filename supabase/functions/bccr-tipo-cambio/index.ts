import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, data: Record<string, unknown>) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });

const toCRDate = (isoDate: string) => {
  const [y, m, d] = isoDate.split("-");
  if (!y || !m || !d) return "";
  return `${d}/${m}/${y}`;
};

const parseIndicatorValue = (xml: string): number | null => {
  const m =
    xml.match(/<NUM_VALOR>\s*([^<]+)\s*<\/NUM_VALOR>/i) ||
    xml.match(/<num_valor>\s*([^<]+)\s*<\/num_valor>/i);
  if (!m?.[1]) return null;
  const raw = m[1].trim().replace(",", ".");
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

const buildUrl = (args: {
  indicador: 317 | 318;
  fechaCR: string;
  nombre: string;
  subNiveles: string;
  correo: string;
  token: string;
}) => {
  const base = "https://gee.bccr.fi.cr/Indicadores/Suscripciones/WS/wsindicadoreseconomicos.asmx/ObtenerIndicadoresEconomicos";
  const q = new URLSearchParams({
    Indicador: String(args.indicador),
    FechaInicio: args.fechaCR,
    FechaFinal: args.fechaCR,
    Nombre: args.nombre,
    SubNiveles: args.subNiveles,
    CorreoElectronico: args.correo,
    Token: args.token,
  });
  return `${base}?${q.toString()}`;
};

Deno.serve(async (req) => {
  try {
    console.log("bccr-tipo-cambio:start", req.method);
    if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: corsHeaders });
    if (req.method !== "POST") return json(405, { ok: false, error: "method_not_allowed" });

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) return json(500, { ok: false, error: "missing_supabase_env" });

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const fecha = String(body.fecha ?? "").trim();
    console.log("bccr-tipo-cambio:fecha", fecha);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return json(400, { ok: false, error: "fecha_required_yyyy_mm_dd" });
    }
    const fechaCR = toCRDate(fecha);
    if (!fechaCR) return json(400, { ok: false, error: "invalid_fecha" });

    // Credenciales solo desde secrets del servidor (no desde frontend).
    const nombre = String(Deno.env.get("BCCR_NOMBRE") ?? "").trim();
    const correo = String(Deno.env.get("BCCR_CORREO") ?? "").trim();
    const token = String(Deno.env.get("BCCR_TOKEN") ?? "").trim();
    const subNivelesRaw = String(Deno.env.get("BCCR_SUBNIVELES") ?? "S").trim().toUpperCase();
    const subNiveles = subNivelesRaw || "S";
    console.log("bccr-tipo-cambio:secrets", {
      hasNombre: Boolean(nombre),
      hasCorreo: Boolean(correo),
      hasToken: Boolean(token),
      subNiveles,
    });

    if (!nombre || !correo || !token) {
      return json(400, { ok: false, error: "bccr_credentials_required", detail: "nombre, correo y token son requeridos." });
    }

    const compraUrl = buildUrl({ indicador: 317, fechaCR, nombre, subNiveles, correo, token });
    const ventaUrl = buildUrl({ indicador: 318, fechaCR, nombre, subNiveles, correo, token });
    console.log("bccr-tipo-cambio:fetching");

    const [compraResp, ventaResp] = await Promise.all([fetch(compraUrl), fetch(ventaUrl)]);
    console.log("bccr-tipo-cambio:statuses", compraResp.status, ventaResp.status);
    if (!compraResp.ok || !ventaResp.ok) {
      return json(502, {
        ok: false,
        error: "bccr_http_error",
        compra_status: compraResp.status,
        venta_status: ventaResp.status,
      });
    }

    const [compraXml, ventaXml] = await Promise.all([compraResp.text(), ventaResp.text()]);
    const compra = parseIndicatorValue(compraXml);
    const venta = parseIndicatorValue(ventaXml);
    console.log("bccr-tipo-cambio:values", compra, venta);

    if (!compra || !venta) {
      return json(422, {
        ok: false,
        error: "bccr_value_not_found",
        detail: "No se pudo leer NUM_VALOR para compra/venta en la fecha solicitada.",
      });
    }

    return json(200, {
      ok: true,
      fuente: "BCCR",
      fecha,
      compra,
      venta,
      indicador_compra: 317,
      indicador_venta: 318,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("bccr-tipo-cambio:unhandled", msg);
    return json(500, { ok: false, error: "unhandled_exception", detail: msg });
  }
});
