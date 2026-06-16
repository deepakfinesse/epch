import mongoose from 'mongoose';

const ExhibitorSchema = new mongoose.Schema({
  companyName:    { type: String, default: '' },
  contactPerson:  { type: String, default: '' },
  email:          { type: String, default: '' },
  phone:          { type: String, default: '' },
  city:           { type: String, default: '' },
  state:          { type: String, default: '' },
  address:        { type: String, default: '' },
  productCategory:{ type: String, default: '' },
}, { _id: false });

const StallSchema = new mongoose.Schema({
  stallNumber: { type: String, required: true },     // "24", "24A", "24B"
  hallId:      { type: Number, required: true },     // 1-17
  aisle:       { type: String, default: '' },        // "E-05"
  area:        { type: Number, default: 9 },         // sqm
  status:      {
    type: String,
    enum: ['available', 'allotted', 'reserved', 'blocked'],
    default: 'available',
  },
  isMerged:    { type: Boolean, default: false },
  mergedWith:  [{ type: String }],                   // sibling stall numbers absorbed
  isSplit:     { type: Boolean, default: false },
  splitParts:  [{ type: String }],                   // ["24A","24B"]
  parentStall: { type: String, default: null },      // for split children
  exhibitor:   { type: ExhibitorSchema, default: () => ({}) },
  source:      { type: String, enum: ['csv', 'erp', 'manual'], default: 'csv' },
}, {
  timestamps: true,
  indexes: [
    { hallId: 1, stallNumber: 1 },
    { status: 1 },
    { 'exhibitor.productCategory': 1 },
  ],
});

// Compound unique: one stall number per hall
StallSchema.index({ hallId: 1, stallNumber: 1 }, { unique: true });

export default mongoose.models.Stall || mongoose.model('Stall', StallSchema);
