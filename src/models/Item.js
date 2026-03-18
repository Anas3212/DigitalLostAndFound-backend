import mongoose from 'mongoose';

const ItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, enum: ['lost', 'found', 'personal'], required: true },
  category: { type: String, required: true },
  location: { type: String, required: true },
  date: { type: Date, default: Date.now },
  images: [{ type: String }],
  tags: [{ type: String }],
  status: { type: String, enum: ['active', 'resolved'], default: 'active' },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  }
}, { timestamps: true });

ItemSchema.index({ title: 'text', description: 'text', tags: 'text' });

export default mongoose.model('Item', ItemSchema);
