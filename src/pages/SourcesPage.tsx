import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SECTORES } from '../types';
import type { Fuente } from '../types';

export default function SourcesPage() {
  const [fuentes, setFuentes] = useState<Fuente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [scanning, setScanningId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  const emptyForm = {
    nombre: '', url_base: '', sector: '', horarios_escaneo: ['06:00', '12:00', '18:00'],
    secciones: [{ nombre: 'Principal', url: '' }],
    selectores_config: {
      link_selector: 'a[href]',
      contenido_selector: 'article',
      fecha_selector: 'time',
    },
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { loadFuentes(); }, []);

  const loadFuentes = async () => {
    try {
      const data = await api.getFuentes();
      setFuentes(data as Fuente[]);
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

  const handleSave = async () => {
    try {
      if (editingId) {
        await api.updateFuente(editingId, form);
        showToast('success', 'Fuente actualizada');
      } else {
        await api.createFuente(form);
        showToast('success', 'Fuente creada');
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      loadFuentes();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleEdit = (f: Fuente) => {
    setForm({
      nombre: f.nombre,
      url_base: f.url_base,
      sector: f.sector || '',
      horarios_escaneo: f.horarios_escaneo || [],
      secciones: f.secciones.length ? f.secciones : [{ nombre: 'Principal', url: '' }],
      selectores_config: {
        link_selector: f.selectores_config?.link_selector || emptyForm.selectores_config.link_selector,
        contenido_selector: f.selectores_config?.contenido_selector || emptyForm.selectores_config.contenido_selector,
        fecha_selector: f.selectores_config?.fecha_selector || emptyForm.selectores_config.fecha_selector,
      },
    });
    setEditingId(f.id);
    setShowForm(true);
  };

  const handleScan = async (id: number) => {
    setScanningId(id);
    try {
      await api.scanFuente(id);
      showToast('success', 'Escaneo iniciado en segundo plano');
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setTimeout(() => setScanningId(null), 2000);
    }
  };

  const handleDeactivate = async (id: number) => {
    try {
      await api.deleteFuente(id);
      showToast('success', 'Fuente desactivada');
      loadFuentes();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Nunca';
    return new Date(date).toLocaleString('es-AR');
  };

  if (loading) {
    return <div className="loading-page"><div className="spinner" /></div>;
  }

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Fuentes de Noticias</h1>
          <p className="page-subtitle">{fuentes.length} fuentes configuradas</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }}>
          + Nueva Fuente
        </button>
      </div>

      <div className="page-body">
        {fuentes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🌐</div>
            <div className="empty-state-title">Sin fuentes configuradas</div>
            <p>Agregá una fuente de noticias para comenzar</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
            {fuentes.map((f) => (
              <div key={f.id} className="card">
                <div className="card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                    <span style={{ fontSize: '20px' }}>🌐</span>
                    <div>
                      <div style={{ fontWeight: 600 }}>{f.nombre}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{f.url_base}</div>
                    </div>
                    <span className={`badge badge-${f.estado}`}>{f.estado}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleScan(f.id)}
                      disabled={scanning === f.id}
                    >
                      {scanning === f.id ? '⏳ Escaneando...' : '▶ Escanear'}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(f)}>✏️ Editar</button>
                    {f.activa && (
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDeactivate(f.id)} style={{ color: 'var(--danger)' }}>
                        Desactivar
                      </button>
                    )}
                  </div>
                </div>
                <div className="card-body" style={{ display: 'flex', gap: 'var(--space-xl)', fontSize: '13px' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Sector: </span>
                    <span>{f.sector || 'Sin asignar'}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Artículos: </span>
                    <span style={{ fontWeight: 600 }}>{f.articulos_extraidos_total}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Último escaneo: </span>
                    <span>{formatDate(f.ultimo_escaneo)}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Horarios: </span>
                    <span>{f.horarios_escaneo?.join(', ') || '-'}</span>
                  </div>
                  {f.ultimo_error && (
                    <div style={{ color: 'var(--danger)' }}>
                      <span>Error: </span>{f.ultimo_error}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editingId ? 'Editar Fuente' : 'Nueva Fuente'}</span>
              <button className="btn btn-icon btn-ghost" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nombre del medio</label>
                <input className="form-input" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Infobae" />
              </div>
              <div className="form-group">
                <label className="form-label">URL Base</label>
                <input className="form-input" value={form.url_base} onChange={(e) => setForm({ ...form, url_base: e.target.value })} placeholder="https://www.infobae.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Sector</label>
                <select className="form-input" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })}>
                  <option value="">Sin asignar</option>
                  {SECTORES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Selector de links (CSS)</label>
                <input
                  className="form-input"
                  value={form.selectores_config.link_selector || ''}
                  onChange={(e) => setForm({ ...form, selectores_config: { ...form.selectores_config, link_selector: e.target.value } })}
                  placeholder="a[href]"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Selector de contenido (CSS)</label>
                <input
                  className="form-input"
                  value={form.selectores_config.contenido_selector || ''}
                  onChange={(e) => setForm({ ...form, selectores_config: { ...form.selectores_config, contenido_selector: e.target.value } })}
                  placeholder="article"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={!form.nombre || !form.url_base}>
                {editingId ? 'Guardar Cambios' : 'Crear Fuente'}
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
