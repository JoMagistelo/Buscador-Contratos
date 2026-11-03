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
 * 73 Columnas oficiales en el orden estricto de los CSV oficiales de CompraNet y Compras MX.
 * NOTA CRÍTICA:
 * - Hay 2 columnas denominadas "Moneda":
 *   1) Índice 7: Moneda del contrato
 *   2) Índice 13: Moneda del convenio modificatorio
 * - Hay 2 columnas denominadas "Convenio modificatorio":
 *   1) Índice 9: Indicador de si el contrato tiene convenio modificatorio (Sí/No)
 *   2) Índice 14: Tipo o especificación del convenio modificatorio
 */
export const COLUMNAS_OFICIALES_73: ColumnaDef[] = [
  { index: 0, id: 'orden', headerOriginal: 'Orden', etiqueta: 'Orden', categoria: 'general', tipo: 'numero', descripcion: 'Número consecutivo de registro en la base de datos' },
  { index: 1, id: 'codigo_contrato', headerOriginal: 'Código del contrato', etiqueta: 'Código del Contrato', categoria: 'general', tipo: 'texto', descripcion: 'Identificador del contrato en el sistema oficial' },
  { index: 2, id: 'titulo_contrato', headerOriginal: 'Título del contrato', etiqueta: 'Título del Contrato', categoria: 'general', tipo: 'texto', descripcion: 'Nombre o título descriptivo del contrato' },
  { index: 3, id: 'descripcion_contrato', headerOriginal: 'Descripción del contrato', etiqueta: 'Descripción del Contrato', categoria: 'general', tipo: 'texto', descripcion: 'Objeto y detalle pormenorizado de la contratación' },
  { index: 4, id: 'fecha_inicio', headerOriginal: 'Fecha de inicio del contrato', etiqueta: 'Fecha de Inicio', categoria: 'general', tipo: 'fecha', descripcion: 'Fecha oficial de inicio de vigencia del contrato' },
  { index: 5, id: 'fecha_fin', headerOriginal: 'Fecha de fin del contrato', etiqueta: 'Fecha de Término', categoria: 'general', tipo: 'fecha', descripcion: 'Fecha oficial de terminación del contrato' },
  { index: 6, id: 'importe_contrato', headerOriginal: 'Importe del contrato', etiqueta: 'Importe del Contrato', categoria: 'financiero', tipo: 'numero', descripcion: 'Monto total pactado en el contrato inicial' },
  { index: 7, id: 'moneda_contrato', headerOriginal: 'Moneda', etiqueta: 'Moneda del Contrato', categoria: 'financiero', tipo: 'texto', descripcion: 'Divisa en la que se pactó el contrato (MXN, USD, etc.)' },
  { index: 8, id: 'estatus_contrato', headerOriginal: 'Estatus del contrato', etiqueta: 'Estatus', categoria: 'general', tipo: 'texto', descripcion: 'Estado administrativo del contrato (Activo, Terminado, etc.)' },
  { index: 9, id: 'convenio_modificatorio_ind', headerOriginal: 'Convenio modificatorio', etiqueta: '¿Tiene Convenio Modificatorio?', categoria: 'convenio', tipo: 'texto', descripcion: 'Indica si el contrato cuenta con convenios modificatorios' },
  { index: 10, id: 'monto_convenio', headerOriginal: 'Monto del convenio modificatorio', etiqueta: 'Monto del Convenio', categoria: 'convenio', tipo: 'numero', descripcion: 'Variación de monto acordada en el convenio' },
  { index: 11, id: 'plazo_convenio', headerOriginal: 'Plazo del convenio modificatorio', etiqueta: 'Plazo del Convenio', categoria: 'convenio', tipo: 'texto', descripcion: 'Ampliación o modificación de plazo convenida' },
  { index: 12, id: 'fecha_firma_convenio', headerOriginal: 'Fecha de firma del convenio modificatorio', etiqueta: 'Fecha Firma Convenio', categoria: 'convenio', tipo: 'fecha', descripcion: 'Fecha en que se formalizó el convenio' },
  { index: 13, id: 'moneda_convenio', headerOriginal: 'Moneda', etiqueta: 'Moneda del Convenio', categoria: 'convenio', tipo: 'texto', descripcion: 'Divisa correspondiente al convenio modificatorio' },
  { index: 14, id: 'convenio_modificatorio_tipo', headerOriginal: 'Convenio modificatorio', etiqueta: 'Tipo de Convenio Modificatorio', categoria: 'convenio', tipo: 'texto', descripcion: 'Clasificación o detalle del convenio modificatorio' },
  { index: 15, id: 'clave_institucion', headerOriginal: 'Clave de la institución', etiqueta: 'Clave Institución', categoria: 'general', tipo: 'texto', descripcion: 'Clave presupuestaria o identificador de la dependencia' },
  { index: 16, id: 'nombre_institucion', headerOriginal: 'Nombre de la institución', etiqueta: 'Institución / Dependencia', categoria: 'general', tipo: 'texto', descripcion: 'Nombre completo de la secretaría o ente público' },
  { index: 17, id: 'siglas_institucion', headerOriginal: 'Siglas de la institución', etiqueta: 'Siglas Institución', categoria: 'general', tipo: 'texto', descripcion: 'Siglas reconocidas (IMSS, CFE, PEMEX, etc.)' },
  { index: 18, id: 'clave_unidad_compradora', headerOriginal: 'Clave de la unidad compradora', etiqueta: 'Clave Unidad Compradora', categoria: 'general', tipo: 'texto', descripcion: 'Código de la oficina ejecutora del gasto' },
  { index: 19, id: 'nombre_unidad_compradora', headerOriginal: 'Nombre de la unidad compradora', etiqueta: 'Unidad Compradora', categoria: 'general', tipo: 'texto', descripcion: 'Área compradora o delegación contratante' },
  { index: 20, id: 'responsable_unidad_compradora', headerOriginal: 'Responsable de la unidad compradora', etiqueta: 'Responsable Unidad Compradora', categoria: 'general', tipo: 'texto', descripcion: 'Servidor público a cargo de la unidad' },
  { index: 21, id: 'codigo_expediente', headerOriginal: 'Código del expediente', etiqueta: 'Código de Expediente', categoria: 'procedimiento', tipo: 'texto', descripcion: 'Número de expediente en el sistema electrónico' },
  { index: 22, id: 'referencia_expediente', headerOriginal: 'Referencia del expediente', etiqueta: 'Referencia Expediente', categoria: 'procedimiento', tipo: 'texto', descripcion: 'Clave interna institucional del expediente' },
  { index: 23, id: 'titulo_expediente', headerOriginal: 'Título del expediente', etiqueta: 'Título Expediente', categoria: 'procedimiento', tipo: 'texto', descripcion: 'Nombre asignado al expediente de compra' },
  { index: 24, id: 'tipo_expediente', headerOriginal: 'Tipo de expediente', etiqueta: 'Tipo Expediente', categoria: 'procedimiento', tipo: 'texto', descripcion: 'Clase de expediente administrativo' },
  { index: 25, id: 'descripcion_expediente', headerOriginal: 'Descripción del expediente', etiqueta: 'Descripción Expediente', categoria: 'procedimiento', tipo: 'texto', descripcion: 'Justificación y alcance general del expediente' },
  { index: 26, id: 'codigo_procedimiento', headerOriginal: 'Código del procedimiento', etiqueta: 'Código del Procedimiento', categoria: 'procedimiento', tipo: 'texto', descripcion: 'Número oficial del procedimiento de contratación' },
  { index: 27, id: 'caracter_procedimiento', headerOriginal: 'Carácter del procedimiento', etiqueta: 'Carácter (Nacional / Internacional)', categoria: 'procedimiento', tipo: 'texto', descripcion: 'Nacional, Internacional bajo TLC o Internacional abierto' },
  { index: 28, id: 'tipo_procedimiento', headerOriginal: 'Tipo de procedimiento', etiqueta: 'Tipo de Procedimiento', categoria: 'procedimiento', tipo: 'texto', descripcion: 'Licitación pública, Adjudicación directa, Invitación a cuando menos 3 personas' },
  { index: 29, id: 'forma_procedimiento', headerOriginal: 'Forma de procedimiento', etiqueta: 'Forma del Procedimiento', categoria: 'procedimiento', tipo: 'texto', descripcion: 'Electrónica, Presencial o Mixta' },
  { index: 30, id: 'fundamento_legal', headerOriginal: 'Fundamento legal', etiqueta: 'Fundamento Legal', categoria: 'procedimiento', tipo: 'texto', descripcion: 'Artículos de la LAASSP, LOPSRM u ordenamiento aplicable' },
  { index: 31, id: 'fecha_publicacion', headerOriginal: 'Fecha de publicación del procedimiento', etiqueta: 'Fecha Publicación Procedimiento', categoria: 'procedimiento', tipo: 'fecha', descripcion: 'Fecha de emisión de convocatoria o bases' },
  { index: 32, id: 'fecha_apertura', headerOriginal: 'Fecha de apertura de proposiciones', etiqueta: 'Fecha Apertura Proposiciones', categoria: 'procedimiento', tipo: 'fecha', descripcion: 'Sesión pública de apertura de propuestas' },
  { index: 33, id: 'fecha_fallo', headerOriginal: 'Fecha de fallo', etiqueta: 'Fecha de Fallo', categoria: 'procedimiento', tipo: 'fecha', descripcion: 'Emisión del dictamen de adjudicación' },
  { index: 34, id: 'numero_procedimiento', headerOriginal: 'Número del procedimiento', etiqueta: 'Número de Procedimiento Oficial', categoria: 'procedimiento', tipo: 'texto', descripcion: 'Identificador alfanumérico institucional de la licitación' },
  { index: 35, id: 'rfc_proveedor', headerOriginal: 'RFC del proveedor o contratista', etiqueta: 'RFC del Proveedor', categoria: 'proveedor', tipo: 'texto', descripcion: 'Registro Federal de Contribuyentes de la empresa o persona física' },
  { index: 36, id: 'nombre_proveedor', headerOriginal: 'Nombre o razón social del proveedor o contratista', etiqueta: 'Proveedor / Razón Social', categoria: 'proveedor', tipo: 'texto', descripcion: 'Denominación legal de la empresa o nombre del contratista' },
  { index: 37, id: 'estratificacion_proveedor', headerOriginal: 'Estratificación del proveedor o contratista', etiqueta: 'Estratificación Empresarial', categoria: 'proveedor', tipo: 'texto', descripcion: 'Micro, Pequeña, Mediana o Grande empresa' },
  { index: 38, id: 'folio_licitacion', headerOriginal: 'Folio de licitación', etiqueta: 'Folio Licitación', categoria: 'procedimiento', tipo: 'texto', descripcion: 'Folio oficial asignado en la plataforma' },
  { index: 39, id: 'tipo_contratacion', headerOriginal: 'Tipo de contratación', etiqueta: 'Tipo de Contratación', categoria: 'procedimiento', tipo: 'texto', descripcion: 'Adquisición de bienes, Arrendamiento o Servicios' },
  { index: 40, id: 'partida_especifica', headerOriginal: 'Partida específica', etiqueta: 'Partida Específica', categoria: 'financiero', tipo: 'texto', descripcion: 'Clave presupuestaria del clasificador por objeto del gasto' },
  { index: 41, id: 'descripcion_partida', headerOriginal: 'Descripción de la partida', etiqueta: 'Descripción de Partida', categoria: 'financiero', tipo: 'texto', descripcion: 'Concepto del clasificador presupuestario' },
  { index: 42, id: 'cantidad', headerOriginal: 'Cantidad', etiqueta: 'Cantidad', categoria: 'financiero', tipo: 'numero', descripcion: 'Unidades de bienes o servicios contratados' },
  { index: 43, id: 'unidad_medida', headerOriginal: 'Unidad de medida', etiqueta: 'Unidad de Medida', categoria: 'financiero', tipo: 'texto', descripcion: 'Pieza, Lote, Servicio, Kilogramo, etc.' },
  { index: 44, id: 'precio_unitario', headerOriginal: 'Precio unitario', etiqueta: 'Precio Unitario', categoria: 'financiero', tipo: 'numero', descripcion: 'Costo unitario antes de impuestos' },
  { index: 45, id: 'importe_partida', headerOriginal: 'Importe de la partida', etiqueta: 'Importe de la Partida', categoria: 'financiero', tipo: 'numero', descripcion: 'Subtotal calculado de la partida' },
  { index: 46, id: 'direccion_anuncio', headerOriginal: 'Dirección del anuncio', etiqueta: 'Enlace Oficial del Anuncio', categoria: 'general', tipo: 'url', descripcion: 'URL directa a la publicación oficial en CompraNet / Compras MX' },
  { index: 47, id: 'monto_adjudicado', headerOriginal: 'Monto adjudicado', etiqueta: 'Monto Adjudicado', categoria: 'financiero', tipo: 'numero', descripcion: 'Monto asignado en el fallo oficial' },
  { index: 48, id: 'monto_ejercido', headerOriginal: 'Monto ejercido', etiqueta: 'Monto Ejercido', categoria: 'financiero', tipo: 'numero', descripcion: 'Gasto devengado reportado' },
  { index: 49, id: 'monto_pagado', headerOriginal: 'Monto pagado', etiqueta: 'Monto Pagado', categoria: 'financiero', tipo: 'numero', descripcion: 'Importe efectivamente liquidado al proveedor' },
  { index: 50, id: 'monto_facturado', headerOriginal: 'Monto facturado', etiqueta: 'Monto Facturado', categoria: 'financiero', tipo: 'numero', descripcion: 'Importe total de facturas emitidas y recibidas' },
  { index: 51, id: 'importe_drc', headerOriginal: 'Importe DRC', etiqueta: 'Importe DRC (Derechos/Deducciones)', categoria: 'financiero', tipo: 'numero', descripcion: 'Monto correspondiente a deducciones o retenciones' },
  { index: 52, id: 'importe_mfij', headerOriginal: 'Importe MFIJ', etiqueta: 'Importe MFIJ (Monto Fijo)', categoria: 'financiero', tipo: 'numero', descripcion: 'Monto fijo pactado para la prestación' },
  { index: 53, id: 'monto_total_impuestos', headerOriginal: 'Monto total con impuestos', etiqueta: 'Monto Total con Impuestos', categoria: 'financiero', tipo: 'numero', descripcion: 'Monto global que incluye IVA y gravámenes' },
  { index: 54, id: 'pais_empresa', headerOriginal: 'País de la empresa', etiqueta: 'País de la Empresa', categoria: 'proveedor', tipo: 'texto', descripcion: 'Nacionalidad de la empresa contratista' },
  { index: 55, id: 'entidad_federativa_empresa', headerOriginal: 'Entidad federativa de la empresa', etiqueta: 'Estado de la Empresa', categoria: 'proveedor', tipo: 'texto', descripcion: 'Estado o entidad federativa del domicilio fiscal' },
  { index: 56, id: 'municipio_empresa', headerOriginal: 'Municipio o alcaldía de la empresa', etiqueta: 'Municipio de la Empresa', categoria: 'proveedor', tipo: 'texto', descripcion: 'Municipio de residencia fiscal del contratista' },
  { index: 57, id: 'codigo_postal_empresa', headerOriginal: 'Código postal de la empresa', etiqueta: 'Código Postal Empresa', categoria: 'proveedor', tipo: 'texto', descripcion: 'Código postal fiscal del proveedor' },
  { index: 58, id: 'correo_proveedor', headerOriginal: 'Correo electrónico del proveedor', etiqueta: 'Correo del Proveedor', categoria: 'proveedor', tipo: 'texto', descripcion: 'Contacto de correo oficial' },
  { index: 59, id: 'telefono_proveedor', headerOriginal: 'Teléfono del proveedor', etiqueta: 'Teléfono del Proveedor', categoria: 'proveedor', tipo: 'texto', descripcion: 'Número telefónico registrado del proveedor' },
  { index: 60, id: 'entidad_federativa_contrato', headerOriginal: 'Entidad federativa del contrato', etiqueta: 'Estado de Ejecución', categoria: 'general', tipo: 'texto', descripcion: 'Entidad donde se entregan los bienes o servicios' },
  { index: 61, id: 'municipio_contrato', headerOriginal: 'Municipio del contrato', etiqueta: 'Municipio de Ejecución', categoria: 'general', tipo: 'texto', descripcion: 'Municipio donde se ejecuta la contratación' },
  { index: 62, id: 'ramo', headerOriginal: 'Ramo', etiqueta: 'Ramo Presupuestal', categoria: 'financiero', tipo: 'texto', descripcion: 'Clasificador administrativo presupuestario' },
  { index: 63, id: 'programa_presupuestario', headerOriginal: 'Programa presupuestario', etiqueta: 'Programa Presupuestario', categoria: 'financiero', tipo: 'texto', descripcion: 'Clave y denominación del programa de gasto' },
  { index: 64, id: 'fuente_financiamiento', headerOriginal: 'Fuente de financiamiento', etiqueta: 'Fuente Financiamiento', categoria: 'financiero', tipo: 'texto', descripcion: 'Recursos fiscales, propios, crédito o subsidios' },
  { index: 65, id: 'origen_recurso', headerOriginal: 'Origen del recurso', etiqueta: 'Origen del Recurso', categoria: 'financiero', tipo: 'texto', descripcion: 'Federal, Estatal o Mixto' },
  { index: 66, id: 'criterio_evaluacion', headerOriginal: 'Criterio de evaluación', etiqueta: 'Criterio de Evaluación', categoria: 'procedimiento', tipo: 'texto', descripcion: 'Puntos y porcentajes, Costo-beneficio o Binario' },
  { index: 67, id: 'tipo_publicacion', headerOriginal: 'Tipo de publicación', etiqueta: 'Tipo Publicación', categoria: 'procedimiento', tipo: 'texto', descripcion: 'Convocatoria, Fallo o Modificación' },
  { index: 68, id: 'version_estatus', headerOriginal: 'Versión del estatus', etiqueta: 'Versión del Estatus', categoria: 'adicional', tipo: 'texto', descripcion: 'Número o fecha de versión de estatus reportada' },
  { index: 69, id: 'fecha_actualizacion', headerOriginal: 'Fecha de última actualización', etiqueta: 'Última Actualización Oficial', categoria: 'adicional', tipo: 'fecha', descripcion: 'Fecha de última sincronización en CompraNet / Compras MX' },
  { index: 70, id: 'identificador_interno', headerOriginal: 'Identificador interno', etiqueta: 'ID Interno', categoria: 'adicional', tipo: 'texto', descripcion: 'Identificador técnico en base de datos de origen' },
  { index: 71, id: 'observaciones', headerOriginal: 'Observaciones', etiqueta: 'Observaciones', categoria: 'adicional', tipo: 'texto', descripcion: 'Notas o aclaraciones oficiales' },
  { index: 72, id: 'nota_aclaratoria', headerOriginal: 'Nota aclaratoria', etiqueta: 'Nota Aclaratoria', categoria: 'adicional', tipo: 'texto', descripcion: 'Texto adicional de fe de erratas o aclaraciones' },
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
