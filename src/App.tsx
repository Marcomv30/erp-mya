import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import ListaEmpresas from './pages/Empresas/ListaEmpresas';
import ListaActividades from './pages/Mantenimientos/ListaActividades';
import ListaUsuarios from './pages/Mantenimientos/ListaUsuarios';

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
  password: string;
  nombre: string;
}

const modulos = [
  { nombre: 'Contabilidad', icono: '📒', id: 'contabilidad' },
  { nombre: 'Bancos', icono: '🏦', id: 'bancos' },
  { nombre: 'Proveedores', icono: '🤝', id: 'proveedores' },
  { nombre: 'Clientes', icono: '👥', id: 'clientes' },
  { nombre: 'Inventarios', icono: '📦', id: 'inventarios' },
  { nombre: 'Planilla', icono: '👷', id: 'planilla' },
  { nombre: 'Activos Fijos', icono: '🏗️', id: 'activos' },
  { nombre: 'CxC', icono: '📋', id: 'cxc' },
  { nombre: 'CxP', icono: '📄', id: 'cxp' },
  { nombre: 'Facturación', icono: '🧾', id: 'facturacion' },
  { nombre: 'Ctrl. Piña', icono: '🍍', id: 'pina' },
  { nombre: 'Costos', icono: '⚙️', id: 'costos' },
  { nombre: 'Estadísticas', icono: '📊', id: 'estadisticas' },
  { nombre: 'Mantenimientos', icono: '🔧', id: 'mantenimientos' },
];

