import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './PanelView.css';
import PanelSnapshot from './PanelSnapshot';

const PanelView = () => {
  const [panels, setPanels] = useState([]);
  const [allInstruments, setAllInstruments] = useState([]);
  const [instrumentValues, setInstrumentValues] =
    useState([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);

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
        const valuesData =
          await Promise.all(

            responseInstrument.data.map(
              async (inst) => {

                const response =
                  await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/${inst.instrumentId}`
                  );

                return {
                  instrumentId:
                    inst.instrumentId,

                  values:
                    response.data
                };
              }
            )
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

  const goNext = () =>
    setCurrent((prev) => Math.min(prev + 1, panels.length - 1));

  const goPrev = () =>
    setCurrent((prev) => Math.max(prev - 1, 0));

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
    return <h1 className="panel-loading">Loading data...</h1>;
  }

  if (panels.length === 0) {
    return (
      <p className="panel-empty">
        No snapshot found for Panel {panelId}
      </p>
    );
  }

  const currentSnapshot = panels[current];

  return (
    <div className="panel-view-container">

      <div className="panel-info-section">

        <div className="panel-top-row">
          <h2 className="panel-title">
            Panel #{panelId} Snapshot Viewer
          </h2>

          <Link to="/all/panel" className="all-panel-link">
            All Panels
          </Link>
        </div>

        <p className="panel-snapshot-date">
          Snapshot Taken At:
          <strong>
            {' '}
            {formatSnapshotDate(currentSnapshot.date)}
          </strong>
        </p>

        <div className="panel-nav">
          <button
            onClick={goPrev}
            disabled={current === 0}
          >
            ⬅ Prev
          </button>

          <span>
            Snapshot {current + 1} of {panels.length}
          </span>

          <button
            onClick={goNext}
            disabled={current === panels.length - 1}
          >
            Next ➡
          </button>
        </div>

      </div>

      <div className="panel-visualization-section">
        <PanelSnapshot
          snapshot={currentSnapshot}
          instrunmentsData={allInstruments}
          instrumentValues={instrumentValues}
          index={current}
        />
      </div>

    </div>
  );
};

export default PanelView;



