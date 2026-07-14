/**
 * PDF Report Generator using jsPDF + jspdf-autotable.
 * Generates a premium-styled phishing analysis report.
 */

const FEATURE_LABELS = [
  'URL Length (chars)',
  'At Symbol (@) count',
  'Double Slash (//) Redirects',
  'Hyphen Count in Domain',
  'Subdomain Nesting Level',
  'HTTPS Token in Domain',
  'IP Address as Host',
  'URL Shortening Service',
  'Suspicious Keyword Count',
  'Non-Standard Port',
  'Suspicious TLD Index',
  'Special Character Ratio'
];

const FEATURE_THRESHOLDS = [
  { safe: 54, danger: 75 },
  { safe: 0, danger: 0 },
  { safe: 0, danger: 0 },
  { safe: 0, danger: 0 },
  { safe: 0, danger: 2 },
  { safe: 0, danger: 0 },
  { safe: 0, danger: 0 },
  { safe: 0, danger: 0 },
  { safe: 0, danger: 1 },
  { safe: 0, danger: 0 },
  { safe: 0, danger: 0 },
  { safe: 0.08, danger: 0.15 },
];

function getFeatureStatus(value, index) {
  const { safe, danger } = FEATURE_THRESHOLDS[index];
  if (index === 11) {
    // ratio: use float comparison
    if (value > 0.15) return 'HIGH RISK';
    if (value > 0.08) return 'WARNING';
    return 'SAFE';
  }
  if (value > danger) return 'HIGH RISK';
  if (value > safe) return 'WARNING';
  return 'SAFE';
}

function getRiskLabel(risk) {
  switch (risk) {
    case 'danger': return 'DANGEROUS / PHISHING';
    case 'warning': return 'SUSPICIOUS / WARNING';
    default: return 'SECURE / LEGITIMATE';
  }
}

function getRiskRgb(risk) {
  switch (risk) {
    case 'danger': return [244, 63, 94];
    case 'warning': return [234, 179, 8];
    default: return [16, 185, 129];
  }
}

