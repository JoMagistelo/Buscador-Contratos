/**
 * Esquema oficial de 73 columnas de Contratos de la APF
 * Fuentes: CompraNet (2020-2024) y Compras MX (2025-2026)
 * Diccionarios: DD_PIC_CONTRATOS_2400703.xlsx y DD_PIC_CONTRATOS_260827.xlsx
 */

export interface ColumnaDef {
  index: number;
  id: string; // Identificador canónico único interno
  headerOriginal: string; // Encabezado original en el CSV
  etiqueta: string; // Nombre amigable para UI y reportes
  categoria: 'general' | 'financiero' | 'procedimiento' | 'proveedor' | 'convenio' | 'adicional';
  tipo: 'texto' | 'numero' | 'fecha' | 'url';
  descripcion: string;
}

/**
 * Columnas verificadas contra los CSV reales 2020-2026.
 * Los pares Moneda/Convenio modificatorio están en posiciones 45/55 y 46/56,
 * NO en las posiciones 7/13 y 9/14 de un esquema inventado.
 */
export const CSV_COLUMN_KEYS_73: string[] = [
  "Orden de gobierno",
  "Clave Ramo",
  "Descripción Ramo",
  "Tipo de Institución",
  "Clave Institución",
  "Siglas de la Institución",
  "Institución",
  "Clave de la UC",
  "Nombre de la UC",
  "Código del expediente",
  "Referencia del expediente",
  "Título del expediente",
  "Partida específica",
  "Ley",
  "Tipo Procedimiento",
  "Artículo de excepción",
  "Descripción excepción",
  "Contrato marco",
  "Compra consolidada",
  "Núm. Proc. Consolidación",
  "Nombre Proc. Consolidación",
  "Tipo Proc. Consolidación",
  "Art. EXC. Proc. Consolidación",
  "Número de procedimiento",
  "Tipo de contratación",
  "Carácter del procedimiento",
  "Forma de participación",
  "La contratación es por Caso fortuito o fuerza mayor",
  "Crédito externo",
  "Organismo financiero",
  "Clave del programa federal",
  "Clave de cartera SHCP",
  "Fecha de publicación",
  "Fecha de apertura",
  "Fecha de fallo",
  "Código del contrato",
  "Núm. del contrato",
  "Título del contrato",
  "Descripción del contrato",
  "Contrato plurianual",
  "Estatus DRC",
  "Fecha de inicio del contrato",
  "Fecha de fin del contrato",
  "Fecha de firma del contrato",
  "Importe DRC",
  "Moneda_1",
  "Convenio modificatorio_1",
  "Código Ref. Contrato",
  "Estatus Contrato",
  "Fecha firma contrato",
  "Tipo de contrato",
  "Monto sin imp./mínimo",
  "Monto mínimo con imp.",
  "Monto sin imp./máximo",
  "Monto máximo con imp.",
  "Moneda_2",
  "Convenio modificatorio_2",
  "Código Ref. último convenio",
  "Fecha fin último conv",
  "Monto sin imp./mínimo último conv",
  "Monto mínimo con imp. último conv",
  "Monto sin imp./máximo último conv",
  "Monto máximo con imp. último conv",
  "Fecha firma último conv",
  "rfc",
  "Proveedor o contratista",
  "Folio en el RUPC",
  "País de la empresa",
  "Nacionalidad proveedor o contratista",
  "Proveedor/contratista con auto registro en CompraNet",
  "Estratificación",
  "origen",
  "Dirección del anuncio"
];

/**
 * Compatible con la base compactada: el campo raw_data_json puede ser
 * un objeto legado, o una matriz compacta con 73 valores originales.
 */
export function hydrateRawData(raw: unknown): Record<string, unknown> {
  if (Array.isArray(raw)) {
    if (raw.length !== CSV_COLUMN_KEYS_73.length) {
      throw new Error('Contrato compacto inválido: se esperan 73 campos');
    }
    return Object.fromEntries(CSV_COLUMN_KEYS_73.map((key, index) => [key, raw[index]]));
  }
  if (raw && typeof raw === 'object') {
    return raw as Record<string, unknown>;
  }
  return {};
}

