import ExcelJS from 'exceljs';
import { sanitizeForExcel } from '../shared/contratosSchema.js';

export interface ExportContratoItem {
  id?: string;
  codigo_contrato?: string;
  titulo_contrato?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  importe_contrato?: number;
  moneda?: string;
  estatus_contrato?: string;
  rfc_proveedor?: string;
  nombre_proveedor?: string;
  siglas_institucion?: string;
  nombre_institucion?: string;
  tipo_procedimiento?: string;
  direccion_anuncio?: string;
  year_file?: number;
  [key: string]: any;
}

export async function exportContratosToExcel(
  items: ExportContratoItem[],
  filename: string = 'Contratos_APF_Consulta.xlsx',
  sheetTitle: string = 'Contratos APF'
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'EXPLORADOR DE CONTRATOS APF';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(sheetTitle, {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  // Definición de columnas
  worksheet.columns = [
    { header: 'Año', key: 'year_file', width: 8 },
    { header: 'Código del Contrato', key: 'codigo_contrato', width: 22 },
    { header: 'RFC Proveedor', key: 'rfc_proveedor', width: 16 },
    { header: 'Nombre o Razón Social', key: 'nombre_proveedor', width: 38 },
    { header: 'Siglas Dependencia', key: 'siglas_institucion', width: 15 },
    { header: 'Institución / Secretaría', key: 'nombre_institucion', width: 34 },
    { header: 'Importe del Contrato', key: 'importe_contrato', width: 20 },
    { header: 'Moneda', key: 'moneda', width: 10 },
    { header: 'Estatus', key: 'estatus_contrato', width: 16 },
    { header: 'Fecha Inicio', key: 'fecha_inicio', width: 14 },
    { header: 'Fecha Fin', key: 'fecha_fin', width: 14 },
    { header: 'Tipo de Procedimiento', key: 'tipo_procedimiento', width: 26 },
    { header: 'Título del Contrato', key: 'titulo_contrato', width: 45 },
    { header: 'Enlace Oficial del Anuncio', key: 'direccion_anuncio', width: 35 },
  ];

  // Estilo institucional de cabecera (Azul pizarra profundo y texto blanco)
  const headerRow = worksheet.getRow(1);
  headerRow.height = 26;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' },
    };
    cell.font = {
      name: 'Arial',
      size: 10,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'left',
    };
  });

  // Agregar filas sanitizadas contra inyección de fórmulas
  items.forEach((item, index) => {
    const row = worksheet.addRow({
      year_file: item.year_file || '',
      codigo_contrato: sanitizeForExcel(item.codigo_contrato || ''),
      rfc_proveedor: sanitizeForExcel(item.rfc_proveedor || ''),
      nombre_proveedor: sanitizeForExcel(item.nombre_proveedor || ''),
      siglas_institucion: sanitizeForExcel(item.siglas_institucion || ''),
      nombre_institucion: sanitizeForExcel(item.nombre_institucion || ''),
      importe_contrato: typeof item.importe_contrato === 'number' ? item.importe_contrato : 0,
      moneda: sanitizeForExcel(item.moneda || 'MXN'),
      estatus_contrato: sanitizeForExcel(item.estatus_contrato || ''),
      fecha_inicio: sanitizeForExcel(item.fecha_inicio || ''),
      fecha_fin: sanitizeForExcel(item.fecha_fin || ''),
      tipo_procedimiento: sanitizeForExcel(item.tipo_procedimiento || ''),
      titulo_contrato: sanitizeForExcel(item.titulo_contrato || ''),
      direccion_anuncio: sanitizeForExcel(item.direccion_anuncio || ''),
    });

    row.height = 20;

    // Formato de moneda para la columna Importe
    const importeCell = row.getCell('importe_contrato');
    importeCell.numFmt = '$#,##0.00';
    importeCell.alignment = { horizontal: 'right', vertical: 'middle' };

    // Formato alternante (zebra)
    if (index % 2 === 1) {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' },
        };
      });
    }

    // Bordes sutiles
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
      cell.alignment = { vertical: 'middle', ...cell.alignment };
    });
  });

  // Generar buffer y descargar en el navegador
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

export async function exportNotFoundListToExcel(
  items: Array<{ name?: string; rfc?: string }>,
  filename: string = 'Terminos_Sin_Coincidencias_APF.xlsx'
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'EXPLORADOR DE CONTRATOS APF';

  const worksheet = workbook.addWorksheet('Sin Coincidencias', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  worksheet.columns = [
    { header: '#', key: 'num', width: 6 },
    { header: 'RFC Buscado', key: 'rfc', width: 20 },
    { header: 'Nombre / Razón Social Buscada', key: 'name', width: 45 },
    { header: 'Resultado', key: 'status', width: 25 },
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.height = 25;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF991B1B' }, // Rojo oscuro elegante
    };
    cell.font = {
      name: 'Arial',
      size: 10,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    cell.alignment = { vertical: 'middle' };
  });

  items.forEach((item, idx) => {
    const row = worksheet.addRow({
      num: idx + 1,
      rfc: sanitizeForExcel(item.rfc || ''),
      name: sanitizeForExcel(item.name || ''),
      status: 'Sin contratos registrados',
    });
    row.height = 20;
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
      cell.alignment = { vertical: 'middle' };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.URL.revokeObjectURL(url);
}
