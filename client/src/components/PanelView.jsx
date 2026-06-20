import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './PanelView.css';
import PanelSnapshot from './PanelSnapshot';
import PanelSnapshot3D from './PanelSnapshot3D';
import Panel3DViewer from './3d/Panel3DViewer';

const PanelView = () => {
  const [panels, setPanels] = useState([]);
  const [allInstruments, setAllInstruments] = useState([]);
  const [instrumentValues, setInstrumentValues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [is3D, setIs3D] = useState(false);
  const { panelId } = useParams();

  useEffect(() => {
    const fetchPanels = async () => {
      try {
        setLoading(true);
        const url = `${import.meta.env.VITE_BACKEND_URL}/panel/data/${panelId}`;
        const urlInstrument = `${import.meta.env.VITE_BACKEND_URL}/instruments/${panelId}`;
        const responsePanels = await axios.get(url);
        const responseInstrument = await axios.get(urlInstrument);
        setPanels(responsePanels.data);
        setAllInstruments(responseInstrument.data);

        const valuesData = await Promise.all(
          responseInstrument.data.map(async (inst) => {
            const response = await axios.get(
              `${import.meta.env.VITE_BACKEND_URL}/${inst.instrumentId}`
            );
            return {
              instrumentId: inst.instrumentId,
              values: response.data,
            };
          })
        );
        setInstrumentValues(valuesData);
      } catch (err) {
        console.error('Error fetching panel data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPanels();
  }, [panelId]);

  const goNext = () => setCurrent((prev) => Math.min(prev + 1, panels.length - 1));
  const goPrev = () => setCurrent((prev) => Math.max(prev - 1, 0));

  const formatSnapshotDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="panel-status-screen">
        <div className="panel-status-spinner" />
        <p className="panel-status-text">Loading panel data…</p>
      </div>
    );
  }

  if (panels.length === 0) {
    return (
      <div className="panel-status-screen">
        <p className="panel-status-text">No snapshot found for Panel {panelId}</p>
        <Link to="/all/panel" className="panel-status-link">
          ← Back to all panels
        </Link>
      </div>
    );
  }

  const currentSnapshot = panels[current];

  return (
    <div className="panel-view-container">
      <div className="panel-info-section">
        <div className="panel-top-row">
          <div className="panel-title-group">
            <span className="panel-eyebrow">Panel Visualization</span>
            <h2 className="panel-title">Panel {panelId}</h2>
          </div>
          <Link to="/all/panel" className="all-panel-link">
            <span className="all-panel-link-icon">⊞</span>
            All Panels
          </Link>
        </div>

        <div className="panel-meta-row">
          <p className="panel-snapshot-date">
            <span className="panel-meta-label">Snapshot taken</span>
            <strong>{formatSnapshotDate(currentSnapshot.date)}</strong>
          </p>

          <div className="panel-nav">
            <button
              className="panel-nav-btn"
              onClick={goPrev}
              disabled={current === 0}
              aria-label="Previous snapshot"
            >
              <span className="panel-nav-arrow">‹</span>
              Prev
            </button>

            <span className="panel-nav-counter">
              <span className="panel-nav-counter-current">{current + 1}</span>
              <span className="panel-nav-counter-sep">/</span>
              <span className="panel-nav-counter-total">{panels.length}</span>
            </span>

            <button
              className="panel-nav-btn"
              onClick={goNext}
              disabled={current === panels.length - 1}
              aria-label="Next snapshot"
            >
              Next
              <span className="panel-nav-arrow">›</span>
            </button>

            <div className="view-toggle" role="group" aria-label="View mode">
              <button
                className={`view-toggle-btn ${!is3D ? 'active' : ''}`}
                onClick={() => setIs3D(false)}
              >
                2D
              </button>
              <button
                className={`view-toggle-btn ${is3D ? 'active' : ''}`}
                onClick={() => setIs3D(true)}
              >
                3D
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="panel-visualization-section">
        {is3D ? (
          <PanelSnapshot3D
            snapshot={currentSnapshot}
            instrunmentsData={allInstruments}
            instrumentValues={instrumentValues}
          />
        ) : (
          <PanelSnapshot
            snapshot={currentSnapshot}
            instrunmentsData={allInstruments}
            instrumentValues={instrumentValues}
            index={current}
          />
        )}
      </div>
    </div>
  );
};

export default PanelView;
