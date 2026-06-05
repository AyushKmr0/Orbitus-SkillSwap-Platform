import Certificate from '../models/Certificate.js';

export const verifyCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findOne({ uniqueId: req.params.uniqueId })
      .populate('recipient', 'name profileImage')
      .populate('skill', 'name category');

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    res.status(200).json({ success: true, certificate });
  } catch (error) {
    console.error('Certificate Verify Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error verifying certificate' });
  }
};
