import express from 'express';
import controller from '../controllers/scrap';
const router = express.Router();

router.get('/getSongInfo/:searchQuery', controller.getSongInfo);

export default router