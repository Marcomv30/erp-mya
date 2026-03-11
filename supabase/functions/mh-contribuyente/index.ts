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

const asArray = (value: unknown): any[] => {
  if (Array.isArray(value)) return value;
  return [];
};

const pick = (obj: any, keys: string[]): any => {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return null;
};

const textFrom = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  if (typeof value === "object") {
    const o: any = value;
    const nested =
      pick(o, [
        "descripcion",
        "description",
        "nombre",
        "name",
        "detalle",
        "texto",
        "label",
        "codigo",
        "code",
        "id",
        "valor",
        "value",
      ]) ?? "";
    return String(nested).trim();
  }
  return "";
};

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: corsHeaders });
    if (req.method !== "POST") return json(405, { ok: false, error: "method_not_allowed" });

    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const cedula = String(body.cedula ?? body.identificacion ?? "").trim();
    if (!cedula) return json(400, { ok: false, error: "cedula_required" });

    const apiUrl = String(Deno.env.get("MH_CONTRIBUYENTE_API_URL") ?? "https://api.hacienda.go.cr/fe/ae").trim();
    const method = String(Deno.env.get("MH_CONTRIBUYENTE_API_METHOD") ?? "GET").trim().toUpperCase();
    const authHeader = String(Deno.env.get("MH_CONTRIBUYENTE_AUTH_HEADER") ?? "Authorization").trim();
    const authScheme = String(Deno.env.get("MH_CONTRIBUYENTE_AUTH_SCHEME") ?? "Bearer").trim();
    const token = String(Deno.env.get("MH_CONTRIBUYENTE_TOKEN") ?? "").trim();
    const apiKeyHeader = String(Deno.env.get("MH_CONTRIBUYENTE_APIKEY_HEADER") ?? "").trim();
    const apiKeyValue = String(Deno.env.get("MH_CONTRIBUYENTE_APIKEY_VALUE") ?? "").trim();
    const queryParam = String(Deno.env.get("MH_CONTRIBUYENTE_QUERY_PARAM") ?? "identificacion").trim();
    const contentType = String(Deno.env.get("MH_CONTRIBUYENTE_CONTENT_TYPE") ?? "application/json").trim();

    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Accept": "application/json, text/plain, */*",
    };
    if (token) headers[authHeader] = authScheme ? `${authScheme} ${token}` : token;
    if (apiKeyHeader && apiKeyValue) headers[apiKeyHeader] = apiKeyValue;

    let url = apiUrl;
    let init: RequestInit = { method, headers };
    const buildGetUrl = (paramName: string) => {
      const u = new URL(apiUrl);
      u.searchParams.set(paramName || "identificacion", cedula);
      return u.toString();
    };
    if (method === "GET") {
      url = buildGetUrl(queryParam || "identificacion");
    } else {
      init = {
        ...init,
        body: JSON.stringify({
          cedula,
          identificacion: cedula,
        }),
      };
    }

    let resp = await fetch(url, init);
    // Compatibilidad con API MH CR: si el parametro configurado falla en GET, reintentar con "identificacion".
    if (!resp.ok && method === "GET" && (queryParam || "").toLowerCase() !== "identificacion") {
      resp = await fetch(buildGetUrl("identificacion"), init);
    }

    const text = await resp.text();
    let raw: any = null;
    try {
      raw = text ? JSON.parse(text) : {};
    } catch {
      return json(502, {
        ok: false,
        error: "mh_non_json_response",
        status: resp.status,
        detail: text?.slice(0, 500) || "Respuesta no JSON",
      });
    }

    if (!resp.ok) {
      return json(502, {
        ok: false,
        error: "mh_http_error",
        status: resp.status,
        detail: raw?.detail || raw?.error || raw?.message || "Error en API MH",
        raw,
      });
    }

    const root = raw?.data ?? raw?.result ?? raw;
    const contrib = root?.contribuyente ?? root;
    const actividades = asArray(
      contrib?.actividades ??
      root?.actividades ??
      root?.actividadesEconomicas
    );

    const tipoIdentRaw = pick(contrib, ["tipo_identificacion", "tipoIdentificacion", "tipoDocumento"]);
    const tipoIdent = textFrom(tipoIdentRaw);
    const tipoIdentUpper = tipoIdent.toUpperCase();
    const tipoContribuyente =
      (tipoIdent === "01" || /FISICA/.test(tipoIdentUpper))
        ? "persona_fisica"
        : (tipoIdent === "02" || /JURIDICA/.test(tipoIdentUpper))
          ? "persona_juridica"
          : "persona_juridica";

    const normalized = {
      cedula: String(pick(contrib, ["cedula", "identificacion", "numero"]) ?? cedula),
      nombre: textFrom(pick(contrib, ["nombre", "razon_social", "razonSocial"])),
      tipo_identificacion: tipoIdent,
      situacion: textFrom(pick(contrib, ["situacion", "estado"])),
      regimen: textFrom(pick(contrib, ["regimen", "regimenTributario"])),
      tipo_contribuyente: tipoContribuyente,
      actividades: actividades.map((a: any) => ({
        codigo: textFrom(pick(a, ["codigo", "codigo_actividad", "codActividad", "id"])),
        descripcion: textFrom(pick(a, ["descripcion", "detalle", "nombre", "actividad"])),
        categoria: textFrom(pick(a, ["categoria", "grupo"])),
      })).filter((a: any) => a.codigo && a.descripcion),
      raw,
    };

    return json(200, {
      ok: true,
      fuente: "MH_API",
      ...normalized,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return json(500, { ok: false, error: "unhandled_exception", detail: msg });
  }
});
