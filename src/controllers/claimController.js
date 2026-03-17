import Claim from '../models/Claim.js';
import Item from '../models/Item.js';

// @desc    Create a new claim for an item
// @route   POST /api/claims
// @access  Private
export const createClaim = async (req, res) => {
  try {
    const { itemId, description } = req.body;
    const proofImage = req.file ? req.file.path : '';

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.status === 'resolved') {
      return res.status(400).json({ message: 'Item already resolved' });
    }

    const claim = await Claim.create({
      item: itemId,
      claimant: req.user._id,
      description,
      proofImage,
    });

    res.status(201).json(claim);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get claims for the logged in user
// @route   GET /api/claims/myclaims
// @access  Private
export const getMyClaims = async (req, res) => {
  try {
    const claims = await Claim.find({ claimant: req.user._id }).populate('item');
    res.json(claims);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get claims made on items reported by the logged in user
// @route   GET /api/claims/on-my-items
// @access  Private
export const getClaimsOnMyItems = async (req, res) => {
  try {
    const myItems = await Item.find({ reportedBy: req.user._id });
    const itemIds = myItems.map(item => item._id);
    const claims = await Claim.find({ item: { $in: itemIds } })
      .populate('item')
      .populate('claimant', 'name email');
    res.json(claims);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update claim status (Admin/Reporter only - simplified for now)
// @route   PUT /api/claims/:id
// @access  Private
export const updateClaimStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const claim = await Claim.findById(req.params.id).populate('item');

    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    // Only the person who reported the item can approve/reject claims
    if (claim.item.reportedBy.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to update claim status' });
    }

    claim.status = status;
    await claim.save();

    if (status === 'approved') {
      const item = await Item.findById(claim.item._id);
      item.status = 'resolved';
      await item.save();
    }

    res.json(claim);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
