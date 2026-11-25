const params = new URLSearchParams(location.search);
const rule = window.ROLEPLAY_RULES.find((item) => item.id === params.get('doc')) || window.ROLEPLAY_RULES[0];
document.title = `${rule.title} | RP Judiciary`;
document.querySelector('#doc-category').textContent = `${rule.category} · ROLEPLAY ADAPTATION`;
document.querySelector('#doc-title').textContent = rule.title;
document.querySelector('#doc-number').textContent = `A.M. No. ${rule.number}`;

function makePdf() {
  if (!window.jspdf?.jsPDF) {
    document.querySelector('#viewer-fallback').hidden = false;
    return;
  }
  const pdf = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' });
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();
  const margin = 24;
  let y = 24;
  const addParagraph = (text, fontSize = 11, bold = false, gap = 7) => {
    pdf.setFont('times', bold ? 'bold' : 'normal');
    pdf.setFontSize(fontSize);
    const lines = pdf.splitTextToSize(text, width - margin * 2);
    const needed = lines.length * (fontSize * 0.48) + gap;
    if (y + needed > height - 23) { pdf.addPage(); y = 24; }
    pdf.text(lines, width / 2, y, { align: 'center' });
    y += needed;
  };
  pdf.setDrawColor(105, 78, 105);
  pdf.setLineWidth(.5);
  pdf.rect(13, 13, width - 26, height - 26);
  addParagraph('REPUBLIC OF THE PHILIPPINES — ROLEPLAY JUDICIARY', 11, true, 5);
  addParagraph('FICTIONAL DOCUMENT · FOR ROLEPLAY PURPOSES ONLY', 9, true, 17);
  addParagraph(rule.category.toUpperCase(), 10, true, 8);
  addParagraph(`A.M. No. ${rule.number}`, 11, true, 10);
  addParagraph(rule.title.toUpperCase(), 14, true, 12);
  addParagraph('ROLEPLAY ADAPTATION — NOT AN OFFICIAL ISSUANCE', 9, true, 16);
  addParagraph(rule.intro, 11, false, 15);
  rule.sections.forEach((section, index) => {
    if (index % 2 === 0) addParagraph(`SECTION ${Math.floor(index / 2) + 1}. ${section}.`, 11, true, 5);
    else addParagraph(section, 11, false, 12);
  });
  y += 12;
  addParagraph('This document is an original, simplified fictional adaptation. It is not legal advice, does not reproduce an official rule in full, and has no force in real proceedings.', 9, false, 0);
  const blob = pdf.output('blob');
  const url = URL.createObjectURL(blob);
  document.querySelector('#pdf-viewer').src = url;
  const link = document.querySelector('#download-pdf');
  link.href = url;
  link.download = `${rule.id}-roleplay.pdf`;
}
makePdf();
