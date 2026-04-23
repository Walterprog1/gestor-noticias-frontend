import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SECTORES } from '../types';
import type { User } from '../types';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);
  const [form, setForm] = useState({
    username: '', email: '', password: '', nombre_completo: '',
    rol: 'operador', sector_asignado: '',
  });

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data as User[]);
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreate = async () => {
    try {
      await api.createUser(form);
      showToast('success', 'Usuario creado');
      setShowForm(false);
      setForm({ username: '', email: '', password: '', nombre_completo: '', rol: 'operador', sector_asignado: '' });
      loadUsers();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const toggleActive = async (user: User) => {
    try {
      await api.updateUser(user.id, { activo: !user.activo });
      showToast('success', `Usuario ${user.activo ? 'desactivado' : 'activado'}`);
      loadUsers();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  if (loading) {
    return <div className="loading-page"><div className="spinner" /></div>;
  }

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Usuarios</h1>
          <p className="page-subtitle">{users.length} usuarios registrados</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Nuevo Usuario</button>
      </div>

      <div className="page-body">
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Sector</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 500 }}>{u.username}</td>
                    <td>{u.nombre_completo}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                    <td>
                      <span className={`badge ${u.rol === 'administrador' ? 'badge-ia' : u.rol === 'operador' ? 'badge-procesado' : 'badge-desactivada'}`}>
                        {u.rol}
                      </span>
                    </td>
                    <td>{u.sector_asignado || '-'}</td>
                    <td>
                      <span className={`badge ${u.activo ? 'badge-activa' : 'badge-desactivada'}`}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(u)}>
                        {u.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Nuevo Usuario</span>
              <button className="btn btn-icon btn-ghost" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nombre completo</label>
                <input className="form-input" value={form.nombre_completo} onChange={(e) => setForm({ ...form, nombre_completo: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Usuario</label>
                <input className="form-input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Contraseña</label>
                <input className="form-input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Rol</label>
                <select className="form-input" value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
                  <option value="operador">Operador</option>
                  <option value="analista">Analista</option>
                  <option value="administrador">Administrador</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Sector asignado</label>
                <select className="form-input" value={form.sector_asignado} onChange={(e) => setForm({ ...form, sector_asignado: e.target.value })}>
                  <option value="">Sin asignar</option>
                  {SECTORES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={!form.username || !form.password || !form.email || !form.nombre_completo}>
                Crear Usuario
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>{toast.message}</div>
        </div>
      )}
    </>
  );
}
