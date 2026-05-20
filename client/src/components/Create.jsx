import { useState } from 'react';
import './create.css'; // Assuming you have a CSS file for styling
import {  toast } from 'react-toastify';
import axios from 'axios'
const Create = () => {
  const [formData, setFormData] = useState({
    instrumentName: '',
    instrumentId: '',
    panelNumber: '',
    maxValue: '',
    minValue: '',
    description: '',
    xCoordinate: '',
    yCoordinate: '',
  });

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

  const handleSubmit = async(e) => {
    e.preventDefault();
    if (validateForm()) {
     try {
      const {data}=await axios.post(`${import.meta.env.VITE_BACKEND_URL}`,{...formData});
      console.log(data);
      toast.success('instrument created.');
     } catch (e) {
      console.log(e)
      toast.error('Error creating instrument.');

     }
    }
  };

  return (
    <>
      <form className="create-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="instrumentName">Instrument Name</label>
          <select
            id="instrumentName"
            name="instrumentName"
            value={formData.instrumentName}
            onChange={handleChange}
          >
            <option value="">Select Instrument</option>
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
          {errors.instrumentName && <span className="error">{errors.instrumentName}</span>}
        </div>

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
          <label htmlFor="panelNumber">Panel Number</label>
          <input
            type="text"
            id="panelNumber"
            name="panelNumber"
            placeholder="Enter Panel Number"
            value={formData.panelNumber}
            onChange={handleChange}
          />
          {errors.panelNumber && <span className="error">{errors.panelNumber}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="maxValue">Max Value</label>
          <input
            type="number"
            id="maxValue"
            name="maxValue"
            placeholder="Enter Max Value"
            value={formData.maxValue}
            onChange={handleChange}
          />
          {errors.maxValue && <span className="error">{errors.maxValue}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="minValue">Min Value</label>
          <input
            type="number"
            id="minValue"
            name="minValue"
            placeholder="Enter Min Value"
            value={formData.minValue}
            onChange={handleChange}
          />
          {errors.minValue && <span className="error">{errors.minValue}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <input
            type="text"
            id="description"
            name="description"
            placeholder="in approach drive near 18/18 stope"
            value={formData.description}
            onChange={handleChange}
          />
          {errors.description && <span className="error">{errors.description}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="xCoordinate">X Coordinate</label>
          <input
            type="number"
            id="xCoordinate"
            name="xCoordinate"
            placeholder="Enter X Coordinate"
            value={formData.xCoordinate}
            onChange={handleChange}
          />
          {errors.xCoordinate && <span className="error">{errors.xCoordinate}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="yCoordinate">Y Coordinate</label>
          <input
            type="number"
            id="yCoordinate"
            name="yCoordinate"
            placeholder="Enter Y Coordinate"
            value={formData.yCoordinate}
            onChange={handleChange}
          />
          {errors.yCoordinate && <span className="error">{errors.yCoordinate}</span>}
        </div>

        <button type="submit">Submit</button>
      </form>
    </>
  );
};

export default Create;


