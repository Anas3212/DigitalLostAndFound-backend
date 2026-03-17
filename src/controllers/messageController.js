import Message from '../models/Message.js';
import Item from '../models/Item.js';

// @desc    Send a message about an item (Public)
// @route   POST /api/messages
// @access  Public
export const sendMessage = async (req, res) => {
  try {
    const { itemId, name, message } = req.body;
    
    // Verify item exists
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const newMessage = await Message.create({
      item: itemId,
      senderName: name,
      content: message,
      sender: req.user?._id || null // Optional if user is logged in
    });

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get messages for user's items
// @route   GET /api/messages
// @access  Private
export const getMyMessages = async (req, res) => {
  try {
    // Find all items reported by the current user
    const userItems = await Item.find({ reportedBy: req.user._id });
    const itemIds = userItems.map(item => item._id);

    // Find messages for these items
    const messages = await Message.find({ item: { $in: itemIds } })
      .populate('item', 'title type images')
      .sort('-createdAt');

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark message as read
// @route   PUT /api/messages/:id/read
// @access  Private
export const markAsRead = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id).populate('item');
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Security: Only owner of the item can mark its messages as read
    if (message.item.reportedBy.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    message.isRead = true;
    await message.save();
    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
