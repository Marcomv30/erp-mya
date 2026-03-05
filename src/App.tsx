import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import ListaEmpresas from './pages/Empresas/ListaEmpresas';
import ListaActividades from './pages/Mantenimientos/ListaActividades';
import ListaUsuarios from './pages/Mantenimientos/ListaUsuarios';
import ListaRoles from './pages/Mantenimientos/ListaRoles';
import ListaModulos from './pages/Mantenimientos/ListaModulos';
import BitacoraSeguridad from './pages/Mantenimientos/BitacoraSeguridad';
import AlertasDestinatarios from './pages/Mantenimientos/AlertasDestinatarios';
import EstadoAcceso from './pages/Mantenimientos/EstadoAcceso';
import PlanCuentas from './pages/Contabilidad/PlanCuentas';
import ListaAsientos from './pages/Contabilidad/ListaAsientos';
import CatalogoEmpresa from './pages/Contabilidad/CatalogoEmpresa';
import MayorGeneral from './pages/Contabilidad/MayorGeneral';

interface Empresa {
  id: number;
  codigo: string;
  cedula: string;
  nombre: string;
  activo: boolean;
}

interface Usuario {
  id: number;
  username: string;
  nombre: string;
  email?: string;
  auth_user_id?: string | null;
  es_superusuario?: boolean;
}
type RolesPorEmpresa = Record<number, string>;

type PermissionKey = `${string}:${string}`;
type PermissionAction = 'ver' | 'crear' | 'editar' | 'eliminar' | 'aprobar';

interface RoutePermission {
  modulo: string;
  accion: PermissionAction;
}

interface SubmenuConfig {
  id: string;
  nombre: string;
  icono: string;
  route: string;
  permission: RoutePermission;
}

interface MenuModuleConfig {
  id: string;
  nombre: string;
  icono: string;
  route: string;
  permission: RoutePermission;
  submenus: SubmenuConfig[];
}


interface ThemeColors {
  bgDark: string;
  bgDark2: string;
  accentMain: string;
  accentDim: string;
  accentSoft: string;
  accentMuted: string;
  gray100: string;
  gray200: string;
  gray400: string;
  gray600: string;
  gray800: string;
}

interface ColorPalette {
  id: string;
  nombre: string;
  colors: ThemeColors;
}

const MENU_CONFIG: MenuModuleConfig[] = [
  {
    nombre: 'Contabilidad', icono: '🧮', id: 'contabilidad', route: 'contabilidad',
    permission: { modulo: 'contabilidad', accion: 'ver' },
    submenus: [
      { id: 'plancuentas', nombre: 'Plan de Cuentas', icono: '📋', route: 'contabilidad.plancuentas', permission: { modulo: 'contabilidad', accion: 'ver' } },
      { id: 'asientos', nombre: 'Asientos', icono: '📝', route: 'contabilidad.asientos', permission: { modulo: 'contabilidad', accion: 'ver' } },
      { id: 'mayorgeneral', nombre: 'Mayor General', icono: '📚', route: 'contabilidad.mayorgeneral', permission: { modulo: 'contabilidad', accion: 'ver' } },
      { id: 'balancecomprobacion', nombre: 'Balance Comprobación', icono: '⚖️', route: 'contabilidad.balancecomprobacion', permission: { modulo: 'contabilidad', accion: 'ver' } },
      { id: 'catalogo', nombre: 'Catálogo Contable', icono: '📂', route: 'contabilidad.catalogo', permission: { modulo: 'contabilidad', accion: 'ver' } },
    ],
  },
  { nombre: 'Bancos', icono: '🏛️', id: 'bancos', route: 'bancos', permission: { modulo: 'bancos', accion: 'ver' }, submenus: [] },
  { nombre: 'Proveedores', icono: '📬', id: 'proveedores', route: 'proveedores', permission: { modulo: 'proveedores', accion: 'ver' }, submenus: [] },
  { nombre: 'Clientes', icono: '🧑‍💼', id: 'clientes', route: 'clientes', permission: { modulo: 'clientes', accion: 'ver' }, submenus: [] },
  { nombre: 'Inventarios', icono: '📦', id: 'inventarios', route: 'inventarios', permission: { modulo: 'inventarios', accion: 'ver' }, submenus: [] },
  { nombre: 'Planilla', icono: '🪪', id: 'planilla', route: 'planilla', permission: { modulo: 'planilla', accion: 'ver' }, submenus: [] },
  { nombre: 'Activos Fijos', icono: '🏗️', id: 'activos', route: 'activos', permission: { modulo: 'activos', accion: 'ver' }, submenus: [] },
  { nombre: 'Cuentas a Cobrar', icono: '🗂️', id: 'cxc', route: 'cxc', permission: { modulo: 'cxc', accion: 'ver' }, submenus: [] },
  { nombre: 'Cuentas a Pagar', icono: '🧾', id: 'cxp', route: 'cxp', permission: { modulo: 'cxp', accion: 'ver' }, submenus: [] },
  { nombre: 'Facturación', icono: '💳', id: 'facturacion', route: 'facturacion', permission: { modulo: 'facturacion', accion: 'ver' }, submenus: [] },
  { nombre: 'Contro Piña', icono: '🍍', id: 'pina', route: 'pina', permission: { modulo: 'pina', accion: 'ver' }, submenus: [] },
  { nombre: 'Costos', icono: '📈', id: 'costos', route: 'costos', permission: { modulo: 'costos', accion: 'ver' }, submenus: [] },
  { nombre: 'Estadísticas', icono: '📊', id: 'estadisticas', route: 'estadisticas', permission: { modulo: 'estadisticas', accion: 'ver' }, submenus: [] },
  {
    nombre: 'Mantenimientos', icono: '🛠️', id: 'mantenimientos', route: 'mantenimientos',
    permission: { modulo: 'mantenimientos', accion: 'ver' },
    submenus: [
      { id: 'empresas', nombre: 'Empresas', icono: '🏢', route: 'mantenimientos.empresas', permission: { modulo: 'mantenimientos', accion: 'ver' } },
      { id: 'actividades', nombre: 'Actividades', icono: '🏭', route: 'mantenimientos.actividades', permission: { modulo: 'mantenimientos', accion: 'ver' } },
      { id: 'usuarios', nombre: 'Usuarios', icono: '👤', route: 'mantenimientos.usuarios', permission: { modulo: 'mantenimientos', accion: 'ver' } },
      { id: 'roles', nombre: 'Roles', icono: '🔑', route: 'mantenimientos.roles', permission: { modulo: 'mantenimientos', accion: 'ver' } },
      { id: 'modulos', nombre: 'Módulos', icono: '📋', route: 'mantenimientos.modulos', permission: { modulo: 'mantenimientos', accion: 'ver' } },
      { id: 'seguridad', nombre: 'Bitácora Seguridad', icono: '🛡️', route: 'mantenimientos.seguridad', permission: { modulo: 'mantenimientos', accion: 'ver' } },
      { id: 'alertas', nombre: 'Destinatarios Alertas', icono: '📧', route: 'mantenimientos.alertas', permission: { modulo: 'mantenimientos', accion: 'ver' } },
      { id: 'estadoacceso', nombre: 'Estado de Acceso', icono: '🔍', route: 'mantenimientos.estadoacceso', permission: { modulo: 'mantenimientos', accion: 'ver' } },
    ],
  },
];

