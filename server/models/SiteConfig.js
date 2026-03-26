const mongoose = require('mongoose');

const siteConfigSchema = new mongoose.Schema({
  maintenanceMode: { type: Boolean, default: false },
  announcement: String
});

module.exports = mongoose.model('SiteConfig', siteConfigSchema);
