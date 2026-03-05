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

### Ejecución manual (test)

```bash
curl -X POST \
  "https://TU-PROYECTO.supabase.co/functions/v1/security-alert-worker" \
  -H "x-cron-secret: cambia-esto"
```

### Programación (cron)

Llamar cada 1-5 minutos al endpoint de la función con método `POST`.
