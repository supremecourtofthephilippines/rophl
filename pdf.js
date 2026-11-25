const params = new URLSearchParams(location.search);
const rule = window.ROLEPLAY_RULES.find((item) => item.id === params.get('doc'));

if (!rule) {
  document.body.textContent = 'Document not found. Return to the Rules of Court index.';
} else {
  document.title = `${rule.title} — Roleplay PDF`;

  // Build a small self-contained PDF so the browser opens the document itself,
  // rather than showing an HTML document page first.
  const clean = (value) => String(value)
    .replace(/[’‘]/g, "'").replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-').replace(/…/g, '...')
    .replace(/[^\x20-\x7E]/g, '');
  const escapePdf = (value) => clean(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  const wrap = (text, max = 88) => {
    const words = clean(text).split(/\s+/);
    const lines = [];
    let line = '';
    for (const word of words) {
      if (line && `${line} ${word}`.length > max) { lines.push(line); line = word; }
      else line = line ? `${line} ${word}` : word;
    }
    if (line) lines.push(line);
    return lines;
  };

  const pageLines = [[]];
  let current = pageLines[0];
  const add = (text, style = 'body', gap = 17) => {
    const chunks = wrap(text, style === 'title' ? 54 : 88);
    for (const line of chunks) {
      if (current.length >= 44) { current = []; pageLines.push(current); }
      current.push({ text: line, style });
    }
    if (gap && current.length < 45) current.push({ text: '', style: 'gap' });
  };

  add('REPUBLIC OF THE PHILIPPINES — ROLEPLAY JUDICIARY', 'institution', 8);
  add('FICTIONAL DOCUMENT | FOR ROLEPLAY PURPOSES ONLY', 'notice', 28);
  add(rule.category.toUpperCase(), 'section', 18);
  add(`A.M. No. ${rule.number}`, 'case', 18);
  add(rule.title.toUpperCase(), 'title', 8);
  add('ROLEPLAY ADAPTATION — NOT AN OFFICIAL ISSUANCE', 'notice', 25);
  add(rule.intro, 'body', 20);
  rule.sections.forEach((section, index) => {
    if (index % 2 === 0) add(`SECTION ${Math.floor(index / 2) + 1}. ${section}.`, 'heading', 5);
    else add(section, 'body', 17);
  });
  add('This document is an original, simplified fictional adaptation. It is not legal advice, does not reproduce an official rule in full, and has no force in real proceedings.', 'disclaimer', 0);

  const objects = [];
  const addObject = (text) => { objects.push(text); return objects.length; };
  const catalogId = addObject('');
  const pagesId = addObject('');
  const fontRegularId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>');
  const fontBoldId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold >>');
  const pageIds = [];

  pageLines.forEach((lines, pageIndex) => {
    let y = 755;
    let commands = '0.55 w 54 42 487 708 re S\n';
    commands += 'BT /F2 9 Tf 0.35 g 72 725 Td (ROLEPLAY REFERENCE - NOT AN OFFICIAL COURT ISSUANCE) Tj ET\n';
    for (const item of lines) {
      if (item.style === 'gap') { y -= 8; continue; }
      const config = {
        institution: { font: 'F2', size: 12, color: '0 g', x: 297, align: true },
        notice: { font: 'F2', size: 9, color: '0.35 g', x: 297, align: true },
        section: { font: 'F2', size: 11, color: '0 g', x: 297, align: true },
        case: { font: 'F2', size: 11, color: '0 g', x: 297, align: true },
        title: { font: 'F2', size: 14, color: '0 g', x: 297, align: true },
        heading: { font: 'F2', size: 11, color: '0 g', x: 72, align: false },
        disclaimer: { font: 'F1', size: 9, color: '0.25 g', x: 72, align: false },
        body: { font: 'F1', size: 11, color: '0 g', x: 72, align: false }
      }[item.style];
      const text = escapePdf(item.text);
      if (config.align) {
        const estimatedWidth = item.text.length * config.size * 0.48;
        config.x = Math.max(72, (595 - estimatedWidth) / 2);
      }
      commands += `BT /${config.font} ${config.size} Tf ${config.color} ${config.x.toFixed(1)} ${y.toFixed(1)} Td (${text}) Tj ET\n`;
      y -= item.style === 'title' ? 24 : item.style === 'heading' ? 18 : 15;
    }
    commands += `BT /F1 9 Tf 0.3 g 260 27 Td (Page ${pageIndex + 1} of ${pageLines.length}) Tj ET\n`;
    const streamId = addObject(`<< /Length ${commands.length} >>\nstream\n${commands}endstream`);
    const pageId = addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${streamId} 0 R >>`);
    pageIds.push(pageId);
  });

  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;

  let pdf = '%PDF-1.4\n%RP01\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, '0')} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const pdfUrl = URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' }));
  location.replace(`${pdfUrl}#toolbar=1&navpanes=0`);
}
