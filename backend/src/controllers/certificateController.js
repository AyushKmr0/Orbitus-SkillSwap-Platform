import Certificate from '../models/Certificate.js';
import {
  asyncHandler,
  ApiError,
  ApiResponse
} from '../utils/index.js';

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const renderCertificateVerificationPage = (certificate) => {
  const recipientName = certificate.recipient?.name || 'Orbitus Learner';
  const skillName = certificate.skill?.name || 'Verified Skill';
  const skillCategory = certificate.skill?.category || 'Skill Exchange';
  const issueDate = certificate.issueDate
    ? new Date(certificate.issueDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Issued by Orbitus';
  const certId = escapeHtml(certificate.uniqueId || 'ORB-CERT');
  const qrCode = certificate.verificationQrCode || '';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(recipientName)} — Certificate of Skill Mastery | Orbitus</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;1,500&display=swap" rel="stylesheet">
    <style>
      :root {
        --gold-1: #d4af37;
        --gold-2: #f7df87;
        --gold-3: #996515;
        --bg-cert: #0a0e17;
      }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        min-height: 100vh;
        background: #04070d;
        color: #e2e8f0;
        font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 24px 16px;
      }
      .actions-bar {
        width: 100%;
        max-width: 900px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }
      .badge-verified {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 14px;
        background: rgba(16, 185, 129, 0.12);
        border: 1px solid rgba(16, 185, 129, 0.35);
        color: #34d399;
        font-size: 12px;
        font-weight: 700;
        border-radius: 999px;
      }
      .badge-verified::before {
        content: "";
        width: 8px;
        height: 8px;
        background: #10b981;
        border-radius: 50%;
        display: inline-block;
        box-shadow: 0 0 8px #10b981;
      }
      .btn-print {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: linear-gradient(135deg, #4f46e5, #6366f1);
        color: white;
        border: none;
        padding: 9px 18px;
        border-radius: 12px;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
      }
      .btn-print:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(79, 70, 229, 0.5);
      }
      .certificate-container {
        width: 100%;
        max-width: 900px;
        background: radial-gradient(circle at 50% 20%, #101626 0%, #080c14 100%);
        border: 3px solid #b8860b;
        border-radius: 20px;
        position: relative;
        padding: 12px;
        box-shadow: 0 30px 90px rgba(0, 0, 0, 0.7), 0 0 40px rgba(212, 175, 55, 0.08);
      }
      .cert-inner-frame {
        border: 1px solid rgba(212, 175, 55, 0.45);
        border-radius: 14px;
        padding: 48px 44px;
        position: relative;
        text-align: center;
        background: rgba(13, 19, 33, 0.6);
      }
      /* Decorative Corner Flourishes */
      .corner {
        position: absolute;
        width: 28px;
        height: 28px;
        border-color: #d4af37;
        border-style: solid;
      }
      .corner-tl { top: 10px; left: 10px; border-width: 2px 0 0 2px; }
      .corner-tr { top: 10px; right: 10px; border-width: 2px 2px 0 0; }
      .corner-bl { bottom: 10px; left: 10px; border-width: 0 0 2px 2px; }
      .corner-br { bottom: 10px; right: 10px; border-width: 0 2px 2px 0; }
      
      .brand-title {
        font-family: 'Cinzel', serif;
        font-size: 15px;
        letter-spacing: 0.35em;
        color: #d4af37;
        font-weight: 700;
        text-transform: uppercase;
        margin-bottom: 8px;
      }
      .cert-title {
        font-family: 'Cinzel', serif;
        font-size: clamp(24px, 4vw, 36px);
        font-weight: 800;
        letter-spacing: 0.1em;
        color: #ffffff;
        text-transform: uppercase;
        margin-bottom: 12px;
        background: linear-gradient(135deg, #ffffff 40%, #cbd5e1 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .divider-line {
        height: 2px;
        width: 140px;
        margin: 0 auto 24px;
        background: linear-gradient(90deg, transparent, #d4af37, transparent);
      }
      .presented-to {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.2em;
        color: #94a3b8;
        font-weight: 600;
        margin-bottom: 12px;
      }
      .recipient-name {
        font-family: 'Playfair Display', serif;
        font-size: clamp(32px, 5.5vw, 46px);
        font-weight: 600;
        color: #fef08a;
        margin-bottom: 16px;
        letter-spacing: 0.02em;
        text-shadow: 0 2px 10px rgba(254, 240, 138, 0.2);
      }
      .cert-text {
        font-size: 14px;
        color: #94a3b8;
        max-width: 620px;
        margin: 0 auto 16px;
        line-height: 1.6;
      }
      .skill-pill {
        display: inline-block;
        padding: 8px 22px;
        background: rgba(99, 102, 241, 0.12);
        border: 1px solid rgba(129, 140, 248, 0.35);
        color: #c7d2fe;
        font-size: 16px;
        font-weight: 700;
        border-radius: 999px;
        margin-bottom: 38px;
      }
      .footer-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        border-top: 1px solid rgba(212, 175, 55, 0.25);
        padding-top: 24px;
        margin-top: 12px;
      }
      .sign-block {
        text-align: left;
      }
      .signature-img {
        font-family: 'Playfair Display', cursive;
        font-size: 22px;
        font-style: italic;
        color: #cbd5e1;
        margin-bottom: 4px;
      }
      .sign-title {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: #94a3b8;
      }
      .seal-block {
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .gold-seal {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        background: radial-gradient(circle, #fce080 0%, #b8860b 80%, #7d5700 100%);
        border: 2px dashed #3a2500;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 18px rgba(212, 175, 55, 0.35);
        color: #3b2502;
        font-family: 'Cinzel', serif;
        font-size: 9px;
        font-weight: 900;
        text-align: center;
        letter-spacing: 0.05em;
        padding: 4px;
        line-height: 1.1;
      }
      .meta-block {
        text-align: right;
      }
      .meta-id {
        font-family: monospace;
        font-size: 11px;
        font-weight: 700;
        color: #cbd5e1;
      }
      .meta-date {
        font-size: 11px;
        color: #94a3b8;
        margin-top: 3px;
      }
      .qr-thumb {
        width: 48px;
        height: 48px;
        border-radius: 6px;
        background: white;
        padding: 2px;
        margin-top: 6px;
        display: inline-block;
      }

      @media print {
        body { background: white; padding: 0; color: black; }
        .actions-bar { display: none; }
        .certificate-container {
          box-shadow: none;
          max-width: 100%;
          border: 3px solid #b8860b !important;
          background: #ffffff !important;
          color: #000000 !important;
        }
        .cert-inner-frame {
          background: #ffffff !important;
          border-color: #b8860b !important;
        }
        .cert-title, .brand-title, .recipient-name, .skill-pill {
          -webkit-text-fill-color: initial !important;
          color: #000000 !important;
        }
        .recipient-name { color: #854d0e !important; }
        .cert-text, .presented-to, .sign-title, .meta-date { color: #475569 !important; }
        .meta-id { color: #000000 !important; }
      }

      @media (max-width: 640px) {
        .cert-inner-frame { padding: 32px 18px; }
        .footer-row { flex-direction: column; align-items: center; gap: 20px; text-align: center; }
        .sign-block, .meta-block { text-align: center; }
      }
    </style>
  </head>
  <body>
    <div class="actions-bar">
      <div class="badge-verified">Verified Credential</div>
      <button class="btn-print" onclick="window.print()">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
        Print / Save PDF
      </button>
    </div>

    <main class="certificate-container">
      <div class="cert-inner-frame">
        <div class="corner corner-tl"></div>
        <div class="corner corner-tr"></div>
        <div class="corner corner-bl"></div>
        <div class="corner corner-br"></div>

        <div class="brand-title">Orbitus Skill Exchange</div>
        <h1 class="cert-title">Certificate of Skill Mastery</h1>
        <div class="divider-line"></div>

        <p class="presented-to">This is proudly awarded to</p>
        <h2 class="recipient-name">${escapeHtml(recipientName)}</h2>

        <p class="cert-text">
          for successfully demonstrating proficiency and completing verified peer-to-peer mentoring exchange in
        </p>

        <div class="skill-pill">
          ${escapeHtml(skillName)} <span style="opacity:0.6;font-weight:400;font-size:13px;">• ${escapeHtml(skillCategory)}</span>
        </div>

        <div class="footer-row">
          <div class="sign-block">
            <div class="signature-img">Orbitus Academic Council</div>
            <div class="sign-title">Peer Verification Authority</div>
          </div>

          <div class="seal-block">
            <div class="gold-seal">
              ORBITUS<br>VERIFIED<br>SKILL
            </div>
          </div>

          <div class="meta-block">
            <div class="meta-id">ID: ${certId}</div>
            <div class="meta-date">Issued: ${escapeHtml(issueDate)}</div>
            ${qrCode ? `<img src="${escapeHtml(qrCode)}" alt="QR" class="qr-thumb" />` : ''}
          </div>
        </div>
      </div>
    </main>
  </body>
</html>`;
};

export const verifyCertificate = asyncHandler(async (req, res) => {
  const certificate = await Certificate.findOne({ uniqueId: req.params.uniqueId })
    .populate('recipient', 'name profileImage')
    .populate('skill', 'name category');

  if (!certificate) {
    throw new ApiError(404, 'Certificate not found');
  }

  const acceptsHtml = req.get('accept')?.includes('text/html');
  if (acceptsHtml && req.accepts(['html', 'json']) === 'html') {
    return res.status(200).type('html').send(renderCertificateVerificationPage(certificate));
  }

  return res.status(200).json(
    new ApiResponse(200, { certificate }, 'Certificate verified')
  );
});
