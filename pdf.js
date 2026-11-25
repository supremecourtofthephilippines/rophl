const params = new URLSearchParams(location.search);
const rule = window.ROLEPLAY_RULES.find((item) => item.id === params.get('doc'));

if (!rule) {
  document.body.textContent = 'Document not found. Return to the Rules of Court index.';
} else {
  document.title = `${rule.title} — 2026 Roleplay PDF`;

  const clean = (value) => String(value)
    .replace(/[’‘]/g, "'").replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-').replace(/…/g, '...')
    .replace(/[^\x20-\x7E]/g, '');
  const escapePdf = (value) => clean(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  const wrap = (text, max = 78) => {
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
  let lineCount = 0;

  const add = (text, style = 'body') => {
    const chunks = wrap(text, style === 'title' ? 52 : 78);
    for (const line of chunks) {
      if (lineCount >= 42) {
        current = [];
        pageLines.push(current);
        lineCount = 0;
      }
      current.push({ text: line, style });
      lineCount += style === 'title' ? 2 : 1;
    }
    if (lineCount < 42) {
      if (lineCount >= 42) {
        current = [];
        pageLines.push(current);
        lineCount = 0;
      }
      current.push({ text: '', style: 'gap' });
      lineCount += 1;
    }
  };

  add('REPUBLIC OF THE PHILIPPINES - ROLEPLAY JUDICIARY', 'institution');
  add('FICTIONAL DOCUMENT - FOR 2026 ROLEPLAY PURPOSES ONLY', 'notice');
  add(rule.category.toUpperCase(), 'section');
  add(`A.M. No. ${rule.number}`, 'case');
  add(rule.title.toUpperCase(), 'title');
  add('ORIGINAL ROLEPLAY COMPILATION - NOT AN OFFICIAL ISSUANCE', 'notice');
  add(rule.intro, 'body');
  for (const section of rule.sections) {
    const heading = /^Part [IVX]+\.|^Section/i.test(section);
    add(section, heading ? 'heading' : 'body');
  }
  add('This 2026 document is an original, fictional roleplay adaptation. It is not legal advice and has no effect in real proceedings.', 'disclaimer');

  const objects = [];
  const addObject = (text) => { objects.push(text); return objects.length; };
  const catalogId = addObject('');
  const pagesId = addObject('');
  const fontRegularId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>');
  const fontBoldId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold >>');
  const pageIds = [];

  pageLines.forEach((lines, pageIndex) => {
    let y = 745;
    let commands = '0.55 w 54 42 487 708 re S\n';
    commands += 'BT /F2 9 Tf 0.35 g 72 720 Td (2026 ROLEPLAY REFERENCE - NOT AN OFFICIAL COURT ISSUANCE) Tj ET\n';
    for (const item of lines) {
      if (item.style === 'gap') { y -= 7; continue; }
      const config = {
        institution: { font: 'F2', size: 11, color: '0 g', align: true },
        notice: { font: 'F2', size: 8, color: '0.35 g', align: true },
        section: { font: 'F2', size: 10, color: '0 g', align: true },
        case: { font: 'F2', size: 11, color: '0 g', align: true },
        title: { font: 'F2', size: 13, color: '0 g', align: true },
        heading: { font: 'F2', size: 10, color: '0 g', align: false },
        disclaimer: { font: 'F1', size: 8, color: '0.25 g', align: false },
        body: { font: 'F1', size: 10, color: '0 g', align: false }
      }[item.style];
      let x = 72;
      if (config.align) {
        const estimatedWidth = item.text.length * config.size * 0.48;
        x = Math.max(72, (595 - estimatedWidth) / 2);
      }
      const text = escapePdf(item.text);
      commands += `BT /${config.font} ${config.size} Tf ${config.color} ${x.toFixed(1)} ${y.toFixed(1)} Td (${text}) Tj ET\n`;
      y -= item.style === 'title' ? 20 : item.style === 'heading' ? 16 : 13;
    }
    commands += `BT /F1 8 Tf 0.3 g 265 27 Td (Page ${pageIndex + 1} of ${pageLines.length}) Tj ET\n`;
    const streamId = addObject(`<< /Length ${commands.length} >>\nstream\n${commands}endstream`);
    const pageId = addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${streamId} 0 R >>`);
    pageIds.push(pageId);
  });

  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;

  let pdf = '%PDF-1.4\n%RP2026\n';
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
