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
