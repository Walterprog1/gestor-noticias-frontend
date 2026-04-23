import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Prompt } from '../types';

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [editContent, setEditContent] = useState('');
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  useEffect(() => { loadPrompts(); }, []);

  const loadPrompts = async () => {
    try {
      const data = await api.getPrompts();
      setPrompts(data as Prompt[]);
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
    if (!editingPrompt) return;
    try {
      await api.updatePrompt(editingPrompt.id, { contenido: editContent });
      showToast('success', 'Prompt actualizado (nueva versión creada)');
      setEditingPrompt(null);
      loadPrompts();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  if (loading) {
    return <div className="loading-page"><div className="spinner" /></div>;
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Prompts de IA</h1>
        <p className="page-subtitle">Configuración de los prompts del motor de procesamiento editorial</p>
      </div>

      <div className="page-body">
        {prompts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🤖</div>
            <div className="empty-state-title">Sin prompts configurados</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
            {prompts.map((p) => (
              <div key={p.id} className="card">
                <div className="card-header">
                  <div>
                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                      🤖 {p.nombre}
                      <span className={`badge ${p.activo ? 'badge-activa' : 'badge-desactivada'}`}>
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </span>
                      <span className="badge badge-ia">v{p.version}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {p.descripcion || 'Sin descripción'}
                    </div>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => { setEditingPrompt(p); setEditContent(p.contenido); }}
                  >
                    ✏️ Editar Prompt
                  </button>
                </div>
                <div className="card-body">
                  <pre style={{
                    fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap',
                    maxHeight: '200px', overflow: 'auto', background: 'var(--bg-primary)',
                    padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', lineHeight: 1.6
                  }}>
                    {p.contenido.substring(0, 500)}
                    {p.contenido.length > 500 ? '...' : ''}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingPrompt && (
        <div className="modal-overlay" onClick={() => setEditingPrompt(null)}>
          <div className="modal" style={{ maxWidth: '800px', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Editar Prompt — {editingPrompt.nombre}</span>
              <button className="btn btn-icon btn-ghost" onClick={() => setEditingPrompt(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
                Versión actual: v{editingPrompt.version} · Los cambios en el contenido crean una nueva versión automáticamente.
              </div>
              <textarea
                className="form-input"
                style={{ minHeight: '400px', fontFamily: 'monospace', fontSize: '12px', lineHeight: 1.6 }}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setEditingPrompt(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave}>
                💾 Guardar Nueva Versión
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
