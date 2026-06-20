const mongoose = require('mongoose');

/* ---------------- SPLIT SCHEMA ---------------- */

const splitSchema = new mongoose.Schema({

  splitNumber: {
    type: Number
  },

  coordinates: [
    {
      x: { type: Number },
      y: { type: Number }
    }
  ],

  status: {
    type: String,

    enum: [
      'intact',
      'splitting',
      'slicing',
      'extracted',
      'failed',
      'active'
    ],

    default: 'intact'
  }

}, { _id: false });

/* ---------------- SLICE SCHEMA ---------------- */

const sliceSchema = new mongoose.Schema({

  sliceNumber: {
    type: Number
  },

  coordinates: [
    {
      x: { type: Number },
      y: { type: Number }
    }
  ],

  status: {
    type: String,

    enum: [
      'intact',
      'splitting',
      'slicing',
      'extracted',
      'failed',
      'active'
    ],

    default: 'intact'
  }

}, { _id: false });

/* ---------------- PILLAR SCHEMA ---------------- */

const pillarSchema = new mongoose.Schema({

  pillarNumber: {
    type: Number,
    required: true
  },

  coordinates: [
    {
      x: {
        type: Number,
        required: true
      },

      y: {
        type: Number,
        required: true
      }
    }
  ],
  height: {
    type: Number,
    default: 3
  },

  status: {
    type: String,

    enum: [
      'intact',
      'splitting',
      'slicing',
      'extracted',
      'failed',
      'active'
    ],

    default: 'intact'
  },

  splits: [splitSchema],

  slices: [sliceSchema]

}, { _id: false });

/* ---------------- PANEL SCHEMA ---------------- */

const panelSchema = new mongoose.Schema({

  panelNumber: {
    type: Number,
    required: true
  },

  date: {
    type: Date,
    default: Date.now
  },

  panelStatus: {
    type: String,

    enum: [
      'working',
      'completed',
      'inactive',
      'active'
    ],

    default: 'working'
  },

  pillars: [pillarSchema],

  instrumentIds: [
    {
      type: String
    }
  ],

  notes: {
    type: String,
    maxlength: 1000
  }

});

/* ---------------- INDEX ---------------- */

panelSchema.index(
  { panelNumber: 1, date: 1 },
  { unique: true }
);

module.exports =
  mongoose.model(
    'Panel',
    panelSchema
  );