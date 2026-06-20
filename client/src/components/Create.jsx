import { useState } from 'react';
import './create.css';
import { toast } from 'react-toastify';
import axios from 'axios';

const Create = () => {
  const [formData, setFormData] = useState({
    instrumentName: '',
    instrumentId: '',
    panelNumber: '',
    description: '',
    xCoordinate: '',
    yCoordinate: ''
  });
  const [errors, setErrors] = useState({});

  const fields = ['instrumentName', 'instrumentId', 'panelNumber', 'description', 'xCoordinate', 'yCoordinate'];
  const filledCount = fields.filter(f => formData[f] !== '').length;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    fields.forEach((field) => {
      if (!formData[field]) newErrors[field] = 'Required';
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_URL}`, { ...formData });
        console.log(data);
        toast.success('Instrument registered.');
      } catch (err) {
        console.log(err);
        toast.error('Error registering instrument.');
      }
    } else {
      toast.error('Please fill in all required fields.');
    }
  };

  return (
    <div className="mf-wrap">
      {/* Header */}
      <div className="mf-header">
        <div className="mf-icon-block">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
        </div>
        <div>
          <h1 className="mf-title">Register Instrument</h1>
          <p className="mf-sub">Add a new monitoring instrument to the mine network</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mf-progress" aria-label={`${filledCount} of ${fields.length} fields filled`}>
        {fields.map((_, i) => (
          <div key={i} className={`mf-dot${i < filledCount ? ' filled' : ''}`} />
        ))}
      </div>

      <form className="mf-card" onSubmit={handleSubmit} noValidate>
        {/* Section: Instrument Identity */}
        <p className="mf-section-label">Instrument identity</p>
        <div className="mf-grid">
          <div className="mf-field mf-full-col">
            <label className="mf-label" htmlFor="instrumentName">
              Instrument type <span className="mf-required">*</span>
            </label>
            <select
              className={`mf-select${errors.instrumentName ? ' mf-input-error' : ''}`}
              id="instrumentName"
              name="instrumentName"
              value={formData.instrumentName}
              onChange={handleChange}
            >
              <option value="">Select instrument type</option>
              <option value="DHT">Dual height tell tail (DHT)</option>
              <option value="SHT">Single height tell tail (SHT)</option>
              <option value="RTT">Rotary tell tail (RTT)</option>
              <option value="AWTT">Auto warning tell tail (AWTT)</option>
              <option value="SC">Stress cells (SC)</option>
              <option value="LC">Load cells (LC)</option>
              <option value="RFC">Roof-Floor convergence (RFC)</option>
              <option value="MPBX">Multipoint borehole extensometer (MPBX)</option>
              <option value="CRI">Convergence rate indicator (CRI)</option>
            </select>
            {errors.instrumentName && <span className="mf-error">{errors.instrumentName}</span>}
          </div>

          <div className="mf-field">
            <label className="mf-label" htmlFor="instrumentId">
              Instrument ID <span className="mf-required">*</span>
            </label>
            <input
              className={`mf-input${errors.instrumentId ? ' mf-input-error' : ''}`}
              type="text"
              id="instrumentId"
              name="instrumentId"
              placeholder="e.g. DHT-042"
              value={formData.instrumentId}
              onChange={handleChange}
            />
            {errors.instrumentId && <span className="mf-error">{errors.instrumentId}</span>}
          </div>

          <div className="mf-field">
            <label className="mf-label" htmlFor="panelNumber">
              Panel number <span className="mf-required">*</span>
            </label>
            <input
              className={`mf-input${errors.panelNumber ? ' mf-input-error' : ''}`}
              type="text"
              id="panelNumber"
              name="panelNumber"
              placeholder="e.g. P-18"
              value={formData.panelNumber}
              onChange={handleChange}
            />
            {errors.panelNumber && <span className="mf-error">{errors.panelNumber}</span>}
          </div>
        </div>

        {/* Section: Location */}
        <p className="mf-section-label">Location details</p>
        <div className="mf-field" style={{ marginBottom: '1.25rem' }}>
          <label className="mf-label" htmlFor="description">
            Location description <span className="mf-required">*</span>
          </label>
          <input
            className={`mf-input${errors.description ? ' mf-input-error' : ''}`}
            type="text"
            id="description"
            name="description"
            placeholder="e.g. approach drive near 18/18 stope"
            value={formData.description}
            onChange={handleChange}
          />
          {errors.description && <span className="mf-error">{errors.description}</span>}
        </div>

        <div className="mf-coord-row">
          <div>
            <label className="mf-label" htmlFor="xCoordinate">
              X coordinate <span className="mf-required">*</span>
            </label>
            <div className={`mf-coord-pill${errors.xCoordinate ? ' mf-coord-error' : ''}`}>
              <span className="mf-coord-tag">X</span>
              <input
                className="mf-coord-input"
                type="number"
                id="xCoordinate"
                name="xCoordinate"
                placeholder="0.000"
                value={formData.xCoordinate}
                onChange={handleChange}
              />
            </div>
            {errors.xCoordinate && <span className="mf-error">{errors.xCoordinate}</span>}
          </div>

          <div>
            <label className="mf-label" htmlFor="yCoordinate">
              Y coordinate <span className="mf-required">*</span>
            </label>
            <div className={`mf-coord-pill${errors.yCoordinate ? ' mf-coord-error' : ''}`}>
              <span className="mf-coord-tag">Y</span>
              <input
                className="mf-coord-input"
                type="number"
                id="yCoordinate"
                name="yCoordinate"
                placeholder="0.000"
                value={formData.yCoordinate}
                onChange={handleChange}
              />
            </div>
            {errors.yCoordinate && <span className="mf-error">{errors.yCoordinate}</span>}
          </div>
        </div>

        {/* Footer */}
        <div className="mf-actions">
          <span className="mf-status">
            {filledCount === fields.length
              ? <span className="mf-status-ready">✓ Ready to register</span>
              : `${fields.length - filledCount} field${fields.length - filledCount !== 1 ? 's' : ''} remaining`}
          </span>
          <button type="submit" className="mf-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
            </svg>
            Register
          </button>
        </div>
      </form>
    </div>
  );
};

export default Create;
