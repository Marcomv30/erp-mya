# Supabase Edge Functions

## security-alert-worker

Procesa la cola `public.security_alert_outbox` y envia correos usando Resend.

### Variables de entorno requeridas

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `SECURITY_ALERT_FROM_EMAIL` (ej: `Seguridad <alertas@tu-dominio.com>`)

Opcionales:

- `SECURITY_ALERT_CRON_SECRET` (recomendado para proteger endpoint)
- `SECURITY_ALERT_BATCH_SIZE` (default `20`)

### Deploy

```bash
supabase functions deploy security-alert-worker
```

### Configurar secrets

```bash
supabase secrets set \
SUPABASE_URL="https://TU-PROYECTO.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="TU_SERVICE_ROLE_KEY" \
RESEND_API_KEY="re_xxx" \
SECURITY_ALERT_FROM_EMAIL="Seguridad <alertas@tu-dominio.com>" \
SECURITY_ALERT_CRON_SECRET="cambia-esto"
```

### Ejecucion manual (test)

```bash
curl -X POST \
  "https://TU-PROYECTO.supabase.co/functions/v1/security-alert-worker" \
  -H "x-cron-secret: cambia-esto"
```

### Programacion (cron)

Llamar cada 1-5 minutos al endpoint de la funcion con metodo `POST`.

---

## access-api

API inicial de acceso (BFF) para frontend.

### Endpoints v1

- `POST /functions/v1/access-api/auth/login`
  - body JSON: `{ "username": "marco", "password": "xxxxxx" }`
- `GET /functions/v1/access-api/me/access?empresa_id=<id>`
- `GET /functions/v1/access-api/me/menu?empresa_id=<id>`
- `POST /functions/v1/access-api/auth/switch-company`
  - body JSON: `{ "empresa_id": 1 }`

Retorna snapshot de acceso efectivo por usuario + empresa:

- usuario actual
- rol en la empresa
- lista `permissions` en formato `modulo:accion`
- `permission_map` para validaciones rapidas en frontend

### Variables de entorno requeridas

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

### Deploy

```bash
supabase functions deploy access-api
```

### Configurar secrets

```bash
supabase secrets set \
SUPABASE_URL="https://TU-PROYECTO.supabase.co" \
SUPABASE_ANON_KEY="TU_ANON_KEY"
```

### Ejecucion manual (test)

```bash
curl -X POST \
  "https://TU-PROYECTO.supabase.co/functions/v1/access-api/auth/login" \
  -H "apikey: TU_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"username":"marco","password":"xxxxxx"}'
```

```bash
curl -X GET \
  "https://TU-PROYECTO.supabase.co/functions/v1/access-api/me/access?empresa_id=1" \
  -H "Authorization: Bearer TU_ACCESS_TOKEN" \
  -H "apikey: TU_ANON_KEY"
```

```bash
curl -X POST \
  "https://TU-PROYECTO.supabase.co/functions/v1/access-api/auth/switch-company" \
  -H "Authorization: Bearer TU_ACCESS_TOKEN" \
  -H "apikey: TU_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"empresa_id":1}'
```

---

## bccr-tipo-cambio

Consulta tipo de cambio compra/venta del BCCR para una fecha puntual.

### Endpoint

- `POST /functions/v1/bccr-tipo-cambio`
  - body JSON: `{ "fecha": "2026-03-06" }`
  - Las credenciales del BCCR se leen solo desde secrets del servidor.

### Variables de entorno recomendadas

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `BCCR_NOMBRE`
- `BCCR_CORREO`
- `BCCR_TOKEN`
- `BCCR_SUBNIVELES` (default `S`)

### Deploy

```bash
supabase functions deploy bccr-tipo-cambio
```

### Configurar secrets

```bash
supabase secrets set \
SUPABASE_URL="https://TU-PROYECTO.supabase.co" \
SUPABASE_ANON_KEY="TU_ANON_KEY" \
BCCR_NOMBRE="TuNombre" \
BCCR_CORREO="tu@correo.com" \
BCCR_TOKEN="tu-token-bccr" \
BCCR_SUBNIVELES="S"
```

---

## mh-contribuyente

Consulta API de Ministerio de Hacienda para datos de contribuyente y actividades tributarias.

### Endpoint

- `POST /functions/v1/mh-contribuyente`
  - body JSON: `{ "cedula": "3101..." }`

### Variables de entorno recomendadas

- `MH_CONTRIBUYENTE_API_URL` (default `https://api.hacienda.go.cr/fe/ae`)
- `MH_CONTRIBUYENTE_API_METHOD` (`POST` o `GET`, default `GET`)
- `MH_CONTRIBUYENTE_QUERY_PARAM` (default `identificacion`, para `GET`)
- `MH_CONTRIBUYENTE_CONTENT_TYPE` (default `application/json`)
- `MH_CONTRIBUYENTE_AUTH_HEADER` (default `Authorization`)
- `MH_CONTRIBUYENTE_AUTH_SCHEME` (default `Bearer`)
- `MH_CONTRIBUYENTE_TOKEN` (opcional, token de API)
- `MH_CONTRIBUYENTE_APIKEY_HEADER` (opcional)
- `MH_CONTRIBUYENTE_APIKEY_VALUE` (opcional)

### Deploy

```bash
supabase functions deploy mh-contribuyente
```

### Configurar secrets

```bash
supabase secrets set \
MH_CONTRIBUYENTE_API_URL="https://api.hacienda.go.cr/fe/ae" \
MH_CONTRIBUYENTE_API_METHOD="GET" \
MH_CONTRIBUYENTE_QUERY_PARAM="identificacion" \
MH_CONTRIBUYENTE_AUTH_HEADER="Authorization" \
MH_CONTRIBUYENTE_AUTH_SCHEME="Bearer" \
MH_CONTRIBUYENTE_TOKEN="tu-token-api"
```
