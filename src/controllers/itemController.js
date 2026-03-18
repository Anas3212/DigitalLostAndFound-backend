import Item from '../models/Item.js';

// @desc    Report a new lost or found item
// @route   POST /api/items
// @access  Private
export const reportItem = async (req, res) => {
  try {
    const { title, description, type, category, location, date, tags, coordinates } = req.body;
    
    const imageUrls = req.files ? req.files.map(file => file.path) : [];

    const item = await Item.create({
      title,
      description,
      type,
      category,
      location,
      date,
      images: imageUrls,
      tags: tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [],
      reportedBy: req.user._id,
      coordinates: coordinates ? (typeof coordinates === 'string' ? JSON.parse(coordinates) : coordinates) : undefined,
    });

    // Automated Matching Logic
    const matchType = type === 'lost' ? 'found' : 'lost';
    const potentialMatches = await Item.find({
      type: matchType,
      category: category,
      status: 'active',
      tags: { $in: item.tags }
    }).limit(5);

    res.status(201).json({
      item,
      matches: potentialMatches
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all items with filters
// @route   GET /api/items
// @access  Public
export const getItems = async (req, res) => {
  try {
    const { type, category, search } = req.query;
    let query = { status: 'active', type: { $ne: 'personal' } };

    if (type) query.type = type;
    if (category) query.category = category;
    const searchTerm = typeof search === 'string' ? search.trim() : '';
    if (searchTerm) {
      const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { title: regex },
        { description: regex },
        { location: regex },
        { category: regex },
        { tags: regex },
      ];
    }

    const items = await Item.find(query).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get item by ID
// @route   GET /api/items/:id
// @access  Public
export const getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate('reportedBy', 'name email avatar phoneNumber');
    if (item) {
      res.json(item);
    } else {
      res.status(404).json({ message: 'Item not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Get items reported by the user
// @route   GET /api/items/myitems
// @access  Private
export const getMyItems = async (req, res) => {
  try {
    const items = await Item.find({ reportedBy: req.user._id }).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Update item
// @route   PUT /api/items/:id
// @access  Private
export const updateItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Check ownership
    if (item.reportedBy.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    // Prevent updates to resolved items
    if (item.status === 'resolved') {
      return res.status(400).json({ message: 'Cannot update a resolved item' });
    }

    const { title, description, category, location, date, tags, status, coordinates } = req.body;

    item.title = title || item.title;
    item.description = description || item.description;
    item.category = category || item.category;
    if (location) item.location = location;
    if (date) item.date = date;
    if (tags) item.tags = tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : item.tags;
    if (status) item.status = status;
    if (coordinates) item.coordinates = coordinates ? (typeof coordinates === 'string' ? JSON.parse(coordinates) : coordinates) : item.coordinates;

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => file.path);
      item.images = [...item.images, ...newImages].slice(0, 5);
    }

    const updatedItem = await item.save();
    const populatedItem = await Item.findById(updatedItem._id).populate('reportedBy', 'name email avatar phoneNumber');
    res.json(populatedItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete item
// @route   DELETE /api/items/:id
// @access  Private
export const deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Check ownership
    if (item.reportedBy.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    // Prevent deletion of resolved items (or allow it but with a warning? usually allow deletion but status check is safer for data integrity during claims)
    if (item.status === 'resolved') {
      return res.status(400).json({ message: 'Cannot delete a resolved item' });
    }

    await item.deleteOne();
    res.json({ message: 'Item removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Get public item info (limited)
// @route   GET /api/items/public/:id
// @access  Public
export const getPublicItemInfo = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('reportedBy', 'name email phoneNumber'); // Include email/phone as requested
    
    if (item) {
      // Send only non-sensitive info
      const publicData = {
        _id: item._id,
        title: item.title,
        description: item.description,
        type: item.type,
        category: item.category,
        location: item.location,
        date: item.date,
        images: item.images,
        status: item.status,
        owner: item.reportedBy?.name || 'Anonymous',
        ownerEmail: item.reportedBy?.email,
        ownerPhone: item.reportedBy?.phoneNumber
      };
      res.json(publicData);
    } else {
      res.status(404).json({ message: 'Item not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Mark item as resolved
// @route   PUT /api/items/:id/resolve
// @access  Private
export const resolveItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.reportedBy.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    item.status = 'resolved';
    await item.save();

    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
