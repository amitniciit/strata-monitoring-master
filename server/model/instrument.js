const mongoose=require('mongoose')

const instrumentSchema = new mongoose.Schema({
  instrumentName: {
    type: String,
    enum: [
      'DHT',
      'SHT',
      'RTT',
      'AWTT',
      'SC',
      'LC',
      'RFC',
      'MPBX',
      'CRI'
    ],
    required: true,
  },
  instrumentId: {
    type: String,
    required: true,
    unique: true,
  },
  panelNumber: {
    type: Number,
    required: true,
  },
  maxValue: {
    type: Number,
    required: true,
  },
  minValue: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
    maxlength: 500, // You can adjust the length as needed
  },
  xCoordinate: {
    type: Number,
    required: true,
  },
  yCoordinate: {
    type: Number,
    required: true,
  },
  unit:{
    type:String,
    required:true
  }
});

module.exports = mongoose.model('Instrument', instrumentSchema);
