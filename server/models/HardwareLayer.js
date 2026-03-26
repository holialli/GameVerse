const mongoose = require('mongoose');

const hardwareLayerSchema = new mongoose.Schema({
  componentType: { type: String, required: true },
  name: { type: String, required: true },
  performanceScore: Number
});

module.exports = mongoose.model('HardwareLayer', hardwareLayerSchema);
