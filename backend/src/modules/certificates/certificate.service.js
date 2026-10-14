import certificateRepository from './certificate.repository.js';
import { AppError } from '../../shared/errors/app-error.js';
import { renderCertificateVerificationPage } from './certificate.renderer.js';

export class CertificateService {
  constructor(repo = certificateRepository) {
    this.repo = repo;
  }

  async verifyCertificate(uniqueId) {
    const certificate = await this.repo.findByUniqueId(uniqueId);
    if (!certificate) {
      throw new AppError(404, 'Certificate not found');
    }
    return certificate;
  }

  renderHtml(certificate) {
    return renderCertificateVerificationPage(certificate);
  }

  async getCertificatesForUser(userId) {
    return this.repo.findByRecipient(userId);
  }
}

export const certificateService = new CertificateService();
export default certificateService;
