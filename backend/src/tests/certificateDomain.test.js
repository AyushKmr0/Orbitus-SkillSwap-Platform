import { describe, it, expect, vi, beforeEach } from 'vitest';
import { certificateService } from '../modules/certificates/certificate.service.js';
import { verifyCertificateParamSchema } from '../modules/certificates/certificate.schema.js';
import Certificate from '../models/Certificate.js';

describe('Certificate Domain Unit & Validation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Validation Schema', () => {
    it('should reject too short uniqueId', () => {
      const result = verifyCertificateParamSchema.safeParse({
        params: { uniqueId: 'ab' }
      });
      expect(result.success).toBe(false);
    });

    it('should accept valid certificate uniqueId', () => {
      const result = verifyCertificateParamSchema.safeParse({
        params: { uniqueId: 'ORB-CERT-2026-XYZ987' }
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Certificate Service', () => {
    it('should throw 404 when certificate is not found', async () => {
      vi.spyOn(Certificate, 'findOne').mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue(null)
        })
      });

      await expect(
        certificateService.verifyCertificate('NON-EXISTENT-ID')
      ).rejects.toThrow('Certificate not found');
    });

    it('should return certificate and render HTML with escaping', async () => {
      const mockCert = {
        uniqueId: 'ORB-123',
        recipient: { name: '<script>alert("hack")</script>Bob' },
        skill: { name: 'Fullstack React', category: 'Tech' },
        issueDate: new Date('2026-10-01')
      };

      vi.spyOn(Certificate, 'findOne').mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue(mockCert)
        })
      });

      const cert = await certificateService.verifyCertificate('ORB-123');
      expect(cert.uniqueId).toBe('ORB-123');

      const html = certificateService.renderHtml(cert);
      expect(html).toContain('&lt;script&gt;alert(&quot;hack&quot;)&lt;/script&gt;Bob');
      expect(html).not.toContain('<script>alert("hack")</script>');
    });
  });
});
