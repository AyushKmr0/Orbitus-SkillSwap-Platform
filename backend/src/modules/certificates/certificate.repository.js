import Certificate from '../../models/Certificate.js';

export class CertificateRepository {
  async findByUniqueId(uniqueId) {
    return Certificate.findOne({ uniqueId })
      .populate('recipient', 'name profileImage')
      .populate('skill', 'name category');
  }

  async findByRecipient(recipientId) {
    return Certificate.find({ recipient: recipientId })
      .populate('skill', 'name category')
      .sort({ issueDate: -1 })
      .lean();
  }

  async create(data) {
    return Certificate.create(data);
  }
}

export const certificateRepository = new CertificateRepository();
export default certificateRepository;
