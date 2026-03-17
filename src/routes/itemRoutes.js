import express from 'express';
import { reportItem, getItems, getItemById, getMyItems, updateItem, deleteItem, getPublicItemInfo, resolveItem } from '../controllers/itemController.js';
import upload from '../middleware/uploadMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getItems)
  .post(protect, upload.array('images', 5), reportItem);

router.get('/myitems', protect, getMyItems);
router.get('/public/:id', getPublicItemInfo);

router.route('/:id')
  .get(getItemById)
  .put(protect, upload.array('images', 5), updateItem)
  .delete(protect, deleteItem);

router.put('/:id/resolve', protect, resolveItem);

export default router;
