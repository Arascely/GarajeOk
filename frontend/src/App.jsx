import {
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  DocumentChartBarIcon,
  HomeIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { useState } from 'react';

export default function Sidebar() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: HomeIcon, description: 'Métricas en tiempo real' },
    { id: 'operaciones', name: 'Ingreso/Salida', icon: ArrowRightOnRectangleIcon, description: 'Terminal de Vehículos' },
    { id: 'reportes', name: 'Reportes', icon: DocumentChartBarIcon, description: 'Historial y Facturación' },
    { id: 'configuracion', name: 'Configuración', icon: Cog6ToothIcon, description: 'Tarifas y Espacios' },
    { id: 'cuenta', name: 'Mi Cuenta', icon: UserCircleIcon, description: 'Perfil y Operador' },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar contenedor principal */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between shadow-xl">
        <div>
          {/* Header del SaaS Tenant */}
          <div className="p-5 flex items-center justify-between border-b border-slate-800">
            <span className="font-extrabold text-xl tracking-wider text-emerald-400">GarajeOk</span>
            <span className="bg-slate-800 text-xs text-slate-400 px-2 py-1 rounded-md">SaaS v1.0</span>
          </div>

          {/* Lista de Navegación */}
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isSelected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group text-left ${
                    isSelected 
                      ? 'bg-emerald-600 text-white font-medium shadow-md shadow-emerald-900/30' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`h-6 w-6 flex-shrink-0 ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  <div>
                    <p className="text-sm">{item.name}</p>
                    <span className="text-[10px] block opacity-60 font-light -mt-0.5">{item.description}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Info del operador actual abajo en el panel */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center space-x-3">
          <div className="h-9 w-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            OP
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-slate-200 truncate">Operador Turno</p>
            <p className="text-[10px] text-slate-500 truncate">garaje_central@saas.com</p>
          </div>
        </div>
      </aside>

      {/* Contenedor de las vistas dinámicas */}
      <main className="flex-1 overflow-y-auto p-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 capitalize">{activeTab}</h1>
          <p className="text-sm text-slate-500">Gestión de recursos y métricas del sistema.</p>
        </header>
        
        {/* Aquí renderizas los subcomponentes según el estado de activeTab */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 min-h-[400px]">
           {activeTab === 'dashboard' && <p>Contenido del Dashboard: KPIs e Ingresos en tiempo real.</p>}
           {activeTab === 'operaciones' && <p>Terminal rápida para registrar ingresos de DNI y Placas.</p>}
        </div>
      </main>
    </div>
  );
}