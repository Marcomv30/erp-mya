-- Seed base del plan de cuentas (idempotente).
-- Objetivo: poblar public.plan_cuentas_base con cuentas iniciales si no existen,
-- y actualizar definiciones existentes por codigo.
-- Ejecutar en SQL Editor con rol postgres.

begin;

create temporary table tmp_plan_cuentas_seed (
  codigo text primary key,
  nombre text not null,
  nivel integer not null,
  tipo text not null,
  naturaleza text not null,
  acepta_movimiento boolean not null,
  padre_codigo text null
) on commit drop;

insert into tmp_plan_cuentas_seed (
  codigo, nombre, nivel, tipo, naturaleza, acepta_movimiento, padre_codigo
) values
  ('1', 'ACTIVO', 1, 'ACTIVO', 'DEBITO', false, null),
  ('1.1', 'ACTIVO CORRIENTE', 2, 'ACTIVO', 'DEBITO', false, '1'),
  ('1.1.01', 'CAJA GENERAL', 3, 'ACTIVO', 'DEBITO', true, '1.1'),
  ('1.1.02', 'BANCOS', 3, 'ACTIVO', 'DEBITO', true, '1.1'),
  ('1.1.03', 'CUENTAS POR COBRAR', 3, 'ACTIVO', 'DEBITO', true, '1.1'),
  ('1.2', 'ACTIVO NO CORRIENTE', 2, 'ACTIVO', 'DEBITO', false, '1'),
  ('1.2.01', 'ACTIVOS FIJOS', 3, 'ACTIVO', 'DEBITO', true, '1.2'),

  ('2', 'PASIVO', 1, 'PASIVO', 'CREDITO', false, null),
  ('2.1', 'PASIVO CORRIENTE', 2, 'PASIVO', 'CREDITO', false, '2'),
  ('2.1.01', 'CUENTAS POR PAGAR', 3, 'PASIVO', 'CREDITO', true, '2.1'),
  ('2.1.02', 'OBLIGACIONES LABORALES', 3, 'PASIVO', 'CREDITO', true, '2.1'),
  ('2.2', 'PASIVO NO CORRIENTE', 2, 'PASIVO', 'CREDITO', false, '2'),
  ('2.2.01', 'PRESTAMOS LARGO PLAZO', 3, 'PASIVO', 'CREDITO', true, '2.2'),

  ('3', 'CAPITAL', 1, 'CAPITAL', 'CREDITO', false, null),
  ('3.1', 'CAPITAL SOCIAL', 2, 'CAPITAL', 'CREDITO', true, '3'),
  ('3.2', 'RESULTADOS ACUMULADOS', 2, 'CAPITAL', 'CREDITO', true, '3'),

  ('4', 'INGRESOS', 1, 'INGRESO', 'CREDITO', false, null),
  ('4.1', 'VENTAS', 2, 'INGRESO', 'CREDITO', true, '4'),
  ('4.2', 'OTROS INGRESOS', 2, 'INGRESO', 'CREDITO', true, '4'),

  ('5', 'GASTOS', 1, 'GASTO', 'DEBITO', false, null),
  ('5.1', 'GASTOS ADMINISTRATIVOS', 2, 'GASTO', 'DEBITO', false, '5'),
  ('5.1.01', 'SUELDOS Y SALARIOS', 3, 'GASTO', 'DEBITO', true, '5.1'),
  ('5.1.02', 'SERVICIOS PUBLICOS', 3, 'GASTO', 'DEBITO', true, '5.1'),
  ('5.1.03', 'ALQUILERES', 3, 'GASTO', 'DEBITO', true, '5.1'),
  ('5.2', 'GASTOS DE VENTAS', 2, 'GASTO', 'DEBITO', false, '5'),
  ('5.2.01', 'COMISIONES', 3, 'GASTO', 'DEBITO', true, '5.2'),
  ('5.2.02', 'PUBLICIDAD', 3, 'GASTO', 'DEBITO', true, '5.2');

-- 1) Update por codigo (si ya existe).
update public.plan_cuentas_base b
set
  nombre = s.nombre,
  nivel = s.nivel,
  tipo = s.tipo,
  naturaleza = s.naturaleza,
  acepta_movimiento = s.acepta_movimiento,
  activo = true
from tmp_plan_cuentas_seed s
where b.codigo = s.codigo;

-- 2) Insert de codigos faltantes.
insert into public.plan_cuentas_base (
  codigo, nombre, nivel, tipo, naturaleza, acepta_movimiento, activo
)
select
  s.codigo, s.nombre, s.nivel, s.tipo, s.naturaleza, s.acepta_movimiento, true
from tmp_plan_cuentas_seed s
where not exists (
  select 1
  from public.plan_cuentas_base b
  where b.codigo = s.codigo
);

-- 3) Resolver padre_id por padre_codigo.
update public.plan_cuentas_base b
set padre_id = p.id
from tmp_plan_cuentas_seed s
left join public.plan_cuentas_base p on p.codigo = s.padre_codigo
where b.codigo = s.codigo
  and b.padre_id is distinct from p.id;

commit;

-- Verificacion sugerida:
-- select codigo, nombre, nivel, tipo, naturaleza, acepta_movimiento, padre_id
-- from public.plan_cuentas_base
-- order by codigo;

