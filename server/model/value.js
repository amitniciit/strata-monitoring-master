const mongoose = require('mongoose');

const valueSchema = new mongoose.Schema({

  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Instrument',
    required: true,
  },

  timestamp: {
    type: Date,
    required: true,
  },

  value: {
    type: Number,
    required: true,
  }

});

module.exports = mongoose.model('Value', valueSchema);