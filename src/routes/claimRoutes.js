import express from 'express';
import { createClaim, getMyClaims, getClaimsOnMyItems, updateClaimStatus } from '../controllers/claimController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, upload.single('proofImage'), createClaim);

router.get('/myclaims', protect, getMyClaims);

router.get('/on-my-items', protect, getClaimsOnMyItems);

router.route('/:id')
  .put(protect, updateClaimStatus);

export default router;
