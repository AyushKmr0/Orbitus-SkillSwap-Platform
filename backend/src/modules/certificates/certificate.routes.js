import express from 'express';
import { verifyCertificate } from './certificate.controller.js';
import { validateRequest } from '../../shared/validation/validate-request.js';
import { verifyCertificateParamSchema } from './certificate.schema.js';

const router = express.Router();

router.get('/verify/:uniqueId', validateRequest(verifyCertificateParamSchema), verifyCertificate);

export default router;
