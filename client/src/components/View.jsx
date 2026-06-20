import { useEffect, useState } from 'react';
import axios from 'axios';
import './view.css';
import { Link } from 'react-router-dom';

const View = () => {
  const [instruments, setInstrument] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInstrument();
  }, []);

  const fetchInstrument = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}`);
      setInstrument(data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <h1>Loading...</h1>;

  return (
    <>
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-label">Total</span>
          <span className="stat-value">{instruments.length}</span>
        </div>
      </div>

      <div className="instruments-grid">
        {instruments.map((inst) => (
          <Link to={`${inst.instrumentId}/graph`} key={inst.instrumentId} className="instrument-card">
            <div className="card-accent" />
            <div className="card-head">
              <span className="card-id">Instrument #{inst.instrumentId}</span>
              <span className="code-badge">{inst.instrumentName}</span>
            </div>
            <div className="card-row">📍 <b>Position</b> ({inst.xCoordinate}, {inst.yCoordinate})</div>
            <div className="card-row">📋 <b>Description</b> {inst.description}</div>
            <div className="card-footer">
              <span className="status-online">● Online</span>
              <span>View graph →</span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
};

export default View;