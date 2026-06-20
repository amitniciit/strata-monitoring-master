import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './PanelList.css';

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
};

const PanelList = () => {
  const [panels, setPanels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    const fetchPanels = async () => {
      try {
        const url = `${import.meta.env.VITE_BACKEND_URL}/all/panel`;
        const response = await axios.get(url);
        setPanels(response.data);
      } catch (err) {
        console.error("Error in fetching all panels:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPanels();
  }, []);

  const toggleSection = (panelNumber, section) => {
    setExpanded((prev) => ({
      ...prev,
      [panelNumber]: {
        ...prev[panelNumber],
        [section]: !prev[panelNumber]?.[section],
      },
    }));
  };

  if (loading) return (
    <div className="pl-shell">
      <div className="pl-loading">
        <div className="pl-spinner" />
        <p>Loading panels…</p>
      </div>
    </div>
  );

  return (
    <div className="pl-shell">
      <header className="pl-topbar">
        <div className="pl-brand">⛏ MineTrack</div>
        <Link to="/" className="pl-back-btn">← Back to home</Link>
      </header>

      <div className="pl-content">
        <div className="pl-page-head">
          <div>
            <h1 className="pl-title">All Panels</h1>
            <p className="pl-subtitle">{panels.length} panel{panels.length !== 1 ? 's' : ''} registered</p>
          </div>
        </div>

        {panels.length === 0 ? (
          <div className="pl-empty">
            <p>No panels available or offline.</p>
          </div>
        ) : (
          <div className="pl-grid">
            {panels.map((panel, index) => (
              <div className="pl-card" key={index}>

                <div className="pl-card-header">
                  <div className="pl-card-title-row">
                    <span className="pl-panel-number">Panel {panel.panelNumber}</span>
                    <span className="pl-snapshot-badge">{panel.snapshots} snapshots</span>
                  </div>
                  <Link to={`/panelview/${panel.panelNumber}`} className="pl-view-btn">
                    View panel →
                  </Link>
                </div>

                <div className="pl-divider" />

                <div className="pl-section">
                  <button
                    className="pl-toggle-btn"
                    onClick={() => toggleSection(panel.panelNumber, 'dates')}
                  >
                    <span>📅 Dates ({panel.dates.length})</span>
                    <span className="pl-chevron">{expanded[panel.panelNumber]?.dates ? '▲' : '▼'}</span>
                  </button>
                  {expanded[panel.panelNumber]?.dates && (
                    <ul className="pl-list">
                      {panel.dates.map((d, idx) => (
                        <li key={idx} className="pl-list-item">
                          <span className="pl-dot" />
                          {formatDate(d)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {panel.instruments?.length > 0 && (
                  <div className="pl-section">
                    <button
                      className="pl-toggle-btn"
                      onClick={() => toggleSection(panel.panelNumber, 'instruments')}
                    >
                      <span>🔧 Instruments ({panel.instruments.length})</span>
                      <span className="pl-chevron">{expanded[panel.panelNumber]?.instruments ? '▲' : '▼'}</span>
                    </button>
                    {expanded[panel.panelNumber]?.instruments && (
                      <ul className="pl-list">
                        {panel.instruments.map((inst) => (
                          <li key={inst.instrumentId} className="pl-list-item pl-instrument-item">
                            <Link to={`/${inst.instrumentId}/graph`} className="pl-instrument-link">
                              <span className="pl-inst-name">{inst.instrumentName}</span>
                              <span className="pl-inst-meta">ID {inst.instrumentId} · ({inst.xCoordinate}, {inst.yCoordinate})</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PanelList;