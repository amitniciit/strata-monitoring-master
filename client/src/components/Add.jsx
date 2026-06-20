import { useState } from 'react';
import './add.css';
import { toast } from 'react-toastify';
import axios from 'axios';

const Add = () => {
  const [formData, setFormData] = useState({
    instrumentId: '',
    value: '',
    timestamp: new Date().toISOString().slice(0, 16)
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const fields = ['instrumentId', 'value', 'timestamp'];
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
        setLoading(true);
        const { data } = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/${formData.instrumentId}`,
          { value: formData.value, timestamp: formData.timestamp }
        );
        console.log('adding data in an instrument', data);
        toast.success('Data added successfully.');
      } catch (error) {
        console.log(error.response.data.message);
        toast.error(error.response.data.message);
      } finally {
        setLoading(false);
      }
    } else {
      toast.error('Please fill in all required fields.');
    }
  };

  return (
    <div className="af-wrap">
      {/* Header */}
      <div className="af-header">
        <div className="af-icon-block">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </div>
        <div>
          <h1 className="af-title">Log Reading</h1>
          <p className="af-sub">Record a new measurement for an instrument</p>
        </div>
      </div>

      {/* Progress dots */}
      <div className="af-progress" aria-label={`${filledCount} of ${fields.length} fields filled`}>
        {fields.map((_, i) => (
          <div key={i} className={`af-dot${i < filledCount ? ' filled' : ''}`} />
        ))}
      </div>

      <form className="af-card" onSubmit={handleSubmit} noValidate>
        <p className="af-section-label">Instrument</p>

        <div className="af-field" style={{ marginBottom: '1.25rem' }}>
          <label className="af-label" htmlFor="instrumentId">
            Instrument ID <span className="af-required">*</span>
          </label>
          <input
            className={`af-input${errors.instrumentId ? ' af-input-error' : ''}`}
            type="text"
            id="instrumentId"
            name="instrumentId"
            placeholder="e.g. DHT-042"
            value={formData.instrumentId}
            onChange={handleChange}
          />
          {errors.instrumentId && <span className="af-error">{errors.instrumentId}</span>}
        </div>

        <p className="af-section-label">Reading</p>

        <div className="af-grid">
          <div className="af-field">
            <label className="af-label" htmlFor="value">
              Value <span className="af-required">*</span>
            </label>
            <div className={`af-value-pill${errors.value ? ' af-pill-error' : ''}`}>
              <span className="af-value-tag">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              </span>
              <input
                className="af-value-input"
                type="number"
                id="value"
                name="value"
                placeholder="0.00"
                value={formData.value}
                onChange={handleChange}
              />
            </div>
            {errors.value && <span className="af-error">{errors.value}</span>}
          </div>

          <div className="af-field">
            <label className="af-label" htmlFor="timestamp">
              Date &amp; time <span className="af-required">*</span>
            </label>
            <input
              className={`af-input${errors.timestamp ? ' af-input-error' : ''}`}
              type="datetime-local"
              id="timestamp"
              name="timestamp"
              value={formData.timestamp}
              onChange={handleChange}
            />
            {errors.timestamp && <span className="af-error">{errors.timestamp}</span>}
          </div>
        </div>

        {/* Footer */}
        <div className="af-actions">
          <span className="af-status">
            {filledCount === fields.length
              ? <span className="af-status-ready">✓ Ready to log</span>
              : `${fields.length - filledCount} field${fields.length - filledCount !== 1 ? 's' : ''} remaining`}
          </span>
          <button type="submit" className="af-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="af-spinner" aria-hidden="true" />
                Logging…
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Log Reading
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Add;
