const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expenses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Expense' }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Group', GroupSchema);