const ROUTE_PERMISSION_MAP = new Map<string, RoutePermission>();
MENU_CONFIG.forEach((moduleItem) => {
  ROUTE_PERMISSION_MAP.set(moduleItem.route, moduleItem.permission);
  moduleItem.submenus.forEach((submenuItem) => {
    ROUTE_PERMISSION_MAP.set(submenuItem.route, submenuItem.permission);
  });
});

const FAVORITOS_DEFAULT = ['clientes', 'inventarios', 'contabilidad', 'bancos', 'planilla', 'cxc', 'cxp'];

const COLOR_PALETTES: ColorPalette[] = [
  {
    id: 'emerald',
    nombre: 'Esmeralda',
    colors: {
      bgDark: '#0f1a14',
      bgDark2: '#162010',
      accentMain: '#22c55e',
      accentDim: '#16a34a',
      accentSoft: '#dcfce7',
      accentMuted: '#bbf7d0',
      gray100: '#f3f4f6',
      gray200: '#e5e7eb',
      gray400: '#9ca3af',
      gray600: '#4b5563',
      gray800: '#1f2937'
    }
  },
  {
    id: 'ocean',
    nombre: 'Océano',
    colors: {
      bgDark: '#0b1726',
      bgDark2: '#122236',
      accentMain: '#38bdf8',
      accentDim: '#0284c7',
      accentSoft: '#e0f2fe',
      accentMuted: '#bae6fd',
      gray100: '#f1f5f9',
      gray200: '#e2e8f0',
      gray400: '#94a3b8',
      gray600: '#475569',
      gray800: '#1e293b'
    }
  },
  {
    id: 'sunset',
    nombre: 'Atardecer',
    colors: {
      bgDark: '#221417',
      bgDark2: '#2f1b20',
      accentMain: '#f97316',
      accentDim: '#ea580c',
      accentSoft: '#ffedd5',
      accentMuted: '#fed7aa',
      gray100: '#faf7f5',
      gray200: '#ece3df',
      gray400: '#a8a29e',
      gray600: '#57534e',
      gray800: '#292524'
    }
  },
  {
    id: 'violet',
    nombre: 'Violeta',
    colors: {
      bgDark: '#181227',
      bgDark2: '#231a37',
      accentMain: '#a78bfa',
      accentDim: '#8b5cf6',
      accentSoft: '#ede9fe',
      accentMuted: '#ddd6fe',
      gray100: '#f5f3ff',
      gray200: '#e9e5ff',
      gray400: '#a1a1aa',
      gray600: '#52525b',
      gray800: '#27272a'
    }
  },
  {
    id: 'ruby',
    nombre: 'Rubí',
    colors: {
      bgDark: '#241315',
      bgDark2: '#311a1d',
      accentMain: '#ef4444',
      accentDim: '#dc2626',
      accentSoft: '#fee2e2',
      accentMuted: '#fecaca',
      gray100: '#f7f4f4',
      gray200: '#ebe4e4',
      gray400: '#a8a29e',
      gray600: '#57534e',
      gray800: '#292524'
    }
  }
];

