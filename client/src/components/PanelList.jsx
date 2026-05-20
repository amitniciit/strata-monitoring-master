import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './PanelList.css';

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
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

  if (loading) return <p className="panel-loading">Loading panels...</p>;

  return (
    <div className="panel-container">
      <h2 className="panel-header">Available Panels</h2>

      <div className="home-button-container">
        <Link to="/" className="home-button">← Back to Home</Link>
      </div>

      {panels.length === 0 ? (
        <p className="panel-info text-center">No panels available or offline.</p>
      ) : (
        <div className="panel-vertical-list">
          {panels.map((panel, index) => (
            <div className="panel-card block-style" key={index}>
              <Link to={`/panelview/${panel.panelNumber}`} className="panel-link">
                <div className="panel-title">Panel view #{panel.panelNumber}</div>
              </Link>

              <div className="panel-section">
                <button
                  className="dropdown-btn"
                  onClick={() => toggleSection(panel.panelNumber, 'dates')}
                >
                  {expanded[panel.panelNumber]?.dates ? 'Hide Dates ▲' : 'Show Dates ▼'}
                </button>
                {expanded[panel.panelNumber]?.dates && (
                  <ul className="dropdown-list">
                    {panel.dates.map((d, idx) => (
                      <li key={idx}>{formatDate(d)}</li>
                    ))}
                  </ul>
                )}
              </div>

              {panel.instruments?.length > 0 && (
                <div className="panel-section">
                  <button
                    className="dropdown-btn"
                    onClick={() => toggleSection(panel.panelNumber, 'instruments')}
                  >
                    {expanded[panel.panelNumber]?.instruments ? 'Hide Instruments ▲' : 'Show Instruments ▼'}
                  </button>
                  {expanded[panel.panelNumber]?.instruments && (
                    <ul className="dropdown-list">
                      {panel.instruments.map((inst) => (
                        <li key={inst.instrumentId}>
                          <Link to={`/${inst.instrumentId}/graph`} className="instrument-link">
                            {inst.instrumentName} ({inst.instrumentId}) @ ({inst.xCoordinate}, {inst.yCoordinate})
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <p className="panel-info"><strong>Snapshots:</strong> {panel.snapshots}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PanelList;

