const mongoose = require('mongoose');

const TrekSchema = new mongoose.Schema({
  title: { type: String, required: true },
  location: { type: String, required: true },
  imageUrl: { type: String, required: true },
  pdfUrl: { type: String },
  description: { type: String },
  price: { type: Number },
  difficulty: { type: String },
  date: { type: Date },
});

module.exports = mongoose.model('Trek', TrekSchema);
