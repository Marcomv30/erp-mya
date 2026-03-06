export interface ReportColumn<T> {
  key: string;
  title: string;
  getValue: (row: T) => string | number | null | undefined;
}

function escapeCsv(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function formatMoneyCRC(value: number): string {
  return Number(value || 0).toLocaleString('es-CR', { minimumFractionDigits: 2 });
}

export function buildCsv<T>(rows: T[], columns: ReportColumn<T>[]): string {
  const header = columns.map((c) => c.title).join(',');
  const body = rows.map((row) =>
    columns
      .map((col) => escapeCsv(String(col.getValue(row) ?? '')))
      .join(',')
  );
  return [header, ...body].join('\n');
}

export function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportCsv<T>(filename: string, rows: T[], columns: ReportColumn<T>[]) {
  const csv = buildCsv(rows, columns);
  downloadTextFile(filename, csv, 'text/csv;charset=utf-8;');
}

export function exportExcelXml<T>(filename: string, rows: T[], columns: ReportColumn<T>[]) {
  const headers = columns.map((c) => `<Cell><Data ss:Type="String">${escapeHtml(c.title)}</Data></Cell>`).join('');
  const rowsXml = rows
    .map((row) => {
      const cells = columns.map((c) => {
        const raw = c.getValue(row);
        const value = raw == null ? '' : String(raw);
        const isNumber = /^-?\d+(\.\d+)?$/.test(value.trim());
        const type = isNumber ? 'Number' : 'String';
        return `<Cell><Data ss:Type="${type}">${escapeHtml(value)}</Data></Cell>`;
      }).join('');
      return `<Row>${cells}</Row>`;
    })
    .join('');

  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
  <Worksheet ss:Name="Reporte">
    <Table>
      <Row>${headers}</Row>
      ${rowsXml}
    </Table>
  </Worksheet>
</Workbook>`;

  downloadTextFile(filename, xml, 'application/vnd.ms-excel;charset=utf-8;');
}

export function exportPdfWithPrint<T>(params: {
  title: string;
  subtitle?: string;
  rows: T[];
  columns: ReportColumn<T>[];
  summaryLines?: string[];
}) {
  const { title, subtitle, rows, columns, summaryLines = [] } = params;
  const dateNow = new Date().toLocaleString('es-CR');

  const thead = columns.map((c) => `<th>${escapeHtml(c.title)}</th>`).join('');
  const tbody = rows
    .map((row) => {
      const tds = columns
        .map((col) => `<td>${escapeHtml(String(col.getValue(row) ?? ''))}</td>`)
        .join('');
      return `<tr>${tds}</tr>`;
    })
    .join('');

  const summaryHtml = summaryLines.length
    ? `<div class="summary">${summaryLines.map((s) => `<div>${escapeHtml(s)}</div>`).join('')}</div>`
    : '';

  const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; color: #0f172a; }
    h1 { margin: 0 0 4px; font-size: 20px; }
    .sub { margin-bottom: 6px; color: #475569; font-size: 12px; }
    .meta { margin-bottom: 14px; color: #64748b; font-size: 11px; }
    .summary { margin: 10px 0 14px; font-size: 12px; }
    .summary div { margin-bottom: 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; vertical-align: top; }
    th { background: #f8fafc; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  ${subtitle ? `<div class="sub">${escapeHtml(subtitle)}</div>` : ''}
  <div class="meta">Generado: ${escapeHtml(dateNow)}</div>
  ${summaryHtml}
  <table>
    <thead><tr>${thead}</tr></thead>
    <tbody>${tbody || '<tr><td colspan="99">Sin datos</td></tr>'}</tbody>
  </table>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=1200,height=780');
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
  setTimeout(() => {
    win.focus();
    win.print();
  }, 350);
}