const FAVORITOS_DEFAULT = ['clientes', 'inventarios', 'contabilidad', 'bancos', 'planilla', 'cxc', 'cxp'];

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
    --sidebar-w:   72px;
    --navbar-h:    56px;
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
  .navbar { grid-area:navbar; background:var(--bg-dark); display:flex; align-items:center; padding:0 24px; gap:16px; border-bottom:1px solid rgba(34,197,94,0.12); }
  .navbar-company { flex:1; }
  .navbar-company-name { font-size:14px; font-weight:600; color:white; }
  .navbar-company-sub { font-size:11px; color:var(--green-main); font-family:'DM Mono',monospace; }
  .navbar-right { display:flex; align-items:center; gap:20px; }
  .navbar-badge { font-size:11px; font-family:'DM Mono',monospace; color:var(--gray-400); }
  .navbar-badge span { color:var(--green-main); font-weight:500; }
  .navbar-clock { font-size:13px; font-family:'DM Mono',monospace; color:white; font-weight:500; background:rgba(34,197,94,0.10); padding:4px 10px; border-radius:6px; border:1px solid rgba(34,197,94,0.2); }
  .navbar-user { display:flex; align-items:center; gap:8px; }
  .navbar-avatar { width:32px; height:32px; border-radius:8px; background:linear-gradient(135deg,var(--green-dim),var(--green-main)); display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:600; color:white; }
  .navbar-username { font-size:13px; font-weight:500; color:white; }
  .sidebar { grid-area:sidebar; background:var(--bg-dark2); display:flex; flex-direction:column; align-items:center; padding:0 0 16px; border-right:1px solid rgba(34,197,94,0.10); overflow-y:auto; }
  .sidebar-logo { width:100%; height:var(--navbar-h); display:flex; align-items:center; justify-content:center; background:var(--bg-dark); border-bottom:1px solid rgba(34,197,94,0.12); margin-bottom:8px; }
  .sidebar-logo-inner { width:36px; height:36px; border-radius:9px; background:linear-gradient(135deg,var(--green-dim),var(--green-main)); display:flex; align-items:center; justify-content:center; font-family:'DM Mono',monospace; font-size:16px; font-weight:500; color:white; box-shadow:0 0 16px rgba(34,197,94,0.25); }
  .sidebar-item { width:56px; height:56px; border-radius:12px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; cursor:pointer; margin-bottom:2px; transition:background 0.15s; border:1px solid transparent; }
  .sidebar-item:hover { background:rgba(34,197,94,0.10); border-color:rgba(34,197,94,0.2); }
  .sidebar-item.active { background:rgba(34,197,94,0.15); border-color:rgba(34,197,94,0.35); }
  .sidebar-icon { font-size:16px; color:var(--gray-400); line-height:1; transition:color 0.15s; }
  .sidebar-item:hover .sidebar-icon,.sidebar-item.active .sidebar-icon { color:var(--green-main); }
  .sidebar-label { font-size:8.5px; color:var(--gray-400); font-weight:500; text-align:center; line-height:1.2; transition:color 0.15s; }
  .sidebar-item:hover .sidebar-label,.sidebar-item.active .sidebar-label { color:var(--green-muted); }
  .sidebar-divider { width:32px; height:1px; background:rgba(34,197,94,0.10); margin:6px 0; }
  .sidebar-exit { margin-top:auto; width:56px; height:44px; border-radius:10px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; cursor:pointer; border:1px solid transparent; transition:background 0.15s; }
  .sidebar-exit:hover { background:rgba(239,68,68,0.12); border-color:rgba(239,68,68,0.25); }
  .sidebar-exit-icon { font-size:14px; color:#f87171; }
  .sidebar-exit-label { font-size:8.5px; color:#f87171; font-weight:500; }
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
`;

function Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return <span>{time.toLocaleTimeString('es-CR')}</span>;
}

function Login({ onLogin }: { onLogin: (usuario: Usuario, empresa: Empresa) => void }) {
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
    const { data, error: err } = await supabase
      .from('usuarios')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .eq('activo', true)
      .single();

    setCargando(false);
    if (err || !data) { setError('Usuario o contraseña incorrectos'); return; }
    onLogin(data, empresa);
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

function Dashboard({ usuario, empresa, onSalir }: {
  usuario: Usuario; empresa: Empresa; onSalir: () => void;
}) {
  const [moduloActivo, setModuloActivo] = useState('');
  const [submenu, setSubmenu] = useState('');
  const favoritos = modulos.filter(m => FAVORITOS_DEFAULT.includes(m.id));
  const otrosModulos = modulos.filter(m => !FAVORITOS_DEFAULT.includes(m.id));
  const fecha = new Date().toLocaleDateString('es-CR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-inner">M</div>
        </div>
        {modulos.map((mod, i) => (
          <React.Fragment key={mod.id}>
            {i === 9 && <div className="sidebar-divider" />}
            <div className={`sidebar-item ${moduloActivo === mod.id ? 'active' : ''}`}
              onClick={() => { setModuloActivo(mod.id); setSubmenu(''); }} title={mod.nombre}>              <span className="sidebar-icon">{mod.icono}</span>
              <span className="sidebar-label">{mod.nombre}</span>
            </div>
          </React.Fragment>
        ))}
        <div className="sidebar-exit" onClick={onSalir} title="Salir">
          <span className="sidebar-exit-icon">⏻</span>
          <span className="sidebar-exit-label">Salir</span>
        </div>
      </aside>

      <nav className="navbar">
        <div className="navbar-company">
          <div className="navbar-company-name">{empresa.nombre}</div>
          <div className="navbar-company-sub">Cédula {empresa.cedula}</div>
        </div>
        <div className="navbar-right">
          <div className="navbar-badge">CIA <span>{empresa.codigo}</span></div>
          <div className="navbar-badge">Ver <span>3.0</span></div>
          <div className="navbar-clock"><Clock /></div>
          <div className="navbar-user">
            <div className="navbar-avatar">{usuario.username[0]?.toUpperCase()}</div>
            <span className="navbar-username">{usuario.nombre}</span>
          </div>
        </div>
      </nav>

    <main className="main-content">
      {moduloActivo === 'mantenimientos' && submenu === 'usuarios' && <ListaUsuarios />}
      {/* BREADCRUMB */}
      {moduloActivo && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          marginBottom: '20px', fontSize: '13px', color: '#9ca3af'
        }}>
          <span style={{ cursor: 'pointer', color: '#16a34a', fontWeight: 500 }}
            onClick={() => { setModuloActivo(''); setSubmenu(''); }}>
            Inicio
          </span>
          <span>›</span>
          <span style={{ color: submenu ? '#9ca3af' : '#1f2937', fontWeight: 500,
            cursor: submenu ? 'pointer' : 'default' }}
            onClick={() => submenu ? setSubmenu('') : null}>
            {modulos.find(m => m.id === moduloActivo)?.nombre || moduloActivo}
          </span>
          {submenu && (
            <>
              <span>›</span>
              <span style={{ color: '#1f2937', fontWeight: 500 }}>
                {submenu === 'empresas' ? 'Empresas' :
                submenu === 'actividades' ? 'Actividades' :
                submenu === 'usuarios' ? 'Usuarios' :
                submenu === 'roles' ? 'Roles' :
                submenu === 'modulos' ? 'Módulos' : submenu}
              </span>
            </>
          )}
        </div>
      )}
      {moduloActivo === 'mantenimientos' && submenu === 'empresas' && <ListaEmpresas />}
      {moduloActivo === 'mantenimientos' && submenu === 'actividades' && <ListaActividades />}
      {moduloActivo === 'mantenimientos' && submenu === '' && (
        <div>
          <div className="section-title" style={{ marginBottom: '20px' }}>
            🔧 Mantenimientos
          </div>
          <div className="favoritos-grid">
            {[
              { id: 'empresas', nombre: 'Empresas', icono: '🏢' },
              { id: 'actividades', nombre: 'Actividades', icono: '🏭' },
              { id: 'usuarios', nombre: 'Usuarios', icono: '👤' },
              { id: 'roles', nombre: 'Roles', icono: '🔑' },
              { id: 'modulos', nombre: 'Módulos', icono: '📋' },
            ].map(item => (
              <div key={item.id} className="fav-card" onClick={() => setSubmenu(item.id)}>
                <div className="fav-icon">{item.icono}</div>
                <div className="fav-name">{item.nombre}</div>
                <div className="fav-arrow">Abrir →</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {moduloActivo !== 'mantenimientos' && (
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
          <div className="section-title">⭐ Accesos Directos</div>
          <div className="favoritos-grid">
            {favoritos.map(mod => (
              <div key={mod.id}
                className={`fav-card ${moduloActivo === mod.id ? 'active' : ''}`}
                onClick={() => setModuloActivo(mod.id)}>
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
                onClick={() => { setModuloActivo(mod.id); setSubmenu(''); }}>
                <div className="mod-icon">{mod.icono}</div>
                <div className="mod-name">{mod.nombre}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
    </div>
  );
}

function App() {
  const [sesion, setSesion] = useState<{ usuario: Usuario; empresa: Empresa } | null>(null);

  return (
    <>
      <style>{styles}</style>
      {sesion
        ? <Dashboard usuario={sesion.usuario} empresa={sesion.empresa} onSalir={() => setSesion(null)} />
        : <Login onLogin={(u, e) => setSesion({ usuario: u, empresa: e })} />
      }
    </>
  );
}

export default App;