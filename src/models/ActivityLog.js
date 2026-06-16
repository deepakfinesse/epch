import mongoose from 'mongoose';

const ActivityLogSchema = new mongoose.Schema({
  action:      { type: String, required: true }, // "status_change", "exhibitor_assign", "csv_upload", "split", "merge"
  stallNumber: { type: String },
  hallId:      { type: Number },
  hallName:    { type: String },
  oldValue:    { type: mongoose.Schema.Types.Mixed },
  newValue:    { type: mongoose.Schema.Types.Mixed },
  description: { type: String },
  source:      { type: String, enum: ['csv', 'erp', 'manual'], default: 'csv' },
}, {
  timestamps: true,
});

ActivityLogSchema.index({ createdAt: -1 });
ActivityLogSchema.index({ hallId: 1, createdAt: -1 });

export default mongoose.models.ActivityLog || mongoose.model('ActivityLog', ActivityLogSchema);