export async function generatePDFReport(scanResult) {
  const { jsPDF } = await import('jspdf');
  await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  const riskRgb = getRiskRgb(scanResult.risk);
  const timestamp = new Date().toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });

  // ─── HEADER BLOCK ───────────────────────────────────────────────────────────
  // Dark background header
  doc.setFillColor(7, 9, 19);
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Accent gradient bar
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, pageWidth, 2.5, 'F');

  // Logo text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(248, 250, 252);
  doc.text('PHISH', margin, 18);
  doc.setTextColor(59, 130, 246);
  doc.text('.AI', margin + 33, 18);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('CYBER THREAT INTELLIGENCE // URL SAFETY ANALYSIS REPORT', margin, 25);

  // Report date on right
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${timestamp}`, pageWidth - margin, 25, { align: 'right' });

  // ─── RISK VERDICT BANNER ───────────────────────────────────────────────────
  doc.setFillColor(...riskRgb);
  doc.roundedRect(margin, 50, contentWidth, 20, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(`VERDICT: ${getRiskLabel(scanResult.risk)}`, margin + 8, 62);

  const probabilityText = `Risk Score: ${(scanResult.probability * 100).toFixed(2)}%`;
  doc.setFontSize(10);
  doc.text(probabilityText, pageWidth - margin - 8, 62, { align: 'right' });

  // ─── TARGET URL SECTION ────────────────────────────────────────────────────
  let y = 82;

  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'F');
  doc.setDrawColor(30, 41, 59);
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('TARGET URL', margin + 6, y + 7);

  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(96, 165, 250);

  // Wrap long URLs
  const urlLines = doc.splitTextToSize(scanResult.url, contentWidth - 12);
  doc.text(urlLines[0], margin + 6, y + 15);
  if (urlLines.length > 1) {
    doc.text('...', margin + 6, y + 15);
  }

  // ─── ML MODEL METRICS ─────────────────────────────────────────────────────
  y = 114;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(248, 250, 252);
  doc.text('MACHINE LEARNING ANALYSIS', margin, y);

  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.5);
  doc.line(margin, y + 2, margin + contentWidth, y + 2);

  y += 10;

  // Metric boxes (3 in a row)
  const metricBoxW = (contentWidth - 8) / 3;
  const metricsData = [
    { label: 'PHISHING PROBABILITY', value: `${(scanResult.probability * 100).toFixed(2)}%`, color: riskRgb },
    { label: 'ML CLASSIFIER', value: 'Logistic Regression', color: [59, 130, 246] },
    { label: 'PROTOCOL', value: scanResult.url.startsWith('https') ? 'HTTPS (Encrypted)' : 'HTTP (Unsecured)', color: scanResult.url.startsWith('https') ? [16, 185, 129] : [244, 63, 94] }
  ];

  metricsData.forEach((m, i) => {
    const bx = margin + i * (metricBoxW + 4);
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(bx, y, metricBoxW, 22, 2, 2, 'F');
    doc.setDrawColor(30, 41, 59);
    doc.roundedRect(bx, y, metricBoxW, 22, 2, 2, 'S');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(m.label, bx + metricBoxW / 2, y + 7, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...m.color);
    const valLines = doc.splitTextToSize(m.value, metricBoxW - 4);
    doc.text(valLines[0], bx + metricBoxW / 2, y + 16, { align: 'center' });
  });

  // ─── FEATURE ANALYSIS TABLE ───────────────────────────────────────────────
  y += 34;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(248, 250, 252);
  doc.text('URL FEATURE DISSECTION', margin, y);

  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.5);
  doc.line(margin, y + 2, margin + contentWidth, y + 2);

  y += 6;

  const tableRows = scanResult.features.map((val, i) => {
    const status = getFeatureStatus(val, i);
    const displayVal = i === 11 ? `${(val * 100).toFixed(2)}%` : String(val);
    return [
      `${String(i + 1).padStart(2, '0')}`,
      FEATURE_LABELS[i],
      displayVal,
      status
    ];
  });

  doc.autoTable({
    startY: y,
    head: [['#', 'Feature / Heuristic', 'Extracted Value', 'Risk Assessment']],
    body: tableRows,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      fillColor: [15, 23, 42],
      textColor: [248, 250, 252],
      lineColor: [30, 41, 59],
      lineWidth: 0.3
    },
    headStyles: {
      fillColor: [13, 17, 32],
      textColor: [148, 163, 184],
      fontStyle: 'bold',
      fontSize: 7.5
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center', textColor: [100, 116, 139] },
      1: { cellWidth: 80 },
      2: { cellWidth: 32, halign: 'center', font: 'courier' },
      3: {
        cellWidth: 40,
        halign: 'center',
        fontStyle: 'bold'
      }
    },
    didParseCell: (data) => {
      if (data.column.index === 3 && data.section === 'body') {
        const v = data.cell.raw;
        if (v === 'HIGH RISK') {
          data.cell.styles.textColor = [244, 63, 94];
        } else if (v === 'WARNING') {
          data.cell.styles.textColor = [234, 179, 8];
        } else {
          data.cell.styles.textColor = [52, 211, 153];
        }
      }
    },
    alternateRowStyles: {
      fillColor: [18, 26, 48]
    }
  });

  // ─── EXPLANATION BOX ──────────────────────────────────────────────────────
  const afterTableY = doc.lastAutoTable.finalY + 10;

  if (afterTableY < pageHeight - 50) {
    doc.setFillColor(scanResult.risk === 'danger' ? 20 : scanResult.risk === 'warning' ? 20 : 13,
                     scanResult.risk === 'danger' ? 5 : scanResult.risk === 'warning' ? 14 : 26,
                     scanResult.risk === 'danger' ? 9 : scanResult.risk === 'warning' ? 2 : 25);
    doc.roundedRect(margin, afterTableY, contentWidth, 26, 2, 2, 'F');
    doc.setDrawColor(...riskRgb);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, afterTableY, contentWidth, 26, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...riskRgb);
    doc.text('THREAT ANALYSIS SUMMARY', margin + 6, afterTableY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(203, 213, 225);

    let summaryText = '';
    if (scanResult.risk === 'danger') {
      summaryText = 'WARNING: Multiple high-risk indicators have been detected. This URL exhibits strong characteristics of phishing or social engineering. Key concerns include suspicious TLD usage, misleading subdomains, or known brand impersonation. DO NOT enter any personal credentials or sensitive information on this site.';
    } else if (scanResult.risk === 'warning') {
      summaryText = 'CAUTION: This URL contains features that deviate from standard safe patterns. Some heuristics are elevated but do not conclusively indicate malicious intent. Exercise caution. Verify the site identity through official channels before submitting any personal data.';
    } else {
      summaryText = 'SAFE: The URL features conform to standard legitimate website formatting. No high-risk structural anomalies were detected. Protocol is encrypted and domain structure is within safe parameters. However, always verify the site content independently for sensitive operations.';
    }

    const summaryLines = doc.splitTextToSize(summaryText, contentWidth - 12);
    doc.text(summaryLines, margin + 6, afterTableY + 16);
  }

  // ─── FOOTER ───────────────────────────────────────────────────────────────
  const footerY = pageHeight - 12;
  doc.setFillColor(7, 9, 19);
  doc.rect(0, footerY - 6, pageWidth, 18, 'F');

  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('PHISH.AI // Cyber Threat Intelligence Dashboard — AI-Powered Phishing Detection', margin, footerY);
  doc.text('This report was generated automatically. Results are based on ML heuristics and are for educational purposes only.', margin, footerY + 4);
  doc.text(`Page 1 of 1`, pageWidth - margin, footerY, { align: 'right' });

  // ─── SAVE ─────────────────────────────────────────────────────────────────
  const safeUrl = scanResult.url.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40);
  const filename = `PhishAI_Report_${safeUrl}_${Date.now()}.pdf`;
  doc.save(filename);

  return filename;
}