export const COLUMNAS_OFICIALES_73: ColumnaDef[] = [
  { index: 0, id: 'csv_0', headerOriginal: "Orden de gobierno", etiqueta: "Orden de gobierno", categoria: 'adicional', tipo: 'texto', descripcion: 'Campo oficial CSV 1/73' },
  { index: 1, id: 'csv_1', headerOriginal: "Clave Ramo", etiqueta: "Clave Ramo", categoria: 'adicional', tipo: 'numero', descripcion: 'Campo oficial CSV 2/73' },
  { index: 2, id: 'csv_2', headerOriginal: "Descripción Ramo", etiqueta: "Descripción Ramo", categoria: 'adicional', tipo: 'texto', descripcion: 'Campo oficial CSV 3/73' },
  { index: 3, id: 'csv_3', headerOriginal: "Tipo de Institución", etiqueta: "Tipo de Institución", categoria: 'adicional', tipo: 'texto', descripcion: 'Campo oficial CSV 4/73' },
  { index: 4, id: 'csv_4', headerOriginal: "Clave Institución", etiqueta: "Clave Institución", categoria: 'adicional', tipo: 'texto', descripcion: 'Campo oficial CSV 5/73' },
  { index: 5, id: 'csv_5', headerOriginal: "Siglas de la Institución", etiqueta: "Siglas de la Institución", categoria: 'adicional', tipo: 'texto', descripcion: 'Campo oficial CSV 6/73' },
  { index: 6, id: 'csv_6', headerOriginal: "Institución", etiqueta: "Institución", categoria: 'adicional', tipo: 'texto', descripcion: 'Campo oficial CSV 7/73' },
  { index: 7, id: 'csv_7', headerOriginal: "Clave de la UC", etiqueta: "Clave de la UC", categoria: 'adicional', tipo: 'texto', descripcion: 'Campo oficial CSV 8/73' },
  { index: 8, id: 'csv_8', headerOriginal: "Nombre de la UC", etiqueta: "Nombre de la UC", categoria: 'adicional', tipo: 'texto', descripcion: 'Campo oficial CSV 9/73' },
  { index: 9, id: 'csv_9', headerOriginal: "Código del expediente", etiqueta: "Código del expediente", categoria: 'procedimiento', tipo: 'texto', descripcion: 'Campo oficial CSV 10/73' },
  { index: 10, id: 'csv_10', headerOriginal: "Referencia del expediente", etiqueta: "Referencia del expediente", categoria: 'procedimiento', tipo: 'texto', descripcion: 'Campo oficial CSV 11/73' },
  { index: 11, id: 'csv_11', headerOriginal: "Título del expediente", etiqueta: "Título del expediente", categoria: 'procedimiento', tipo: 'texto', descripcion: 'Campo oficial CSV 12/73' },
  { index: 12, id: 'csv_12', headerOriginal: "Partida específica", etiqueta: "Partida específica", categoria: 'procedimiento', tipo: 'texto', descripcion: 'Campo oficial CSV 13/73' },
  { index: 13, id: 'csv_13', headerOriginal: "Ley", etiqueta: "Ley", categoria: 'procedimiento', tipo: 'texto', descripcion: 'Campo oficial CSV 14/73' },
  { index: 14, id: 'csv_14', headerOriginal: "Tipo Procedimiento", etiqueta: "Tipo Procedimiento", categoria: 'procedimiento', tipo: 'texto', descripcion: 'Campo oficial CSV 15/73' },
  { index: 15, id: 'csv_15', headerOriginal: "Artículo de excepción", etiqueta: "Artículo de excepción", categoria: 'procedimiento', tipo: 'texto', descripcion: 'Campo oficial CSV 16/73' },
  { index: 16, id: 'csv_16', headerOriginal: "Descripción excepción", etiqueta: "Descripción excepción", categoria: 'procedimiento', tipo: 'texto', descripcion: 'Campo oficial CSV 17/73' },
  { index: 17, id: 'csv_17', headerOriginal: "Contrato marco", etiqueta: "Contrato marco", categoria: 'procedimiento', tipo: 'texto', descripcion: 'Campo oficial CSV 18/73' },
  { index: 18, id: 'csv_18', headerOriginal: "Compra consolidada", etiqueta: "Compra consolidada", categoria: 'procedimiento', tipo: 'texto', descripcion: 'Campo oficial CSV 19/73' },
  { index: 19, id: 'csv_19', headerOriginal: "Núm. Proc. Consolidación", etiqueta: "Núm. Proc. Consolidación", categoria: 'procedimiento', tipo: 'texto', descripcion: 'Campo oficial CSV 20/73' },
  { index: 20, id: 'csv_20', headerOriginal: "Nombre Proc. Consolidación", etiqueta: "Nombre Proc. Consolidación", categoria: 'procedimiento', tipo: 'texto', descripcion: 'Campo oficial CSV 21/73' },
  { index: 21, id: 'csv_21', headerOriginal: "Tipo Proc. Consolidación", etiqueta: "Tipo Proc. Consolidación", categoria: 'procedimiento', tipo: 'texto', descripcion: 'Campo oficial CSV 22/73' },
  { index: 22, id: 'csv_22', headerOriginal: "Art. EXC. Proc. Consolidación", etiqueta: "Art. EXC. Proc. Consolidación", categoria: 'procedimiento', tipo: 'texto', descripcion: 'Campo oficial CSV 23/73' },
  { index: 23, id: 'csv_23', headerOriginal: "Número de procedimiento", etiqueta: "Número de procedimiento", categoria: 'procedimiento', tipo: 'texto', descripcion: 'Campo oficial CSV 24/73' },
  { index: 24, id: 'csv_24', headerOriginal: "Tipo de contratación", etiqueta: "Tipo de contratación", categoria: 'procedimiento', tipo: 'texto', descripcion: 'Campo oficial CSV 25/73' },
  { index: 25, id: 'csv_25', headerOriginal: "Carácter del procedimiento", etiqueta: "Carácter del procedimiento", categoria: 'procedimiento', tipo: 'texto', descripcion: 'Campo oficial CSV 26/73' },
  { index: 26, id: 'csv_26', headerOriginal: "Forma de participación", etiqueta: "Forma de participación", categoria: 'procedimiento', tipo: 'texto', descripcion: 'Campo oficial CSV 27/73' },
  { index: 27, id: 'csv_27', headerOriginal: "La contratación es por Caso fortuito o fuerza mayor", etiqueta: "La contratación es por Caso fortuito o fuerza mayor", categoria: 'procedimiento', tipo: 'texto', descripcion: 'Campo oficial CSV 28/73' },
  { index: 28, id: 'csv_28', headerOriginal: "Crédito externo", etiqueta: "Crédito externo", categoria: 'procedimiento', tipo: 'texto', descripcion: 'Campo oficial CSV 29/73' },
  { index: 29, id: 'csv_29', headerOriginal: "Organismo financiero", etiqueta: "Organismo financiero", categoria: 'procedimiento', tipo: 'texto', descripcion: 'Campo oficial CSV 30/73' },
  { index: 30, id: 'csv_30', headerOriginal: "Clave del programa federal", etiqueta: "Clave del programa federal", categoria: 'procedimiento', tipo: 'texto', descripcion: 'Campo oficial CSV 31/73' },
  { index: 31, id: 'csv_31', headerOriginal: "Clave de cartera SHCP", etiqueta: "Clave de cartera SHCP", categoria: 'procedimiento', tipo: 'texto', descripcion: 'Campo oficial CSV 32/73' },
  { index: 32, id: 'csv_32', headerOriginal: "Fecha de publicación", etiqueta: "Fecha de publicación", categoria: 'procedimiento', tipo: 'fecha', descripcion: 'Campo oficial CSV 33/73' },
  { index: 33, id: 'csv_33', headerOriginal: "Fecha de apertura", etiqueta: "Fecha de apertura", categoria: 'procedimiento', tipo: 'fecha', descripcion: 'Campo oficial CSV 34/73' },
  { index: 34, id: 'csv_34', headerOriginal: "Fecha de fallo", etiqueta: "Fecha de fallo", categoria: 'procedimiento', tipo: 'fecha', descripcion: 'Campo oficial CSV 35/73' },
  { index: 35, id: 'csv_35', headerOriginal: "Código del contrato", etiqueta: "Código del contrato", categoria: 'general', tipo: 'texto', descripcion: 'Campo oficial CSV 36/73' },
  { index: 36, id: 'csv_36', headerOriginal: "Núm. del contrato", etiqueta: "Núm. del contrato", categoria: 'general', tipo: 'texto', descripcion: 'Campo oficial CSV 37/73' },
  { index: 37, id: 'csv_37', headerOriginal: "Título del contrato", etiqueta: "Título del contrato", categoria: 'general', tipo: 'texto', descripcion: 'Campo oficial CSV 38/73' },
  { index: 38, id: 'csv_38', headerOriginal: "Descripción del contrato", etiqueta: "Descripción del contrato", categoria: 'general', tipo: 'texto', descripcion: 'Campo oficial CSV 39/73' },
  { index: 39, id: 'csv_39', headerOriginal: "Contrato plurianual", etiqueta: "Contrato plurianual", categoria: 'general', tipo: 'texto', descripcion: 'Campo oficial CSV 40/73' },
  { index: 40, id: 'csv_40', headerOriginal: "Estatus DRC", etiqueta: "Estatus DRC", categoria: 'general', tipo: 'texto', descripcion: 'Campo oficial CSV 41/73' },
  { index: 41, id: 'csv_41', headerOriginal: "Fecha de inicio del contrato", etiqueta: "Fecha de inicio del contrato", categoria: 'general', tipo: 'fecha', descripcion: 'Campo oficial CSV 42/73' },
  { index: 42, id: 'csv_42', headerOriginal: "Fecha de fin del contrato", etiqueta: "Fecha de fin del contrato", categoria: 'general', tipo: 'fecha', descripcion: 'Campo oficial CSV 43/73' },
  { index: 43, id: 'csv_43', headerOriginal: "Fecha de firma del contrato", etiqueta: "Fecha de firma del contrato", categoria: 'general', tipo: 'fecha', descripcion: 'Campo oficial CSV 44/73' },
  { index: 44, id: 'csv_44', headerOriginal: "Importe DRC", etiqueta: "Importe DRC", categoria: 'financiero', tipo: 'numero', descripcion: 'Campo oficial CSV 45/73' },
  { index: 45, id: 'moneda_contrato', headerOriginal: "Moneda", etiqueta: "Moneda (DRC)", categoria: 'convenio', tipo: 'texto', descripcion: 'Campo oficial CSV 46/73' },
  { index: 46, id: 'convenio_modificatorio_ind', headerOriginal: "Convenio modificatorio", etiqueta: "Convenio modificatorio (DRC)", categoria: 'convenio', tipo: 'texto', descripcion: 'Campo oficial CSV 47/73' },
  { index: 47, id: 'csv_47', headerOriginal: "Código Ref. Contrato", etiqueta: "Código Ref. Contrato", categoria: 'convenio', tipo: 'texto', descripcion: 'Campo oficial CSV 48/73' },
  { index: 48, id: 'csv_48', headerOriginal: "Estatus Contrato", etiqueta: "Estatus Contrato", categoria: 'convenio', tipo: 'texto', descripcion: 'Campo oficial CSV 49/73' },
  { index: 49, id: 'csv_49', headerOriginal: "Fecha firma contrato", etiqueta: "Fecha firma contrato", categoria: 'convenio', tipo: 'fecha', descripcion: 'Campo oficial CSV 50/73' },
  { index: 50, id: 'csv_50', headerOriginal: "Tipo de contrato", etiqueta: "Tipo de contrato", categoria: 'convenio', tipo: 'texto', descripcion: 'Campo oficial CSV 51/73' },
  { index: 51, id: 'csv_51', headerOriginal: "Monto sin imp./mínimo", etiqueta: "Monto sin imp./mínimo", categoria: 'convenio', tipo: 'numero', descripcion: 'Campo oficial CSV 52/73' },
  { index: 52, id: 'csv_52', headerOriginal: "Monto mínimo con imp.", etiqueta: "Monto mínimo con imp.", categoria: 'convenio', tipo: 'numero', descripcion: 'Campo oficial CSV 53/73' },
  { index: 53, id: 'csv_53', headerOriginal: "Monto sin imp./máximo", etiqueta: "Monto sin imp./máximo", categoria: 'convenio', tipo: 'numero', descripcion: 'Campo oficial CSV 54/73' },
  { index: 54, id: 'csv_54', headerOriginal: "Monto máximo con imp.", etiqueta: "Monto máximo con imp.", categoria: 'convenio', tipo: 'numero', descripcion: 'Campo oficial CSV 55/73' },
  { index: 55, id: 'moneda_convenio', headerOriginal: "Moneda", etiqueta: "Moneda (MFIJ)", categoria: 'convenio', tipo: 'texto', descripcion: 'Campo oficial CSV 56/73' },
  { index: 56, id: 'convenio_modificatorio_tipo', headerOriginal: "Convenio modificatorio", etiqueta: "Convenio modificatorio (MFIJ)", categoria: 'convenio', tipo: 'texto', descripcion: 'Campo oficial CSV 57/73' },
  { index: 57, id: 'csv_57', headerOriginal: "Código Ref. último convenio", etiqueta: "Código Ref. último convenio", categoria: 'convenio', tipo: 'texto', descripcion: 'Campo oficial CSV 58/73' },
  { index: 58, id: 'csv_58', headerOriginal: "Fecha fin último conv", etiqueta: "Fecha fin último conv", categoria: 'convenio', tipo: 'fecha', descripcion: 'Campo oficial CSV 59/73' },
  { index: 59, id: 'csv_59', headerOriginal: "Monto sin imp./mínimo último conv", etiqueta: "Monto sin imp./mínimo último conv", categoria: 'convenio', tipo: 'numero', descripcion: 'Campo oficial CSV 60/73' },
  { index: 60, id: 'csv_60', headerOriginal: "Monto mínimo con imp. último conv", etiqueta: "Monto mínimo con imp. último conv", categoria: 'convenio', tipo: 'numero', descripcion: 'Campo oficial CSV 61/73' },
  { index: 61, id: 'csv_61', headerOriginal: "Monto sin imp./máximo último conv", etiqueta: "Monto sin imp./máximo último conv", categoria: 'convenio', tipo: 'numero', descripcion: 'Campo oficial CSV 62/73' },
  { index: 62, id: 'csv_62', headerOriginal: "Monto máximo con imp. último conv", etiqueta: "Monto máximo con imp. último conv", categoria: 'convenio', tipo: 'numero', descripcion: 'Campo oficial CSV 63/73' },
  { index: 63, id: 'csv_63', headerOriginal: "Fecha firma último conv", etiqueta: "Fecha firma último conv", categoria: 'convenio', tipo: 'fecha', descripcion: 'Campo oficial CSV 64/73' },
  { index: 64, id: 'csv_64', headerOriginal: "rfc", etiqueta: "rfc", categoria: 'proveedor', tipo: 'texto', descripcion: 'Campo oficial CSV 65/73' },
  { index: 65, id: 'csv_65', headerOriginal: "Proveedor o contratista", etiqueta: "Proveedor o contratista", categoria: 'proveedor', tipo: 'texto', descripcion: 'Campo oficial CSV 66/73' },
  { index: 66, id: 'csv_66', headerOriginal: "Folio en el RUPC", etiqueta: "Folio en el RUPC", categoria: 'proveedor', tipo: 'texto', descripcion: 'Campo oficial CSV 67/73' },
  { index: 67, id: 'csv_67', headerOriginal: "País de la empresa", etiqueta: "País de la empresa", categoria: 'proveedor', tipo: 'texto', descripcion: 'Campo oficial CSV 68/73' },
  { index: 68, id: 'csv_68', headerOriginal: "Nacionalidad proveedor o contratista", etiqueta: "Nacionalidad proveedor o contratista", categoria: 'proveedor', tipo: 'texto', descripcion: 'Campo oficial CSV 69/73' },
  { index: 69, id: 'csv_69', headerOriginal: "Proveedor/contratista con auto registro en CompraNet", etiqueta: "Proveedor/contratista con auto registro en CompraNet", categoria: 'proveedor', tipo: 'texto', descripcion: 'Campo oficial CSV 70/73' },
  { index: 70, id: 'csv_70', headerOriginal: "Estratificación", etiqueta: "Estratificación", categoria: 'proveedor', tipo: 'texto', descripcion: 'Campo oficial CSV 71/73' },
  { index: 71, id: 'csv_71', headerOriginal: "origen", etiqueta: "origen", categoria: 'adicional', tipo: 'texto', descripcion: 'Campo oficial CSV 72/73' },
  { index: 72, id: 'csv_72', headerOriginal: "Dirección del anuncio", etiqueta: "Dirección del anuncio", categoria: 'adicional', tipo: 'url', descripcion: 'Campo oficial CSV 73/73' },
];

