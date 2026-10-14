const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

export const renderCertificateVerificationPage = (certificate) => {
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
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 700;
        font-size: 18px;
        color: #fff;
        text-decoration: none;
      }
      .brand span {
        background: linear-gradient(135deg, #6366f1, #a855f7);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .btn-print {
        background: #1e293b;
        color: #f8fafc;
        border: 1px solid #334155;
        padding: 8px 18px;
        border-radius: 9999px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .cert-frame {
        width: 100%;
        max-width: 900px;
        background: #0a0e17;
        border: 8px solid #1e293b;
        border-radius: 20px;
        padding: 48px;
        position: relative;
        box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7);
        text-align: center;
      }
      .cert-title {
        font-family: 'Cinzel', serif;
        font-size: 28px;
        font-weight: 800;
        letter-spacing: 2px;
        color: #f7df87;
        margin-bottom: 12px;
      }
      .presented-to {
        font-size: 14px;
        color: #94a3b8;
        margin-top: 24px;
        text-transform: uppercase;
        letter-spacing: 1.5px;
      }
      .recipient-name {
        font-family: 'Playfair Display', Georgia, serif;
        font-size: 38px;
        color: #fff;
        margin: 8px 0 16px;
      }
      .cert-text {
        font-size: 15px;
        color: #cbd5e1;
        max-width: 650px;
        margin: 0 auto 20px;
        line-height: 1.6;
      }
      .skill-pill {
        display: inline-block;
        background: rgba(99, 102, 241, 0.15);
        border: 1px solid rgba(99, 102, 241, 0.35);
        color: #a5b4fc;
        padding: 8px 24px;
        border-radius: 9999px;
        font-size: 16px;
        font-weight: 700;
        margin-bottom: 36px;
      }
      .footer-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 36px;
        padding-top: 24px;
        border-top: 1px solid #1e293b;
      }
      .sign-title, .meta-id, .meta-date {
        font-size: 12px;
        color: #64748b;
      }
      .signature-img {
        font-family: 'Playfair Display', cursive;
        font-size: 18px;
        color: #cbd5e1;
      }
      .gold-seal {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        border: 2px dashed #d4af37;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Cinzel', serif;
        font-size: 10px;
        color: #d4af37;
        font-weight: 700;
      }
      .qr-thumb {
        width: 60px;
        height: 60px;
        border-radius: 8px;
        margin-top: 6px;
      }
      @media print {
        body { background: #fff; color: #000; padding: 0; }
        .actions-bar { display: none; }
        .cert-frame { border: 4px solid #000; box-shadow: none; }
        .recipient-name { color: #000; }
        .cert-title { color: #996515; }
      }
    </style>
  </head>
  <body>
    <div class="actions-bar">
      <a href="/" class="brand">✦ <span>Orbitus</span></a>
      <button class="btn-print" onclick="window.print()">Print Certificate</button>
    </div>
    <main class="cert-frame">
      <h1 class="cert-title">Certificate of Skill Mastery</h1>
      <p class="presented-to">This is proudly awarded to</p>
      <h2 class="recipient-name">${escapeHtml(recipientName)}</h2>
      <p class="cert-text">for successfully demonstrating proficiency and completing verified peer-to-peer mentoring exchange in</p>
      <div class="skill-pill">
        ${escapeHtml(skillName)} <span style="opacity:0.6;font-weight:400;font-size:13px;">• ${escapeHtml(skillCategory)}</span>
      </div>
      <div class="footer-row">
        <div class="sign-block">
          <div class="signature-img">Orbitus Academic Council</div>
          <div class="sign-title">Peer Verification Authority</div>
        </div>
        <div class="seal-block">
          <div class="gold-seal">ORBITUS<br>VERIFIED<br>SKILL</div>
        </div>
        <div class="meta-block">
          <div class="meta-id">ID: ${certId}</div>
          <div class="meta-date">Issued: ${escapeHtml(issueDate)}</div>
          ${qrCode ? `<img src="${escapeHtml(qrCode)}" alt="QR" class="qr-thumb" />` : ''}
        </div>
      </div>
    </main>
  </body>
</html>`;
};

export default renderCertificateVerificationPage;
