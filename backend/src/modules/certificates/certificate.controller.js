import certificateService from './certificate.service.js';
import { asyncHandler, ApiResponse } from '../../shared/index.js';

export const verifyCertificate = asyncHandler(async (req, res) => {
  const certificate = await certificateService.verifyCertificate(req.params.uniqueId);

  const acceptsHtml = req.get('accept')?.includes('text/html');
  if (acceptsHtml && req.accepts(['html', 'json']) === 'html') {
    return res.status(200).type('html').send(certificateService.renderHtml(certificate));
  }

  return res.status(200).json(
    new ApiResponse(200, { certificate }, 'Certificate verified')
  );
});