/**
 * Normaliza un RFC eliminando caracteres espurios, guiones, espacios y convirtiendo a mayúsculas.
 */
export function normalizeRFC(rfc: string | null | undefined): string {
  if (!rfc) return '';
  return rfc
    .toUpperCase()
    .replace(/[^A-Z0-9&Ñ]/g, '')
    .trim();
}

/**
 * Normaliza un nombre o razón social para búsquedas exactas e indexadas:
 * - Mayúsculas
 * - Quita acentos (diacríticos)
 * - Quita caracteres no alfanuméricos salvo espacios
 * - Colapsa espacios repetidos
 */
export function normalizeName(name: string | null | undefined): string {
  if (!name) return '';
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Limpia y normaliza números y montos
 */
export function parseNumeric(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val)
    .replace(/[$€,\s]/g, '')
    .trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/**
 * Formatea moneda para vistas
 */
export function formatCurrency(amount: number, currency: string = 'MXN'): string {
  try {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency || 'MXN',
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${amount.toLocaleString('es-MX', { maximumFractionDigits: 2 })} ${currency || 'MXN'}`;
  }
}

/**
 * Normaliza y valida fechas del sistema gubernamental
 * Admite 'DD/MM/YYYY', 'YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DD', 'DD-MM-YYYY'
 */
export function parseDateString(dateStr: string | null | undefined): {
  normalized: string;
  isAnomaly: boolean;
  anomalyReason?: string;
} {
  if (!dateStr || !dateStr.trim()) {
    return { normalized: '', isAnomaly: false };
  }

  const s = dateStr.trim();

  // Patrón DD/MM/AAAA o DD/MM/AAAA HH:mm...
  const ddmmyyyy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (ddmmyyyy) {
    const day = parseInt(ddmmyyyy[1], 10);
    const month = parseInt(ddmmyyyy[2], 10);
    const year = parseInt(ddmmyyyy[3], 10);

    let isAnomaly = false;
    let reason = '';

    if (year < 1990 || year > 2035) {
      isAnomaly = true;
      reason = `Año fuera de rango esperado (${year})`;
    } else if (month < 1 || month > 12 || day < 1 || day > 31) {
      isAnomaly = true;
      reason = `Día o mes fuera de rango (${day}/${month}/${year})`;
    }

    const iso = `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    return { normalized: iso, isAnomaly, anomalyReason: reason };
  }

  // Patrón AAAA-MM-DD o AAAA-MM-DD HH:mm:ss
  const yyyymmdd = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (yyyymmdd) {
    const year = parseInt(yyyymmdd[1], 10);
    const month = parseInt(yyyymmdd[2], 10);
    const day = parseInt(yyyymmdd[3], 10);

    let isAnomaly = false;
    let reason = '';

    if (year < 1990 || year > 2035) {
      isAnomaly = true;
      reason = `Año fuera de rango esperado (${year})`;
    } else if (month < 1 || month > 12 || day < 1 || day > 31) {
      isAnomaly = true;
      reason = `Día o mes fuera de rango (${day}/${month}/${year})`;
    }

    const iso = `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    return { normalized: iso, isAnomaly, anomalyReason: reason };
  }

  return { normalized: s, isAnomaly: true, anomalyReason: `Formato de fecha no estándar: ${s}` };
}

/**
 * Protección contra inyección de fórmulas al exportar a Excel (CSV/Formula Injection):
 * Si el contenido comienza con '=', '+', '-', '@' o tabulaciones, se antepone una comilla simple.
 */
export function sanitizeForExcel(val: any): any {
  if (typeof val !== 'string') return val;
  if (!val) return '';
  const firstChar = val.trim().charAt(0);
  if (firstChar === '=' || firstChar === '+' || firstChar === '-' || firstChar === '@' || firstChar === '\t' || firstChar === '\r') {
    return `'${val}`;
  }
  return val;
}

/**
 * Cálculo de similitud aproximada (Dice Coefficient sobre bigramas)
 * Rango [0, 1]
 */
export function stringSimilarity(str1: string, str2: string): number {
  const s1 = normalizeName(str1);
  const s2 = normalizeName(str2);

  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;
  if (s1.length < 2 || s2.length < 2) return 0.0;

  const getBigrams = (str: string) => {
    const bigrams = new Map<string, number>();
    for (let i = 0; i < str.length - 1; i++) {
      const bg = str.substring(i, i + 2);
      bigrams.set(bg, (bigrams.get(bg) || 0) + 1);
    }
    return bigrams;
  };

  const b1 = getBigrams(s1);
  const b2 = getBigrams(s2);

  let intersection = 0;
  for (const [bg, count1] of b1.entries()) {
    const count2 = b2.get(bg);
    if (count2) {
      intersection += Math.min(count1, count2);
    }
  }

  const total = (s1.length - 1) + (s2.length - 1);
  return (2.0 * intersection) / total;
}