const THEME_STORAGE_KEY = 'mya-color-theme';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', sans-serif; }
  :root {
    --bg-dark:     #0f1a14;
    --bg-dark2:    #162010;
    --green-main:  #22c55e;
    --green-dim:   #16a34a;
    --green-soft:  #dcfce7;
    --green-muted: #bbf7d0;
    --gray-100:    #f3f4f6;
    --gray-200:    #e5e7eb;
    --gray-400:    #9ca3af;
    --gray-600:    #4b5563;
    --gray-800:    #1f2937;
    --white:       #ffffff;
    --sidebar-w:   84px;
    --navbar-h:    86px;
  }
  .login-wrap { min-height:100vh; display:flex; background:var(--bg-dark); position:relative; overflow:hidden; }
  .login-deco { position:absolute; inset:0; background: radial-gradient(ellipse 60% 60% at 70% 50%, rgba(34,197,94,0.10) 0%, transparent 70%), repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(34,197,94,0.04) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(34,197,94,0.04) 40px); }
  .login-panel { position:relative; z-index:1; margin:auto; width:420px; background:rgba(255,255,255,0.03); border:1px solid rgba(34,197,94,0.18); border-radius:20px; padding:48px 40px; backdrop-filter:blur(12px); }
  .login-logo { width:56px; height:56px; border-radius:14px; background:linear-gradient(135deg,var(--green-dim),var(--green-main)); display:flex; align-items:center; justify-content:center; font-family:'DM Mono',monospace; font-size:22px; font-weight:500; color:white; margin-bottom:20px; box-shadow:0 0 32px rgba(34,197,94,0.3); }
  .login-title { font-size:26px; font-weight:600; color:white; letter-spacing:-0.5px; }
  .login-sub { font-size:13px; color:var(--gray-400); margin-top:4px; margin-bottom:32px; }
  .field-label { display:block; font-size:12px; font-weight:500; color:var(--gray-400); letter-spacing:0.06em; text-transform:uppercase; margin-bottom:6px; }
  .field-input { width:100%; padding:11px 14px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.10); border-radius:10px; color:white; font-size:14px; font-family:'DM Sans',sans-serif; outline:none; transition:border-color 0.2s,box-shadow 0.2s; margin-bottom:18px; }
  .field-input:focus { border-color:var(--green-main); box-shadow:0 0 0 3px rgba(34,197,94,0.15); }
  .field-input option { background:#1a2e1a; color:white; }
  .field-hint { font-size:11px; color:var(--gray-400); font-family:'DM Mono',monospace; margin-top:-14px; margin-bottom:18px; }
  .btn-login { width:100%; padding:13px; background:linear-gradient(135deg,var(--green-dim),var(--green-main)); border:none; border-radius:10px; color:white; font-size:14px; font-weight:600; font-family:'DM Sans',sans-serif; cursor:pointer; transition:opacity 0.2s,transform 0.1s; margin-top:6px; }
  .btn-login:hover { opacity:0.92; }
  .btn-login:active { transform:scale(0.98); }
  .btn-login:disabled { opacity:0.6; cursor:not-allowed; }
  .login-error { font-size:12px; color:#f87171; text-align:center; margin-bottom:12px; }
  .login-footer { font-size:11px; color:rgba(255,255,255,0.2); text-align:center; margin-top:28px; font-family:'DM Mono',monospace; }
  .app-shell { min-height:100vh; display:grid; grid-template-rows:var(--navbar-h) 1fr; grid-template-columns:var(--sidebar-w) 1fr; grid-template-areas:"sidebar navbar" "sidebar main"; background:var(--gray-100); }
  .navbar { grid-area:navbar; background:var(--bg-dark); display:flex; align-items:flex-start; padding:10px 24px 8px; gap:16px; border-bottom:1px solid rgba(34,197,94,0.12); }
  .navbar-company { flex:1; }
  .navbar-company-name { font-size:14px; font-weight:600; color:white; }
  .navbar-company-sub { font-size:11px; color:var(--green-main); font-family:'DM Mono',monospace; }
  .navbar-company-switch { margin-top:6px; width:320px; max-width:100%; padding:6px 9px; border-radius:8px;
    border:1px solid rgba(255,255,255,0.15); background:rgba(255,255,255,0.06); color:#fff;
    font-size:12px; font-family:'DM Sans',sans-serif; outline:none; }
  .navbar-company-switch:focus { border-color:var(--green-main); box-shadow:0 0 0 3px rgba(34,197,94,0.15); }
  .navbar-company-switch option { background:#1a2e1a; color:#fff; }
  .navbar-right { display:flex; align-items:center; gap:20px; margin-top:2px; }
  .navbar-badge { font-size:11px; font-family:'DM Mono',monospace; color:var(--gray-400); }
  .navbar-badge span { color:var(--green-main); font-weight:500; }
  .navbar-clock { font-size:13px; font-family:'DM Mono',monospace; color:white; font-weight:500; background:rgba(34,197,94,0.10); padding:4px 10px; border-radius:6px; border:1px solid rgba(34,197,94,0.2); }
  .navbar-user { display:flex; align-items:center; gap:8px; }
  .navbar-user-meta { display:flex; flex-direction:column; gap:2px; }
  .navbar-avatar { width:32px; height:32px; border-radius:8px; background:linear-gradient(135deg,var(--green-dim),var(--green-main)); display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:600; color:white; }
  .navbar-username { font-size:13px; font-weight:500; color:white; }
  .navbar-userrole { font-size:11px; color:var(--green-main); font-family:'DM Mono',monospace; }
  .navbar-logout { display:flex; align-items:center; gap:6px; padding:7px 10px; border-radius:8px; border:1px solid rgba(248,113,113,0.28); background:rgba(248,113,113,0.12); color:#fecaca; font-size:12px; font-weight:600; cursor:pointer; transition:background 0.16s,border-color 0.16s,transform 0.1s; }
  .navbar-logout:hover { background:rgba(248,113,113,0.2); border-color:rgba(248,113,113,0.45); }
  .navbar-logout:active { transform:scale(0.98); }
  .navbar-logout-icon { font-size:13px; line-height:1; }
  .sidebar { grid-area:sidebar; width:var(--sidebar-w); background:linear-gradient(180deg,var(--bg-dark2),var(--bg-dark)); display:flex; flex-direction:column; align-items:stretch; padding:10px 10px 14px; border-right:1px solid rgba(255,255,255,0.08); overflow:hidden; transition:width 0.24s ease, box-shadow 0.24s ease; position:relative; z-index:8; }
  .sidebar:hover { width:260px; box-shadow:8px 0 32px rgba(0,0,0,0.28); }
  .sidebar-logo { width:100%; height:44px; display:flex; align-items:center; justify-content:flex-start; padding:0 8px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:12px; margin-bottom:10px; overflow:hidden; }
  .sidebar-logo-inner { min-width:30px; width:30px; height:30px; border-radius:9px; background:linear-gradient(135deg,var(--green-dim),var(--green-main)); display:flex; align-items:center; justify-content:center; font-family:'DM Mono',monospace; font-size:14px; font-weight:500; color:white; box-shadow:0 0 16px rgba(34,197,94,0.25); }
  .sidebar-logo-label { margin-left:10px; font-size:12px; font-weight:600; color:#f9fafb; letter-spacing:0.02em; white-space:nowrap; opacity:0; transform:translateX(-6px); transition:opacity 0.16s ease, transform 0.16s ease; }
  .sidebar:hover .sidebar-logo-label { opacity:1; transform:translateX(0); }
  .sidebar-item { width:100%; min-height:44px; border-radius:12px; display:flex; align-items:center; gap:10px; cursor:pointer; margin-bottom:6px; padding:0 8px; transition:background 0.16s ease,border-color 0.16s ease; border:1px solid transparent; backdrop-filter:blur(2px); }
  .sidebar-item:hover { background:rgba(255,255,255,0.08); border-color:rgba(255,255,255,0.16); }
  .sidebar-item.active { background:rgba(255,255,255,0.14); border-color:rgba(255,255,255,0.22); }
  .sidebar-icon-wrap { min-width:28px; width:28px; height:28px; border-radius:9px; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.12); transition:background 0.16s ease, border-color 0.16s ease; }
  .sidebar-icon { font-size:15px; color:#d1d5db; line-height:1; transition:color 0.16s; }
  .sidebar-item:hover .sidebar-icon-wrap,.sidebar-item.active .sidebar-icon-wrap { background:linear-gradient(135deg,var(--green-dim),var(--green-main)); border-color:transparent; }
  .sidebar-item:hover .sidebar-icon,.sidebar-item.active .sidebar-icon { color:white; }
  .sidebar-label { font-size:12px; color:#d1d5db; font-weight:500; white-space:nowrap; opacity:0; transform:translateX(-8px); transition:opacity 0.16s ease, transform 0.16s ease, color 0.16s; }
  .sidebar:hover .sidebar-label { opacity:1; transform:translateX(0); }
  .sidebar-item:hover .sidebar-label,.sidebar-item.active .sidebar-label { color:white; }
  .sidebar-divider { width:100%; height:1px; background:linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent); margin:6px 0 8px; }
  .sidebar-exit { margin-top:auto; width:100%; min-height:42px; border-radius:12px; display:flex; align-items:center; gap:10px; padding:0 8px; cursor:pointer; border:1px solid transparent; transition:background 0.16s ease,border-color 0.16s ease; }
  .sidebar-exit:hover { background:rgba(248,113,113,0.16); border-color:rgba(248,113,113,0.24); }
  .sidebar-exit-icon-wrap { min-width:28px; width:28px; height:28px; border-radius:9px; background:rgba(248,113,113,0.20); border:1px solid rgba(248,113,113,0.28); display:flex; align-items:center; justify-content:center; }
  .sidebar-exit-icon { font-size:14px; color:#fca5a5; }
  .sidebar-exit-label { font-size:12px; color:#fca5a5; font-weight:500; white-space:nowrap; opacity:0; transform:translateX(-8px); transition:opacity 0.16s ease, transform 0.16s ease; }
  .sidebar:hover .sidebar-exit-label { opacity:1; transform:translateX(0); }
  .main-content { grid-area:main; padding:28px 32px; overflow-y:auto; }
  .section-title { font-size:11px; font-weight:600; color:var(--gray-400); letter-spacing:0.08em; text-transform:uppercase; margin-bottom:14px; }
  .favoritos-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:16px; margin-bottom:32px; }
  .fav-card { background:white; border:1px solid var(--gray-200); border-radius:16px; padding:24px 16px; display:flex; flex-direction:column; align-items:center; gap:12px; cursor:pointer; transition:all 0.2s; box-shadow:0 1px 3px rgba(0,0,0,0.04); }
  .fav-card:hover { border-color:var(--green-main); box-shadow:0 6px 20px rgba(34,197,94,0.14); transform:translateY(-3px); }
  .fav-card.active { border-color:var(--green-main); background:var(--green-soft); }
  .fav-icon { width:52px; height:52px; border-radius:14px; background:var(--green-soft); display:flex; align-items:center; justify-content:center; font-size:24px; transition:all 0.2s; }
  .fav-card:hover .fav-icon,.fav-card.active .fav-icon { background:linear-gradient(135deg,var(--green-dim),var(--green-main)); }
  .fav-name { font-size:13px; font-weight:600; color:#374151; text-align:center; }
  .fav-arrow { font-size:11px; color:var(--green-dim); font-weight:600; opacity:0; transition:opacity 0.2s; }
  .fav-card:hover .fav-arrow { opacity:1; }
  .all-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(130px,1fr)); gap:12px; }
  .mod-card { background:white; border:1px solid var(--gray-200); border-radius:12px; padding:16px 12px; display:flex; flex-direction:column; align-items:center; gap:8px; cursor:pointer; transition:all 0.18s; }
  .mod-card:hover { border-color:var(--green-main); box-shadow:0 4px 12px rgba(34,197,94,0.10); transform:translateY(-2px); }
  .mod-icon { width:38px; height:38px; border-radius:10px; background:var(--green-soft); display:flex; align-items:center; justify-content:center; font-size:18px; transition:background 0.18s; }
  .mod-card:hover .mod-icon { background:linear-gradient(135deg,var(--green-dim),var(--green-main)); }
  .mod-name { font-size:11px; font-weight:500; color:var(--gray-600); text-align:center; line-height:1.3; }
  .welcome-bar { background:var(--bg-dark); border-radius:14px; padding:18px 24px; display:flex; align-items:center; gap:16px; margin-bottom:24px; border:1px solid rgba(34,197,94,0.15); }
  .welcome-bar-avatar { width:42px; height:42px; border-radius:10px; background:linear-gradient(135deg,var(--green-dim),var(--green-main)); display:flex; align-items:center; justify-content:center; font-size:18px; font-weight:600; color:white; flex-shrink:0; }
  .welcome-bar-text h2 { font-size:16px; font-weight:600; color:white; }
  .welcome-bar-text p { font-size:12px; color:var(--gray-400); margin-top:2px; }
  .welcome-bar-right { margin-left:auto; text-align:right; }
  .welcome-bar-cia { font-size:11px; font-family:'DM Mono',monospace; color:var(--green-main); background:rgba(34,197,94,0.12); padding:3px 10px; border-radius:6px; display:inline-block; border:1px solid rgba(34,197,94,0.2); }
  .welcome-bar-date { font-size:11px; color:var(--gray-400); margin-top:5px; font-family:'DM Mono',monospace; }
  .loading { display:flex; align-items:center; justify-content:center; min-height:100vh; background:var(--bg-dark); color:var(--green-main); font-family:'DM Mono',monospace; font-size:14px; }
  .theme-switcher { position:fixed; right:18px; bottom:18px; z-index:40; background:rgba(15,23,42,0.92); border:1px solid rgba(255,255,255,0.14); border-radius:14px; padding:12px; width:220px; backdrop-filter:blur(8px); box-shadow:0 12px 30px rgba(0,0,0,0.25); }
  .theme-switcher-title { font-size:11px; letter-spacing:0.07em; text-transform:uppercase; color:var(--gray-400); margin-bottom:8px; font-weight:600; }
  .theme-switcher-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:8px; }
  .theme-chip { width:100%; aspect-ratio:1/1; border-radius:8px; border:2px solid transparent; cursor:pointer; transition:transform 0.15s,border-color 0.15s; }
  .theme-chip:hover { transform:translateY(-2px); }
  .theme-chip.active { border-color:white; }
  .theme-switcher-name { margin-top:8px; font-size:12px; color:#fff; text-align:center; font-weight:500; }
`;

function ThemeSwitcher({
  paletteId,
  onChange
}: {
  paletteId: string;
  onChange: (id: string) => void;
}) {
  const selected = COLOR_PALETTES.find(p => p.id === paletteId) || COLOR_PALETTES[0];

  return (
    <div className="theme-switcher">
      <div className="theme-switcher-title">Paleta de color</div>
      <div className="theme-switcher-grid">
        {COLOR_PALETTES.map(palette => (
          <button
            key={palette.id}
            type="button"
            className={`theme-chip ${palette.id === paletteId ? 'active' : ''}`}
            title={palette.nombre}
            onClick={() => onChange(palette.id)}
            style={{
              background: `linear-gradient(135deg, ${palette.colors.accentDim}, ${palette.colors.accentMain})`
            }}
          />
        ))}
      </div>
      <div className="theme-switcher-name">{selected.nombre}</div>
    </div>
  );
}
function Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return <span>{time.toLocaleTimeString('es-CR')}</span>;
}

async function cargarPermisosUsuarioEmpresa(usuarioId: number, empresaId: number): Promise<PermissionKey[]> {
  const { data: permisosEfectivos, error: errEfectivos } = await supabase.rpc('get_effective_permissions', {
    p_empresa_id: empresaId,
  });

  if (!errEfectivos && Array.isArray(permisosEfectivos)) {
    const permisosSet = new Set<PermissionKey>();
    permisosEfectivos.forEach((row: any) => {
      const moduloCodigo = String(row?.modulo_codigo || '').toLowerCase();
      const accion = String(row?.accion || '').toLowerCase();
      if (moduloCodigo && accion) {
        permisosSet.add(`${moduloCodigo}:${accion}`);
      }
    });
    return Array.from(permisosSet);
  }

  // Fallback para entornos que aun no ejecutan 008.
  const { data: asignaciones, error: errAsignaciones } = await supabase
    .from('usuarios_empresas')
    .select('rol_id')
    .eq('usuario_id', usuarioId)
    .eq('empresa_id', empresaId)
    .eq('activo', true);

  if (errAsignaciones) {
    throw new Error('No se pudieron cargar los roles del usuario en la empresa seleccionada');
  }

  const roleIds = Array.from(new Set((asignaciones || []).map((row: any) => row.rol_id).filter(Boolean)));
  if (roleIds.length === 0) {
    throw new Error('El usuario no tiene un rol activo en esta empresa');
  }

  const { data: permisosRaw, error: errPermisos } = await supabase
    .from('roles_permisos')
    .select('permisos:permiso_id(accion, modulos:modulo_id(codigo))')
    .in('rol_id', roleIds);

  if (errPermisos) {
    throw new Error('No se pudieron cargar los permisos. Ejecute la migración RBAC en Supabase');
  }

  const permisosSet = new Set<PermissionKey>();
  (permisosRaw || []).forEach((row: any) => {
    const permiso = row?.permisos;
    const accion = String(permiso?.accion || '').toLowerCase();
    const moduloCodigo = String(permiso?.modulos?.codigo || '').toLowerCase();
    if (accion && moduloCodigo) {
      permisosSet.add(`${moduloCodigo}:${accion}`);
    }
  });

  return Array.from(permisosSet);
}

function Login({ onLogin }: {
  onLogin: (
    usuario: Usuario,
    empresa: Empresa,
    permisos: PermissionKey[],
    empresasAutorizadas: Empresa[],
    rolesPorEmpresa: RolesPorEmpresa
  ) => void;
}) {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    supabase.from('empresas').select('*').eq('activo', true).order('codigo')
      .then(({ data }) => {
        if (data && data.length > 0) {
          setEmpresas(data);
          setEmpresa(data[0]);
        }
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !empresa) {
      setError('Complete todos los campos'); return;
    }
    setCargando(true); setError('');
    const usernameKey = username.trim();

    const registrarIntento = async (success: boolean) => {
      try {
        await supabase.rpc('register_login_attempt', {
          p_username: usernameKey,
          p_success: success,
          p_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        });
      } catch {
        // No bloquear login por falla de auditoria/rate-limit
      }
    };

    const { data: lockMsg } = await supabase.rpc('check_login_allowed', {
      p_username: usernameKey,
    });
    if (lockMsg) {
      setError(String(lockMsg));
      setCargando(false);
      return;
    }

    const { data: usuario, error: errUsuario, count } = await supabase
      .from('usuarios')
      .select('*', { count: 'exact' })
      .ilike('username', usernameKey)
      .eq('activo', true)
      .maybeSingle();

    if (errUsuario) {
      setError('No se pudo validar el usuario');
      await registrarIntento(false);
      setCargando(false);
      return;
    }

    if ((count ?? 0) > 1) {
      setError('Hay usuarios duplicados con ese username. Corrija en mantenimiento.');
      await registrarIntento(false);
      setCargando(false);
      return;
    }

    if (!usuario) {
      setError('Usuario no encontrado o inactivo');
      await registrarIntento(false);
      setCargando(false);
      return;
    }

    
    if (!usuario.email) {
      setError('El usuario no tiene email configurado para iniciar sesión');
      setCargando(false);
      return;
    }

    const { data: authData, error: errAuth } = await supabase.auth.signInWithPassword({
      email: usuario.email,
      password,
    });

    if (errAuth || !authData.user) {
      setError('Credenciales inválidas');
      await registrarIntento(false);
      setCargando(false);
      return;
    }
    // if (errAuth || !authData.user) {
    //   setError(errAuth?.message || 'Credenciales inválidas');
    //   setCargando(false);
    //   return;
    // }

    
    if (usuario.auth_user_id && usuario.auth_user_id !== authData.user.id) {
      setError('El usuario no está vinculado correctamente con Auth');
      await registrarIntento(false);
      await supabase.auth.signOut();
      setCargando(false);
      return;
    }

    if (!usuario.auth_user_id) {
      await supabase
        .from('usuarios')
        .update({ auth_user_id: authData.user.id })
        .eq('id', usuario.id);
      usuario.auth_user_id = authData.user.id;
    }

    try {
      const isSuper = Boolean((usuario as any).es_superusuario);
      let empresasAutorizadas: Empresa[] = [];
      let rolesPorEmpresa: RolesPorEmpresa = {};

      if (isSuper) {
        empresasAutorizadas = [...empresas];
        empresasAutorizadas.forEach((emp) => {
          rolesPorEmpresa[emp.id] = 'Super Usuario';
        });
      } else {
        const { data: ueRows, error: errUe } = await supabase
          .from('usuarios_empresas')
          .select('empresa_id, roles:rol_id(nombre)')
          .eq('usuario_id', usuario.id)
          .eq('activo', true);

        if (errUe) {
          setError('No se pudo cargar empresas autorizadas del usuario');
          await registrarIntento(false);
          await supabase.auth.signOut();
          return;
        }

        const empresaIds = Array.from(new Set((ueRows || []).map((r: any) => r.empresa_id).filter(Boolean)));
        empresasAutorizadas = empresas.filter((emp) => empresaIds.includes(emp.id));
        (ueRows || []).forEach((r: any) => {
          if (r?.empresa_id) {
            rolesPorEmpresa[r.empresa_id] = String(r?.roles?.nombre || 'Sin rol');
          }
        });

        if (empresasAutorizadas.length === 0) {
          setError('El usuario no tiene empresas activas asignadas');
          await registrarIntento(false);
          await supabase.auth.signOut();
          return;
        }

        if (!empresasAutorizadas.some((x) => x.id === empresa.id)) {
          setError('Seleccione una empresa autorizada para este usuario');
          await registrarIntento(false);
          await supabase.auth.signOut();
          return;
        }
      }

      const permisos = await cargarPermisosUsuarioEmpresa(usuario.id, empresa.id);
      await registrarIntento(true);
      onLogin(usuario as Usuario, empresa, permisos, empresasAutorizadas, rolesPorEmpresa);
    } catch (e: any) {
      setError('No se pudo validar permisos del usuario');
      await registrarIntento(false);
      await supabase.auth.signOut();
      return;
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-deco" />
      <div className="login-panel">
        <div className="login-logo">MYA</div>
        <div className="login-title">Sistemas MYA</div>
        <div className="login-sub">Morales y Alfaro — Contabilidad Pública y Privada</div>
        <form onSubmit={handleSubmit}>
          <label className="field-label">Usuario</label>
          <input className="field-input" type="text" placeholder="Ingrese su usuario"
            value={username} onChange={e => setUsername(e.target.value)} />
          <label className="field-label">Contraseña</label>
          <input className="field-input" type="password" placeholder="••••••••"
            value={password} onChange={e => setPassword(e.target.value)} />
          <label className="field-label">Empresa</label>
          <select className="field-input" value={empresa?.codigo || ''}
            onChange={e => setEmpresa(empresas.find(x => x.codigo === e.target.value) || null)}>
            {empresas.map(emp => (
              <option key={emp.codigo} value={emp.codigo}>{emp.codigo} — {emp.nombre}</option>
            ))}
          </select>
          <div className="field-hint">Cédula: {empresa?.cedula}</div>
          {error && <div className="login-error">{error}</div>}
          <button className="btn-login" type="submit" disabled={cargando}>
            {cargando ? 'Verificando...' : 'Ingresar al Sistema →'}
          </button>
        </form>
        <div className="login-footer">Sistema MYA v3.0 · {new Date().getFullYear()}</div>
      </div>
    </div>
  );
}

function Dashboard({ usuario, empresa, onSalir, permisos, empresasAutorizadas, rolesPorEmpresa, onCambiarEmpresa }: {
  usuario: Usuario;
  empresa: Empresa;
  onSalir: () => void;
  permisos: PermissionKey[];
  empresasAutorizadas: Empresa[];
  rolesPorEmpresa: RolesPorEmpresa;
  onCambiarEmpresa: (empresaId: number) => Promise<void>;
}) {
  const [moduloActivo, setModuloActivo] = useState('');
  const [submenu, setSubmenu] = useState('');
  const can = (moduloId: string, accion: PermissionAction = 'ver') => (
    permisos.includes(`${moduloId}:${accion}`)
    || (accion !== 'aprobar' && permisos.includes(`${moduloId}:aprobar`))
  );
  const canAccess = (route: string) => {
    const rule = ROUTE_PERMISSION_MAP.get(route);
    if (!rule) return true;
    return can(rule.modulo, rule.accion);
  };

  const modulosPermitidos = MENU_CONFIG.filter(m => canAccess(m.route));
  const moduloActivoConfig = modulosPermitidos.find(m => m.id === moduloActivo);
  const submenusPermitidos = (moduloActivoConfig?.submenus || []).filter(s => canAccess(s.route));
  const submenuActivoLabel = submenusPermitidos.find(s => s.id === submenu)?.nombre || submenu;

  useEffect(() => {
    if (!moduloActivo) return;

    const moduloPermitido = modulosPermitidos.find((m) => m.id === moduloActivo);
    if (!moduloPermitido) {
      setModuloActivo('');
      setSubmenu('');
      return;
    }

    if (moduloPermitido.submenus.length === 0) {
      if (submenu) setSubmenu('');
      return;
    }

    if (submenu && !submenusPermitidos.some((s) => s.id === submenu)) {
      setSubmenu('');
    }
  }, [moduloActivo, submenu, modulosPermitidos, submenusPermitidos]);

  useEffect(() => {
    setModuloActivo('');
    setSubmenu('');
  }, [empresa.id]);

  const abrirModulo = (modId: string) => {
    const modulo = modulosPermitidos.find((m) => m.id === modId);
    if (!modulo) {
      setModuloActivo('');
      setSubmenu('');
      return;
    }

    const submenusPermitidosModulo = (modulo.submenus || []).filter((s) => canAccess(s.route));
    setModuloActivo(modId);
    if (submenusPermitidosModulo.length === 1) {
      setSubmenu(submenusPermitidosModulo[0].id);
    } else {
      setSubmenu('');
    }
  };

  const favoritos = modulosPermitidos.filter(m => FAVORITOS_DEFAULT.includes(m.id));
  const otrosModulos = modulosPermitidos.filter(m => !FAVORITOS_DEFAULT.includes(m.id));
  const fecha = new Date().toLocaleDateString('es-CR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  const rolActivo = rolesPorEmpresa[empresa.id] || 'Sin rol';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-inner">M</div>
          <span className="sidebar-logo-label">Sistemas MYA</span>
        </div>
        {modulosPermitidos.map((mod, i) => (
          <React.Fragment key={mod.id}>
            {i === 9 && <div className="sidebar-divider" />}
            <div className={`sidebar-item ${moduloActivo === mod.id ? 'active' : ''}`}
              onClick={() => abrirModulo(mod.id)}
              title={mod.nombre}>
              <span className="sidebar-icon-wrap">
                <span className="sidebar-icon">{mod.icono}</span>
              </span>
              <span className="sidebar-label">{mod.nombre}</span>
            </div>
          </React.Fragment>
        ))}
      </aside>

      <nav className="navbar">
        <div className="navbar-company">
          <div className="navbar-company-name">{empresa.nombre}</div>
          <div className="navbar-company-sub">Cédula {empresa.cedula}</div>
          {empresasAutorizadas.length > 1 && (
            <select
              className="navbar-company-switch"
              value={empresa.id}
              onChange={(e) => onCambiarEmpresa(Number(e.target.value))}
            >
              {empresasAutorizadas.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.codigo} — {emp.nombre}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="navbar-right">
          <div className="navbar-badge">CIA <span>{empresa.codigo}</span></div>
          <div className="navbar-badge">Ver <span>3.0</span></div>
          <div className="navbar-clock"><Clock /></div>
          <div className="navbar-user">
            <div className="navbar-avatar">{usuario.username[0]?.toUpperCase()}</div>
            <div className="navbar-user-meta">
              <span className="navbar-username">{usuario.nombre}</span>
              <span className="navbar-userrole">{rolActivo}</span>
            </div>
            <button className="navbar-logout" onClick={onSalir} title="Cerrar sesión">
              <span className="navbar-logout-icon">⏻</span>
              <span>Salir</span>
            </button>
          </div>
        </div>
      </nav>

    <main className="main-content">

      {/* BREADCRUMB */}
      {moduloActivo && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          marginBottom: '20px', fontSize: '18px', color: '#9ca3af'
        }}>
          <span style={{ cursor: 'pointer', color: '#16a34a', fontWeight: 500 }}
            onClick={() => { setModuloActivo(''); setSubmenu(''); }}>
            Inicio
          </span>
          <span>›</span>
          <span style={{ color: submenu ? '#9ca3af' : '#1f2937', fontWeight: 500,
            cursor: submenu ? 'pointer' : 'default' }}
            onClick={() => submenu ? setSubmenu('') : null}>
            {modulosPermitidos.find(m => m.id === moduloActivo)?.nombre || moduloActivo}
          </span>
          {submenu && (
            <>
              <span>›</span>
              <span style={{ color: '#1f2937', fontWeight: 500 }}>{submenuActivoLabel}</span>
            </>
          )}
        </div>
      )}

      {moduloActivo === 'contabilidad' && submenu === 'asientos' && canAccess('contabilidad.asientos') && 
       <ListaAsientos empresaId={empresa.id} />}
      {moduloActivo === 'mantenimientos' && submenu === 'roles' && canAccess('mantenimientos.roles') && (
        <ListaRoles
          canCreate={can('mantenimientos', 'crear')}
          canEdit={can('mantenimientos', 'editar')}
          canDelete={can('mantenimientos', 'eliminar')}
        />
      )}
      {moduloActivo === 'mantenimientos' && submenu === 'usuarios' && canAccess('mantenimientos.usuarios') && (
        <ListaUsuarios
          canCreate={can('mantenimientos', 'crear')}
          canEdit={can('mantenimientos', 'editar')}
          canDelete={can('mantenimientos', 'eliminar')}
        />
      )}
      {moduloActivo === 'mantenimientos' && submenu === 'modulos' && canAccess('mantenimientos.modulos') && (
        <ListaModulos
          canCreate={can('mantenimientos', 'crear')}
          canEdit={can('mantenimientos', 'editar')}
          canDelete={can('mantenimientos', 'eliminar')}
        />
      )}
      {moduloActivo === 'mantenimientos' && submenu === 'seguridad' && canAccess('mantenimientos.seguridad') && (
        <BitacoraSeguridad canUnlock={can('mantenimientos', 'editar')} />
      )}
      {moduloActivo === 'mantenimientos' && submenu === 'alertas' && canAccess('mantenimientos.alertas') && (
        <AlertasDestinatarios
          canCreate={can('mantenimientos', 'crear')}
          canEdit={can('mantenimientos', 'editar')}
          canDelete={can('mantenimientos', 'eliminar')}
        />
      )}
      {moduloActivo === 'mantenimientos' && submenu === 'estadoacceso' && canAccess('mantenimientos.estadoacceso') && (
        <EstadoAcceso canView={can('mantenimientos', 'ver')} />
      )}
      {moduloActivo === 'contabilidad' && submenu === 'plancuentas' && canAccess('contabilidad.plancuentas') && <PlanCuentas />}
      {moduloActivo === 'contabilidad' && submenu === 'mayorgeneral' && canAccess('contabilidad.mayorgeneral') && <MayorGeneral empresaId={empresa.id} />}
      {moduloActivo === 'contabilidad' && submenu === '' && (
      <div>
        <div className="section-title" style={{ marginBottom: '20px' }}>
          📒 Contabilidad
        </div>
        <div className="favoritos-grid">
          {submenusPermitidos.map(item => (
            <div key={item.id} className="fav-card" onClick={() => setSubmenu(item.id)}>
              <div className="fav-icon">{item.icono}</div>
              <div className="fav-name">{item.nombre}</div>
              <div className="fav-arrow">Abrir →</div>
            </div>
          ))}
        </div>
      </div>
    )}

      {moduloActivo === 'mantenimientos' && submenu === 'empresas' && canAccess('mantenimientos.empresas') && <ListaEmpresas />}
      {moduloActivo === 'mantenimientos' && submenu === 'actividades' && canAccess('mantenimientos.actividades') && <ListaActividades />}

      {moduloActivo === 'contabilidad' && submenu === 'catalogo' && canAccess('contabilidad.catalogo') && <CatalogoEmpresa empresaId={empresa.id} />}
      {moduloActivo === 'mantenimientos' && submenu === '' && (
        <div>
          <div className="section-title" style={{ marginBottom: '20px' }}>
            🔧 Mantenimientos
          </div>
          <div className="favoritos-grid">
            {submenusPermitidos.map(item => (
              <div key={item.id} className="fav-card" onClick={() => setSubmenu(item.id)}>
                <div className="fav-icon">{item.icono}</div>
                <div className="fav-name">{item.nombre}</div>
                <div className="fav-arrow">Abrir →</div>
              </div>
            ))}
          </div>
        </div>
      )}

    {moduloActivo && submenu && !submenusPermitidos.some(item => item.id === submenu) && (
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '26px', color: '#6b7280', fontSize: '14px' }}>
        No tiene acceso a esta vista con el rol actual.
      </div>
    )}

    {moduloActivo === '' && (
      <>
        <div className="welcome-bar">
          <div className="welcome-bar-avatar">{usuario.nombre[0]?.toUpperCase()}</div>
          <div className="welcome-bar-text">
            <h2>Bienvenido, {usuario.nombre}</h2>
            <p>Sus accesos directos están listos</p>
          </div>
          <div className="welcome-bar-right">
            <div className="welcome-bar-cia">CIA {empresa.codigo}</div>
            <div className="welcome-bar-date">{fecha}</div>
          </div>
        </div>
        {modulosPermitidos.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '26px', color: '#6b7280', fontSize: '14px' }}>
            No tiene módulos habilitados para esta empresa. Solicite permisos al administrador.
          </div>
        ) : (
          <>
            <div className="section-title">⭐ Accesos Directos</div>
            <div className="favoritos-grid">
              {favoritos.map(mod => (
                <div key={mod.id}
                  className={`fav-card ${moduloActivo === mod.id ? 'active' : ''}`}
                  onClick={() => abrirModulo(mod.id)}>
                  <div className="fav-icon">{mod.icono}</div>
                  <div className="fav-name">{mod.nombre}</div>
                  <div className="fav-arrow">Abrir →</div>
                </div>
              ))}
            </div>
            <div className="section-title">Todos los Módulos</div>
            <div className="all-grid">
              {otrosModulos.map(mod => (
                <div key={mod.id} className="mod-card"
                  onClick={() => abrirModulo(mod.id)}>
                  <div className="mod-icon">{mod.icono}</div>
                  <div className="mod-name">{mod.nombre}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </>
    )}

    </main>
    </div>
  );
}

function App() {
  const [sesion, setSesion] = useState<{
    usuario: Usuario;
    empresa: Empresa;
    permisos: PermissionKey[];
    empresasAutorizadas: Empresa[];
    rolesPorEmpresa: RolesPorEmpresa;
  } | null>(null);
  const [paletteId, setPaletteId] = useState<string>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return COLOR_PALETTES.some(palette => palette.id === saved) ? saved as string : COLOR_PALETTES[0].id;
  });

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, paletteId);
  }, [paletteId]);

  const palette = COLOR_PALETTES.find(item => item.id === paletteId) || COLOR_PALETTES[0];
  const cssVars: Record<string, string> = {
    '--bg-dark': palette.colors.bgDark,
    '--bg-dark2': palette.colors.bgDark2,
    '--green-main': palette.colors.accentMain,
    '--green-dim': palette.colors.accentDim,
    '--green-soft': palette.colors.accentSoft,
    '--green-muted': palette.colors.accentMuted,
    '--gray-100': palette.colors.gray100,
    '--gray-200': palette.colors.gray200,
    '--gray-400': palette.colors.gray400,
    '--gray-600': palette.colors.gray600,
    '--gray-800': palette.colors.gray800
  };

  const cambiarEmpresaActiva = async (empresaId: number) => {
    if (!sesion) return;
    const empresaNueva = sesion.empresasAutorizadas.find((e) => e.id === empresaId);
    if (!empresaNueva || empresaNueva.id === sesion.empresa.id) return;

    try {
      const permisos = await cargarPermisosUsuarioEmpresa(sesion.usuario.id, empresaNueva.id);
      setSesion({
        ...sesion,
        empresa: empresaNueva,
        permisos,
      });
    } catch {
      alert('No se pudieron cargar permisos para la empresa seleccionada.');
    }
  };

  return (
    <div style={cssVars as React.CSSProperties}>
      <style>{styles}</style>
      <ThemeSwitcher paletteId={paletteId} onChange={setPaletteId} />
      {sesion
        ? <Dashboard
            usuario={sesion.usuario}
            empresa={sesion.empresa}
            permisos={sesion.permisos}
            empresasAutorizadas={sesion.empresasAutorizadas}
            rolesPorEmpresa={sesion.rolesPorEmpresa}
            onCambiarEmpresa={cambiarEmpresaActiva}
            onSalir={() => { supabase.auth.signOut(); setSesion(null); }}
          />
        : <Login onLogin={(u, e, p, ea, rolesMap) => setSesion({
            usuario: u,
            empresa: e,
            permisos: p,
            empresasAutorizadas: ea,
            rolesPorEmpresa: rolesMap,
          })}
          />
      }
    </div>
  );
}

export default App;
