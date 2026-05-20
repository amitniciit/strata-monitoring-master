import { useState } from 'react';
import './add.css';
import { toast } from 'react-toastify';

import axios from 'axios'
const Add = () => {
  const [formData, setFormData] = useState({
    instrumentId: '',
    value: '',
    timestamp: new Date().toISOString().slice(0,16)
  });
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(formData).forEach((field) => {
      if (!formData[field]) {
        newErrors[field] = 'This field is required';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        setLoading(true)
        const { data } = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/${formData.instrumentId}`,
          {
            value: formData.value,
            timestamp: formData.timestamp
          }
        )
        console.log("adding data in an instrument", data)
        toast.success("data added")
      } catch (error) {
        console.log(error.response.data.message)
        toast.error(error.response.data.message)
      }
      finally {
        setLoading(false)
      }
    }
  };

  return (
    <>
      <form className="add-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="instrumentId">Instrument ID</label>
          <input
            type="text"
            id="instrumentId"
            name="instrumentId"
            placeholder="Enter Instrument ID"
            value={formData.instrumentId}
            onChange={handleChange}
          />
          {errors.instrumentId && <span className="error">{errors.instrumentId}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="timestamp">Date & Time</label>

          <input
            type="datetime-local"
            id="timestamp"
            name="timestamp"
            value={formData.timestamp}
            onChange={handleChange}
          />

          {errors.timestamp && (
            <span className="error">
              {errors.timestamp}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="value">Value</label>
          <input
            type="number"
            id="value"
            name="value"
            placeholder="Enter Value"
            value={formData.value}
            onChange={handleChange}
          />
          {errors.value && <span className="error">{errors.value}</span>}
        </div>
        <button type="submit" disabled={loading}>Add Data</button>
      </form>
    </>
  );
};

export default Add;

