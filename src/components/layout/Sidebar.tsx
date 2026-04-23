import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import { api } from '../../services/api';

export default function Sidebar() {
  const { user, logout, isAdmin, isAnalyst } = useAuth();
  const location = useLocation();
  const [queueCount, setQueueCount] = useState(0);

  useEffect(() => {
    if (!isAnalyst) {
      api.getRegistroCount('procesado')
        .then((data: any) => setQueueCount(data.count))
        .catch(() => {});
    }
    const interval = setInterval(() => {
      if (!isAnalyst) {
        api.getRegistroCount('procesado')
          .then((data: any) => setQueueCount(data.count))
          .catch(() => {});
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [isAnalyst]);

  const initials = user?.nombre_completo
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'U';

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">GN</div>
        <div className="sidebar-brand">
          Gestor Noticias
          <small>v2.0</small>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-title">Principal</div>
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">📊</span>
            Dashboard
          </NavLink>

          {!isAnalyst && (
            <NavLink
              to="/aprobacion"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">✅</span>
              Cola de Aprobación
              {queueCount > 0 && <span className="nav-badge">{queueCount}</span>}
            </NavLink>
          )}

          <NavLink
            to="/registros"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">📰</span>
            Registros
          </NavLink>
        </div>

        {isAdmin && (
          <div className="nav-section">
            <div className="nav-section-title">Administración</div>
            <NavLink
              to="/fuentes"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">🌐</span>
              Fuentes
            </NavLink>
            <NavLink
              to="/prompts"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">🤖</span>
              Prompts IA
            </NavLink>
            <NavLink
              to="/usuarios"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">👥</span>
              Usuarios
            </NavLink>
          </div>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{initials}</div>
          <div className="user-details">
            <div className="user-name">{user?.nombre_completo}</div>
            <div className="user-role">
              {user?.rol}
              {user?.sector_asignado ? ` · ${user.sector_asignado}` : ''}
            </div>
          </div>
          <button
            className="btn btn-icon btn-ghost"
            onClick={logout}
            title="Cerrar sesión"
            style={{ fontSize: '16px' }}
          >
            ⏻
          </button>
        </div>
      </div>
    </aside>
  );
}
