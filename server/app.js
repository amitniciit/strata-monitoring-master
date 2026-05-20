const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');

require('dotenv').config();

const app = express();

const Instrument = require('./model/instrument');
const Value = require('./model/value');
const Panel = require('./model/panel');

const getInstrumentConversion = require('./utils/conversion');
const { processAFile } = require('./utils/processFile');

const upload = multer({ dest: 'uploads/' });


// ======================
// MONGODB CONNECTION
// ======================

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
}

main()
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => console.log(err));


// ======================
// MIDDLEWARE
// ======================

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// ======================
// GET ALL INSTRUMENTS
// ======================

app.get('/', async (req, res, next) => {

  try {

    const allInstruments = await Instrument.find({});

    res.json(allInstruments);

  } catch (e) {

    console.log(e);

    next(e);
  }
});


// ======================
// CREATE NEW INSTRUMENT
// ======================

app.post('/', async (req, res, next) => {

  try {

    const {
      instrumentName,
      instrumentId,
      panelNumber,
      maxValue,
      minValue,
      description,
      xCoordinate,
      yCoordinate,
      installationDate
    } = req.body;

    const fullFormUnit = getInstrumentConversion(instrumentName);

    const newInstrument = new Instrument({
      instrumentName,
      unit: fullFormUnit.unit,
      instrumentId,
      panelNumber,
      maxValue,
      minValue,
      description,
      xCoordinate,
      yCoordinate,
      installationDate
    });

    console.log(newInstrument);

    await newInstrument.save();

    res.json({ newInstrument });

  } catch (err) {

    console.log(err);

    next(err);
  }
});


// ======================
// GET SINGLE INSTRUMENT DATA
// ======================

app.get('/:instrumentId', async (req, res, next) => {

  try {

    const { instrumentId } = req.params;

    const reqInstrument = await Instrument.find({
      instrumentId
    });

    if (reqInstrument.length === 0) {
      return res.status(404).json({
        message: 'Instrument not found'
      });
    }

    const reqInstrumentValues = await Value.find({
      owner: reqInstrument[0]._id
    });

    const formattedValues = reqInstrumentValues.map((d) => ({
      timestamp: d.timestamp,
      value: d.value,
      maxValue: reqInstrument[0].maxValue,
      minValue: reqInstrument[0].minValue
    }));

    const sortedData = formattedValues.sort(
      (a, b) =>
        new Date(a.timestamp) - new Date(b.timestamp)
    );

    res.json(sortedData);

  } catch (e) {

    console.log(e);

    next(e);
  }
});


// ======================
// ADD INSTRUMENT VALUE
// ======================

app.post('/:instrumentId', async (req, res, next) => {

  try {

    const { instrumentId } = req.params;

    const reqInstrument = await Instrument.find({
      instrumentId
    });

    console.log("required instrument", reqInstrument);

    if (reqInstrument.length === 0) {
      return res.status(404).json({
        message: 'Instrument not found'
      });
    }

    const {
      value,
      timestamp
    } = req.body;

    const newValue = new Value({
      value,
      timestamp,
      owner: reqInstrument[0]._id
    });

    await newValue.save();

    res.json(newValue);

  } catch (e) {

    next(e);
  }
});


// ======================
// GET ALL INSTRUMENTS IN PANEL
// ======================

app.get('/instruments/:panelNumber', async (req, res, next) => {

  try {

    const allInstrument = await Instrument.find({
      panelNumber: req.params.panelNumber
    });

    res.json(allInstrument);

  } catch (err) {

    console.log(err);

    next(err);
  }
});


// ======================
// UPLOAD PANEL SNAPSHOT
// ======================

app.post(
  '/upload/panel',
  upload.single('file'),
  async (req, res, next) => {

    console.log('Received request to upload panel data');

    console.log(req.body);

    try {

      console.log('Received file:', req.file);

      const panelData = await processAFile(req.file.path);

      console.log('Processed panel data:', panelData);

      const newPanel = new Panel(panelData);

      await newPanel.save();

      console.log('Panel saved successfully');

      res.json({
        message: 'file uploaded successfully'
      });

    } catch (err) {

      console.log('Error in upload:', err);

      next(err);
    }
  }
);


// ======================
// GET ALL PANELS
// ======================

app.get('/all/panel', async (req, res, next) => {

  try {

    const panels = await Panel.aggregate([

      { $sort: { panelNumber: 1, date: 1 } },

      {
        $group: {
          _id: "$panelNumber",
          description: { $first: "$notes" },
          snapshots: { $sum: 1 },
          dates: { $push: "$date" }
        }
      },

      {
        $addFields: {
          panelNumber: "$_id"
        }
      },

      { $sort: { panelNumber: 1 } }

    ]);

    const panelWithInstruments = await Promise.all(

      panels.map(async (panel) => {

        const instruments = await Instrument.find(
          { panelNumber: panel.panelNumber },

          {
            _id: 0,
            instrumentId: 1,
            instrumentName: 1,
            description: 1,
            xCoordinate: 1,
            yCoordinate: 1
          }
        );

        return {
          ...panel,
          instruments
        };
      })
    );

    res.json(panelWithInstruments);

  } catch (e) {

    next(e);
  }
});


// ======================
// GET PANEL SNAPSHOTS
// ======================

app.get('/panel/data/:panelNumber', async (req, res, next) => {

  try {

    const panelNumber = parseInt(req.params.panelNumber);

    if (!panelNumber) {
      return res.status(400).json({
        message: "Invalid panel number"
      });
    }

    const panelSnapshots = await Panel.find({
      panelNumber
    }).sort({ date: 1 });

    if (panelSnapshots.length === 0) {
      return res.status(404).json({
        message: "Panel not found"
      });
    }

    console.log("panel snapshots.......", panelSnapshots);

    res.json(panelSnapshots);

  } catch (err) {

    next(err);
  }
});


// ======================
// 404 HANDLER
// ======================

app.use('*', (req, res) => {

  res.status(404).json({
    message: 'route not found'
  });
});


// ======================
// GLOBAL ERROR HANDLER
// ======================

app.use((err, req, res, next) => {

  const {
    message = "something went wrong/default message to debug u have to dig deeper",
    statusCode = 500
  } = err;

  console.log("********** ERROR **************");
  console.log(message, statusCode);
  console.log("********** ERROR **************");

  res.status(statusCode).json({
    message
  });
});


// ======================
// START SERVER
// ======================

app.listen(process.env.PORT || 6000, () => {

  console.log('Server started successfully');
});