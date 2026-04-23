import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { ScanStatus, Registro } from '../types';

export default function DashboardPage() {
  const { user } = useAuth();
  const [scanStatus, setScanStatus] = useState<ScanStatus | null>(null);
  const [counts, setCounts] = useState({ procesado: 0, aprobado: 0, rechazado: 0 });
  const [recentRecords, setRecentRecords] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [status, procesado, aprobado, rechazado, recent] = await Promise.all([
        api.getScanStatus(),
        api.getRegistroCount('procesado'),
        api.getRegistroCount('aprobado'),
        api.getRegistroCount('rechazado'),
        api.getRegistros({ estado: 'aprobado', limit: '5', orden: 'fecha_desc' }),
      ]);
      setScanStatus(status as ScanStatus);
      setCounts({
        procesado: (procesado as any).count,
        aprobado: (aprobado as any).count,
        rechazado: (rechazado as any).count,
      });
      setRecentRecords(recent as Registro[]);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
        <span style={{ color: 'var(--text-muted)' }}>Cargando dashboard...</span>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          Bienvenido, {user?.nombre_completo} · Vista general del sistema
        </p>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="stats-grid" style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="stat-card">
            <div className="stat-icon">📰</div>
            <div className="stat-value">{scanStatus?.total_articulos || 0}</div>
            <div className="stat-label">Artículos Extraídos</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ color: 'var(--warning)' }}>⏳</div>
            <div className="stat-value" style={{ color: 'var(--warning)' }}>{counts.procesado}</div>
            <div className="stat-label">Pendientes de Aprobación</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ color: 'var(--success)' }}>✅</div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{counts.aprobado}</div>
            <div className="stat-label">Aprobados</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ color: 'var(--danger)' }}>❌</div>
            <div className="stat-value" style={{ color: 'var(--danger)' }}>{counts.rechazado}</div>
            <div className="stat-label">Rechazados</div>
          </div>
        </div>

        {/* Pipeline breakdown */}
        {scanStatus && (
          <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
            <div className="card-header">
              <span className="card-title">Pipeline de Procesamiento</span>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', gap: 'var(--space-lg)', flexWrap: 'wrap' }}>
                {[
                  { label: 'Crudos', value: scanStatus.crudo, color: 'var(--text-muted)' },
                  { label: 'Filtrados', value: scanStatus.filtrado, color: 'var(--info)' },
                  { label: 'Procesados', value: scanStatus.procesado, color: 'var(--warning)' },
                  { label: 'No Relevantes', value: scanStatus.no_relevante, color: 'var(--text-muted)' },
                ].map((item) => (
                  <div key={item.label} style={{ flex: 1, minWidth: '120px', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: item.color }}>{item.value}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent approved records */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Últimos Registros Aprobados</span>
          </div>
          {recentRecords.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <div className="empty-state-title">Sin registros aprobados</div>
              <p>Los registros aprobados aparecerán aquí</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Fuente</th>
                    <th>Sector</th>
                    <th>Órbita</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRecords.map((r) => (
                    <tr key={r.id}>
                      <td style={{ maxWidth: '300px' }}>
                        <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {r.titulo}
                        </div>
                      </td>
                      <td>{r.fuente}</td>
                      <td><span className="badge badge-ia">{r.sector}</span></td>
                      <td><span className="badge badge-procesado">{r.orbita}</span></td>
                      <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '12px' }}>
                        {r.fecha ? new Date(r.fecha).toLocaleDateString('es-AR') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
