import React, { useState } from 'react';

const empresas = [
  { codigo: '001', nombre: 'MARCO ANTONIO MORALES VARGAS', cedula: '105110120' },
  { codigo: '002', nombre: 'FARMACOSTA 27 ABRIL', cedula: '105110120' },
  { codigo: '003', nombre: 'AGROPECUARIA VASQUEZ Y ZUÑIGA, S.A.', cedula: '3101105236' },
  { codigo: '004', nombre: 'MADFIEL, S.A.', cedula: '3101165320' },
];

function App() {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(empresas[0]);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario || !password) {
      setError('Por favor ingrese usuario y contraseña');
      return;
    }
    alert(`Bienvenido ${usuario} - Empresa: ${empresaSeleccionada.nombre}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 100%)' }}>
      
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
            style={{ background: 'linear-gradient(135deg, #c9a84c, #f0d080)' }}>
            <span className="text-white font-bold text-3xl">M</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#1e3a5f' }}>
            Sistemas MYA
          </h1>
          <p className="text-gray-500 text-sm">Morales y Alfaro - Contabilidad</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleLogin} className="space-y-5">
          
          {/* Usuario */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Usuario
            </label>
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ingrese su usuario"
            />
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ingrese su contraseña"
            />
          </div>

          {/* Selección de empresa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Empresa
            </label>
            <select
              value={empresaSeleccionada.codigo}
              onChange={(e) => setEmpresaSeleccionada(
                empresas.find(emp => emp.codigo === e.target.value) || empresas[0]
              )}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {empresas.map((emp) => (
                <option key={emp.codigo} value={emp.codigo}>
                  {emp.codigo} - {emp.nombre}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Cédula: {empresaSeleccionada.cedula}
            </p>
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          {/* Botón */}
          <button
            type="submit"
            className="w-full text-white font-semibold py-3 rounded-lg transition-all duration-200 hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a8e)' }}
          >
            Ingresar al Sistema
          </button>

        </form>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-gray-400">
          Sistema MYA v3.0 • {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}

export default App;