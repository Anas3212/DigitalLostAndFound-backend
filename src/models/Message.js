import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  senderName: { type: String, required: true }, // For guests or users
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional if logged in
  content: { type: String, required: true },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Message', MessageSchema);
