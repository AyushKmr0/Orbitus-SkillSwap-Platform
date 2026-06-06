import Certificate from '../models/Certificate.js';

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const renderCertificateVerificationPage = (certificate) => {
  const recipientName = certificate.recipient?.name || 'Orbitus learner';
  const skillName = certificate.skill?.name || 'Verified skill';
  const skillCategory = certificate.skill?.category || 'Skill Exchange';
  const issueDate = certificate.issueDate
    ? new Date(certificate.issueDate).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Issued by Orbitus';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Orbitus Certificate Verification</title>
    <style>
      :root { color-scheme: dark; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #020617;
        color: #e2e8f0;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      main {
        width: min(92vw, 720px);
        border: 1px solid rgba(148, 163, 184, 0.22);
        background: rgba(15, 23, 42, 0.92);
        border-radius: 24px;
        padding: 32px;
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45);
      }
      .brand { font-size: 14px; font-weight: 800; letter-spacing: 0.16em; color: #818cf8; text-transform: uppercase; }
      h1 { margin: 16px 0 8px; font-size: clamp(28px, 5vw, 42px); line-height: 1; color: white; }
      .status {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-top: 18px;
        border: 1px solid rgba(16, 185, 129, 0.35);
        background: rgba(16, 185, 129, 0.12);
        color: #6ee7b7;
        border-radius: 999px;
        padding: 8px 12px;
        font-size: 13px;
        font-weight: 800;
      }
      dl { display: grid; gap: 14px; margin: 28px 0 0; }
      .row { border-top: 1px solid rgba(148, 163, 184, 0.16); padding-top: 14px; }
      dt { color: #94a3b8; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; }
      dd { margin: 6px 0 0; color: #f8fafc; font-size: 18px; font-weight: 750; overflow-wrap: anywhere; }
      p { color: #94a3b8; line-height: 1.6; }
    </style>
  </head>
  <body>
    <main>
      <div class="brand">Orbitus Verification</div>
      <h1>Certificate Verified</h1>
      <p>This certificate was issued by Orbitus for a completed skill exchange.</p>
      <div class="status">Verified Certificate</div>
      <dl>
        <div class="row"><dt>Recipient</dt><dd>${escapeHtml(recipientName)}</dd></div>
        <div class="row"><dt>Skill</dt><dd>${escapeHtml(skillName)} · ${escapeHtml(skillCategory)}</dd></div>
        <div class="row"><dt>Certificate ID</dt><dd>${escapeHtml(certificate.uniqueId)}</dd></div>
        <div class="row"><dt>Issue Date</dt><dd>${escapeHtml(issueDate)}</dd></div>
      </dl>
    </main>
  </body>
</html>`;
};

export const verifyCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findOne({ uniqueId: req.params.uniqueId })
      .populate('recipient', 'name profileImage')
      .populate('skill', 'name category');

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    const acceptsHtml = req.get('accept')?.includes('text/html');
    if (acceptsHtml && req.accepts(['html', 'json']) === 'html') {
      return res.status(200).type('html').send(renderCertificateVerificationPage(certificate));
    }

    res.status(200).json({ success: true, certificate });
  } catch (error) {
    console.error('Certificate Verify Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error verifying certificate' });
  }
};
