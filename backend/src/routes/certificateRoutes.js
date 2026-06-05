import express from 'express';
import { verifyCertificate } from '../controllers/certificateController.js';

const router = express.Router();

router.get('/verify/:uniqueId', verifyCertificate);

export default router;
