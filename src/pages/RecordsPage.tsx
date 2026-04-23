import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SECTORES, ORBITAS, AMBITOS } from '../types';
import type { Registro } from '../types';

export default function RecordsPage() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    estado: 'aprobado', fuente: '', sector: '', orbita: '',
    ambito: '', busqueda: '', fecha_desde: '', fecha_hasta: '', orden: 'fecha_desc',
  });
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [exporting, setExporting] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      Object.entries(filters).forEach(([key, val]) => {
        if (val) params[key] = val;
      });
      params.limit = '100';
      const data = await api.getRegistros(params);
      setRegistros(data as Registro[]);
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

  const handleExport = async (formato: string) => {
    setExporting(true);
    try {
      const exportData: Record<string, unknown> = {
        formato,
        ids: selectedIds.size > 0 ? Array.from(selectedIds) : undefined,
      };
      if (selectedIds.size === 0) {
        Object.entries(filters).forEach(([key, val]) => {
          if (val) exportData[key] = val;
        });
      }
      const blob = await api.exportRegistros(exportData) as unknown as Blob;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ext = formato === 'xlsx' ? 'xlsx' : formato === 'csv' ? 'csv' : 'docx';
      a.download = `registros.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('success', `Archivo ${ext.toUpperCase()} descargado`);
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setExporting(false);
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

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-AR');
  };

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Registros</h1>
          <p className="page-subtitle">{registros.length} resultados</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => handleExport('xlsx')} disabled={exporting}>
            📊 Excel
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => handleExport('csv')} disabled={exporting}>
            📄 CSV
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => handleExport('docx')} disabled={exporting}>
            📝 Word
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Filters */}
        <div className="filters-bar">
          <input
            className="filter-input"
            type="text"
            placeholder="🔍 Buscar..."
            value={filters.busqueda}
            onChange={(e) => setFilters({ ...filters, busqueda: e.target.value })}
            style={{ minWidth: '200px' }}
          />
          <select
            className="filter-input"
            value={filters.estado}
            onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
          >
            <option value="">Todo estado</option>
            <option value="aprobado">Aprobado</option>
            <option value="rechazado">Rechazado</option>
            <option value="procesado">Procesado</option>
          </select>
          <select
            className="filter-input"
            value={filters.sector}
            onChange={(e) => setFilters({ ...filters, sector: e.target.value })}
          >
            <option value="">Todo sector</option>
            {SECTORES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            className="filter-input"
            value={filters.orbita}
            onChange={(e) => setFilters({ ...filters, orbita: e.target.value })}
          >
            <option value="">Toda órbita</option>
            {ORBITAS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <select
            className="filter-input"
            value={filters.ambito}
            onChange={(e) => setFilters({ ...filters, ambito: e.target.value })}
          >
            <option value="">Todo ámbito</option>
            {AMBITOS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <input
            className="filter-input"
            type="date"
            value={filters.fecha_desde}
            onChange={(e) => setFilters({ ...filters, fecha_desde: e.target.value })}
            title="Desde"
          />
          <input
            className="filter-input"
            type="date"
            value={filters.fecha_hasta}
            onChange={(e) => setFilters({ ...filters, fecha_hasta: e.target.value })}
            title="Hasta"
          />
          <button className="btn btn-primary btn-sm" onClick={loadRecords}>
            Buscar
          </button>
        </div>

        {loading ? (
          <div className="loading-page">
            <div className="spinner" />
          </div>
        ) : registros.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <div className="empty-state-title">Sin resultados</div>
            <p>No se encontraron registros con los filtros aplicados</p>
          </div>
        ) : (
          <div className="card">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '30px' }}>
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={selectedIds.size === registros.length}
                        onChange={() => {
                          if (selectedIds.size === registros.length) setSelectedIds(new Set());
                          else setSelectedIds(new Set(registros.map((r) => r.id)));
                        }}
                      />
                    </th>
                    <th>Título</th>
                    <th>Fuente</th>
                    <th>Sector</th>
                    <th>Órbita</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {registros.map((r) => (
                    <>
                      <tr key={r.id}>
                        <td>
                          <input
                            type="checkbox"
                            className="checkbox"
                            checked={selectedIds.has(r.id)}
                            onChange={() => toggleSelect(r.id)}
                          />
                        </td>
                        <td style={{ maxWidth: '280px' }}>
                          <div
                            style={{
                              fontWeight: 500, whiteSpace: 'nowrap',
                              overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer'
                            }}
                            onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                          >
                            {r.titulo || 'Sin título'}
                          </div>
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{r.fuente}</td>
                        <td><span className="badge badge-ia">{r.sector}</span></td>
                        <td><span className="badge badge-procesado">{r.orbita}</span></td>
                        <td><span className={`badge badge-${r.estado}`}>{r.estado}</span></td>
                        <td style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(r.fecha)}</td>
                        <td>
                          <a href={r.link} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">🔗</a>
                        </td>
                      </tr>
                      {expandedId === r.id && (
                        <tr key={`detail-${r.id}`}>
                          <td colSpan={8} style={{ padding: 'var(--space-lg)', background: 'var(--bg-surface)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
                              <div>
                                {[
                                  { label: 'QUÉ', val: r.que, origin: r.que_origen },
                                  { label: 'QUIÉN', val: r.quien, origin: r.quien_origen },
                                  { label: 'POR QUÉ', val: r.porque, origin: r.porque_origen },
                                  { label: 'DATOS', val: r.datos, origin: r.datos_origen },
                                ].map(({ label, val, origin }) => (
                                  <div key={label} style={{ marginBottom: 'var(--space-md)' }}>
                                    <div className="field-label">
                                      {label}{' '}
                                      <span className={`badge ${origin === 'ia' ? 'badge-ia' : 'badge-operador'}`}>
                                        {origin === 'ia' ? '✦ IA' : '✎ Operador'}
                                      </span>
                                    </div>
                                    <div className="field-value">{val || '-'}</div>
                                  </div>
                                ))}
                              </div>
                              <div>
                                <div className="field-label">Tags</div>
                                <div className="field-value" style={{ marginBottom: 'var(--space-md)' }}>{r.tags || '-'}</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
                                  <div><div className="field-label">Género</div><div className="field-value">{r.genero}</div></div>
                                  <div><div className="field-label">Ámbito</div><div className="field-value">{r.ambito}</div></div>
                                  <div><div className="field-label">Región</div><div className="field-value">{r.region || '-'}</div></div>
                                </div>
                                {r.motivo_rechazo && (
                                  <div style={{ marginTop: 'var(--space-md)', padding: 'var(--space-md)', background: 'var(--danger-subtle)', borderRadius: 'var(--radius-md)' }}>
                                    <div className="field-label" style={{ color: 'var(--danger)' }}>Motivo de Rechazo</div>
                                    <div className="field-value">{r.motivo_rechazo}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>{toast.message}</div>
        </div>
      )}
    </>
  );
}
