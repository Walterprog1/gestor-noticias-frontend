import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SECTORES, ORBITAS, GENEROS, AMBITOS } from '../types';
import type { Registro } from '../types';

export default function ApprovalPage() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editedFields, setEditedFields] = useState<Record<string, string>>({});
  const [rejectModal, setRejectModal] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      // Add a timestamp to prevent browser caching of the GET request
      const data = await api.getApprovalQueue();
      setRegistros(data as Registro[]);
      // Clear all transient states to avoid bugs when data changes
      setSelectedIds(new Set());
      setExpandedId(null);
      setEditedFields({});
    } catch (err: any) {
      console.error('Error loading queue:', err);
      showToast('error', err.message);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleApprove = async (id: number) => {
    try {
      const edits = Object.keys(editedFields).length > 0 ? editedFields : undefined;
      await api.approveRegistro(id, edits);
      setRegistros((prev) => prev.filter((r) => r.id !== id));
      setEditedFields({});
      setExpandedId(null);
      showToast('success', 'Registro aprobado');
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleReject = async () => {
    if (!rejectModal || !rejectReason.trim()) return;
    try {
      await api.rejectRegistro(rejectModal, rejectReason);
      setRegistros((prev) => prev.filter((r) => r.id !== rejectModal));
      setRejectModal(null);
      setRejectReason('');
      showToast('success', 'Registro rechazado');
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleBatchApprove = async () => {
    if (selectedIds.size === 0) return;
    try {
      await api.batchAction(Array.from(selectedIds), 'aprobar');
      setRegistros((prev) => prev.filter((r) => !selectedIds.has(r.id)));
      setSelectedIds(new Set());
      showToast('success', `${selectedIds.size} registros aprobados`);
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === registros.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(registros.map((r) => r.id)));
    }
  };

  const handleFieldEdit = (field: string, value: string) => {
    setEditedFields((prev) => ({ ...prev, [field]: value }));
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const OriginBadge = ({ origin }: { origin: string }) => (
    <span className={`badge ${origin === 'ia' ? 'badge-ia' : 'badge-operador'}`}>
      {origin === 'ia' ? '✦ IA' : '✎ Operador'}
    </span>
  );

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
        <span style={{ color: 'var(--text-muted)' }}>Cargando cola de aprobación...</span>
      </div>
    );
  }

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Cola de Aprobación</h1>
          <p className="page-subtitle">{registros.length} registros pendientes de revisión</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          {selectedIds.size > 0 && (
            <button className="btn btn-success" onClick={handleBatchApprove}>
              ✓ Aprobar seleccionados ({selectedIds.size})
            </button>
          )}
          <button className="btn btn-ghost" onClick={() => loadQueue(false)}>↻ Actualizar</button>
        </div>
      </div>

      <div className="page-body">
        {registros.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎉</div>
            <div className="empty-state-title">¡Cola vacía!</div>
            <p>No hay registros pendientes de aprobación</p>
          </div>
        ) : (
          <>
            {/* Select all */}
            <div style={{ marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <label className="checkbox-wrapper">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={selectedIds.size === registros.length && registros.length > 0}
                  onChange={toggleSelectAll}
                />
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Seleccionar todos</span>
              </label>
            </div>

            {registros.map((reg) => (
              <div key={reg.id} className="approval-card">
                <div className="approval-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={selectedIds.has(reg.id)}
                      onChange={() => toggleSelect(reg.id)}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{reg.titulo || 'Sin título'}</div>
                      <div className="approval-card-meta">
                        <span className="meta-item">📰 {reg.fuente}</span>
                        <span className="meta-item">📅 {formatDate(reg.fecha)}</span>
                        <span className={`badge badge-${reg.sector?.toLowerCase() === 'agenda' ? 'ia' : 'procesado'}`}>{reg.sector}</span>
                        <span className="badge badge-procesado">{reg.orbita}</span>
                        <span className="badge badge-ia">{reg.genero}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setExpandedId(expandedId === reg.id ? null : reg.id)}
                  >
                    {expandedId === reg.id ? '▲ Colapsar' : '▼ Expandir'}
                  </button>
                </div>

                {expandedId === reg.id && (
                  <>
                    <div className="approval-card-body">
                      {/* Left: AI generated record */}
                      <div className="approval-panel">
                        <div className="approval-panel-title">
                          <span>✦</span> Registro Generado por IA
                        </div>

                        {[
                          { key: 'titulo', label: 'TÍTULO', origin: reg.titulo_origen },
                          { key: 'que', label: 'QUÉ', origin: reg.que_origen },
                          { key: 'quien', label: 'QUIÉN', origin: reg.quien_origen },
                          { key: 'porque', label: 'POR QUÉ', origin: reg.porque_origen },
                          { key: 'datos', label: 'DATOS', origin: reg.datos_origen },
                          { key: 'tags', label: 'TAGS', origin: reg.tags_origen },
                        ].map(({ key, label, origin }) => (
                          <div key={key} className="field-group">
                            <div className="field-label">
                              {label} <OriginBadge origin={origin} />
                            </div>
                            <textarea
                              className="form-input"
                              style={{ minHeight: key === 'titulo' || key === 'tags' ? '40px' : '60px', fontSize: '13px' }}
                              defaultValue={(reg as any)[key] || ''}
                              onChange={(e) => handleFieldEdit(key, e.target.value)}
                            />
                          </div>
                        ))}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
                          {[
                            { key: 'sector', label: 'Sector', options: SECTORES, origin: reg.sector_origen },
                            { key: 'orbita', label: 'Órbita', options: ORBITAS, origin: reg.orbita_origen },
                            { key: 'genero', label: 'Género', options: GENEROS },
                            { key: 'ambito', label: 'Ámbito', options: AMBITOS },
                          ].map(({ key, label, options, origin }) => (
                            <div key={key} className="field-group">
                              <div className="field-label">
                                {label} {origin && <OriginBadge origin={origin} />}
                              </div>
                              <select
                                className="form-input"
                                defaultValue={(reg as any)[key] || ''}
                                onChange={(e) => handleFieldEdit(key, e.target.value)}
                              >
                                <option value="">-</option>
                                {options.map((o) => (
                                  <option key={o} value={o}>{o}</option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right: Original text */}
                      <div className="approval-panel">
                        <div className="approval-panel-title">
                          <span>📄</span> Nota Original
                        </div>
                        <div style={{ marginBottom: 'var(--space-md)' }}>
                          <div className="field-label">Título Original</div>
                          <div className="field-value" style={{ fontWeight: 500 }}>{reg.titulo_original || '-'}</div>
                        </div>
                        <div className="field-label">Texto Completo</div>
                        <div className="original-text">{reg.texto_crudo || 'Texto no disponible'}</div>
                        <div style={{ marginTop: 'var(--space-md)' }}>
                          <a href={reg.link} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                            🔗 Ver nota original
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="approval-card-actions">
                      <button
                        className="btn btn-danger"
                        onClick={() => { setRejectModal(reg.id); setRejectReason(''); }}
                      >
                        ✕ Rechazar
                      </button>
                      <button className="btn btn-success" onClick={() => handleApprove(reg.id)}>
                        ✓ Aprobar
                      </button>
                    </div>
                  </>
                )}

                {expandedId !== reg.id && (
                  <div className="approval-card-actions">
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => { setRejectModal(reg.id); setRejectReason(''); }}
                    >
                      ✕ Rechazar
                    </button>
                    <button className="btn btn-success btn-sm" onClick={() => handleApprove(reg.id)}>
                      ✓ Aprobar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="modal-overlay" onClick={() => setRejectModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Rechazar Registro</span>
              <button className="btn btn-icon btn-ghost" onClick={() => setRejectModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Motivo de rechazo *</label>
                <textarea
                  className="form-input"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Indicá el motivo del rechazo..."
                  rows={3}
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setRejectModal(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={handleReject} disabled={!rejectReason.trim()}>
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>{toast.message}</div>
        </div>
      )}
    </>
  );
}
