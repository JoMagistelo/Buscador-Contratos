import { createClient as createLocalClient } from '@libsql/client';
import { createClient as createTursoClient } from '@tursodatabase/serverless/compat';
import type { Client } from '@libsql/client';
import { normalizeName, normalizeRFC, parseNumeric, parseDateString, stringSimilarity } from '../shared/contratosSchema.js';

/**
 * Remote connections use the Turso Cloud HTTP driver, compatible with Workers.
 * The local libSQL file fallback is permitted ONLY in Node development.
 * Never silently use a local database in production when secrets are missing.
 */
export function getDbClient(env?: { TURSO_DATABASE_URL?: string; TURSO_AUTH_TOKEN?: string }): Client {
  const url = env?.TURSO_DATABASE_URL || (typeof process !== 'undefined' ? process.env.TURSO_DATABASE_URL : '') || '';
  const authToken = env?.TURSO_AUTH_TOKEN || (typeof process !== 'undefined' ? process.env.TURSO_AUTH_TOKEN : '') || '';
  if (url.trim()) {
    if (!authToken.trim()) throw new Error('TURSO_AUTH_TOKEN no configurado');
    const httpsUrl = url.replace(/^libsql:\/\//i, 'https://');
    if (!httpsUrl.startsWith('https://')) throw new Error('TURSO_DATABASE_URL debe usar HTTPS');
    return createTursoClient({ url: httpsUrl, authToken }) as unknown as Client;
  }
  if (typeof process === 'undefined' || process.env.NODE_ENV === 'production') {
    throw new Error('Turso no configurado: faltan las credenciales de la base remota');
  }
  return createLocalClient({ url: 'file:contratos_local.db' });
}

export function isUsingTursoRemote(env?: { TURSO_DATABASE_URL?: string }): boolean {
  const url = env?.TURSO_DATABASE_URL || (typeof process !== 'undefined' ? process.env.TURSO_DATABASE_URL : '') || '';
  return /^https:\/\/|^libsql:\/\//i.test(url);
}

export async function initDatabaseTables(client: Client): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Tabla principal de contratos
    await client.execute(`
      CREATE TABLE IF NOT EXISTS contratos (
        id TEXT PRIMARY KEY,
        codigo_contrato TEXT,
        titulo_contrato TEXT,
        descripcion_contrato TEXT,
        fecha_inicio TEXT,
        fecha_fin TEXT,
        importe_contrato REAL,
        moneda TEXT,
        estatus_contrato TEXT,
        convenio_modificatorio_ind TEXT,
        monto_convenio REAL,
        plazo_convenio TEXT,
        fecha_firma_convenio TEXT,
        moneda_convenio TEXT,
        convenio_modificatorio_tipo TEXT,
        clave_institucion TEXT,
        nombre_institucion TEXT,
        siglas_institucion TEXT,
        unidad_compradora TEXT,
        codigo_procedimiento TEXT,
        caracter_procedimiento TEXT,
        tipo_procedimiento TEXT,
        forma_procedimiento TEXT,
        rfc_proveedor TEXT,
        nombre_proveedor TEXT,
        nombre_proveedor_norm TEXT,
        direccion_anuncio TEXT,
        monto_adjudicado REAL,
        monto_ejercido REAL,
        monto_pagado REAL,
        monto_total_impuestos REAL,
        importe_drc REAL,
        importe_mfij REAL,
        year_file INTEGER,
        file_sha256 TEXT,
        row_index INTEGER,
        raw_data_json TEXT
      );
    `);

    // 2. Índices especializados para búsqueda instantánea
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_contratos_rfc ON contratos (rfc_proveedor);`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_contratos_nombre_norm ON contratos (nombre_proveedor_norm);`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_contratos_codigo ON contratos (codigo_contrato);`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_contratos_year ON contratos (year_file);`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_contratos_siglas ON contratos (siglas_institucion);`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_contratos_file ON contratos (file_sha256);`);

    // 3. Tabla de metadatos de archivos importados
    await client.execute(`
      CREATE TABLE IF NOT EXISTS archivos_importados (
        sha256 TEXT PRIMARY KEY,
        nombre_archivo TEXT,
        year INTEGER,
        total_filas INTEGER,
        filas_importadas INTEGER,
        filas_anomalas INTEGER,
        tamano_bytes INTEGER,
        estado TEXT,
        fecha_importacion TEXT,
        detalles_json TEXT
      );
    `);

    return { success: true, message: 'Tablas e índices inicializados correctamente en Turso / SQLite.' };
  } catch (error: any) {
    return { success: false, message: `Error al inicializar tablas: ${error.message || error}` };
  }
}

export interface RawContratoRow {
  rowIndex: number;
  data: Record<string, any>;
}

export async function insertContratosBatch(
  client: Client,
  fileSha256: string,
  fileName: string,
  year: number,
  totalFileRows: number,
  fileSizeBytes: number,
  chunkIndex: number,
  isLastChunk: boolean,
  rows: RawContratoRow[]
): Promise<{ inserted: number; errors: number }> {
  let inserted = 0;
  let errors = 0;

  // Registrar o actualizar registro del archivo en archivos_importados
  await client.execute({
    sql: `INSERT INTO archivos_importados (sha256, nombre_archivo, year, total_filas, filas_importadas, filas_anomalas, tamano_bytes, estado, fecha_importacion, detalles_json)
          VALUES (?, ?, ?, ?, ?, 0, ?, 'en_progreso', datetime('now'), '{}')
          ON CONFLICT(sha256) DO UPDATE SET
            filas_importadas = filas_importadas,
            estado = CASE WHEN ? = 1 THEN 'completado' ELSE 'en_progreso' END;`,
    args: [fileSha256, fileName, year, totalFileRows, 0, fileSizeBytes, isLastChunk ? 1 : 0],
  });

  // Ejecutamos en transacciones por lotes de 50 o usando client.batch
  const statements = [];

  for (const item of rows) {
    try {
      const d = item.data;
      const rowIdx = item.rowIndex;
      // Generar identificador único no destructivo: fileSha256 + '_' + rowIdx
      const uniqueId = `${fileSha256.substring(0, 12)}_${year}_${rowIdx}`;

      // Extraer campos clave
      const codigoContrato = String(d['Código del contrato'] || d['codigo_contrato'] || '').trim();
      const tituloContrato = String(d['Título del contrato'] || d['titulo_contrato'] || '').trim();
      const descContrato = String(d['Descripción del contrato'] || d['descripcion_contrato'] || '').trim();
      
      const rawFechaInicio = String(d['Fecha de inicio del contrato'] || d['fecha_inicio'] || '');
      const parsedInicio = parseDateString(rawFechaInicio);
      
      const rawFechaFin = String(d['Fecha de fin del contrato'] || d['fecha_fin'] || '');
      const parsedFin = parseDateString(rawFechaFin);

      // Layout oficial: DRC (importe) o MFIJ (mínimo/máximo), no "Importe del contrato".
      const drcRaw = String(d['Importe DRC'] || '').trim();
      const mfijMinRaw = String(d['Monto sin imp./mínimo'] || '').trim();
      const mfijMaxRaw = String(d['Monto sin imp./máximo'] || '').trim();
      const importeContrato = parseNumeric(drcRaw || mfijMinRaw || mfijMaxRaw);
      
      // Manejar la doble columna 'Moneda'
      const monedaContrato = String((drcRaw ? d['Moneda_1'] : (d['Moneda_2'] || d['Moneda_1'])) || d['moneda_contrato'] || '').trim().toUpperCase();
      const estatus = String(d['Estatus DRC'] || d['Estatus Contrato'] || d['estatus_contrato'] || '').trim();
      
      // Manejar doble columna 'Convenio modificatorio'
      const convInd = String(d['Convenio modificatorio_1'] || d['Convenio modificatorio'] || d['convenio_modificatorio_ind'] || '').trim();
      const montoConv = parseNumeric(d['Monto del convenio modificatorio'] || d['monto_convenio']);
      const plazoConv = String(d['Plazo del convenio modificatorio'] || d['plazo_convenio'] || '').trim();
      const fechaFirmaConv = String(d['Fecha de firma del convenio modificatorio'] || d['fecha_firma_convenio'] || '').trim();
      const monedaConv = String(d['Moneda_2'] || d['moneda_convenio'] || '').trim().toUpperCase();
      const convTipo = String(d['Convenio modificatorio_2'] || d['convenio_modificatorio_tipo'] || '').trim();

      const claveInst = String(d['Clave Institución'] || d['clave_institucion'] || '').trim();
      const nombreInst = String(d['Institución'] || d['nombre_institucion'] || '').trim();
      const siglasInst = String(d['Siglas de la Institución'] || d['siglas_institucion'] || '').trim().toUpperCase();
      const unidadComp = String(d['Nombre de la UC'] || d['nombre_unidad_compradora'] || '').trim();
      
      const codProcedimiento = String(d['Número de procedimiento'] || d['codigo_procedimiento'] || '').trim();
      const carProcedimiento = String(d['Carácter del procedimiento'] || d['caracter_procedimiento'] || '').trim();
      const tipoProcedimiento = String(d['Tipo Procedimiento'] || d['tipo_procedimiento'] || '').trim();
      const formaProcedimiento = String(d['Forma de participación'] || d['forma_procedimiento'] || '').trim();

      const rawRfc = String(d['rfc'] || d['rfc_proveedor'] || '').trim();
      const rfcNorm = normalizeRFC(rawRfc);

      const rawNombreProv = String(d['Proveedor o contratista'] || d['nombre_proveedor'] || '').trim();
      const nombreProvNorm = normalizeName(rawNombreProv);

      const direccionAnuncio = String(d['Dirección del anuncio'] || d['direccion_anuncio'] || '').trim();
      
      const montoAdj = parseNumeric(d['Monto adjudicado'] || d['monto_adjudicado']);
      const montoEjerc = parseNumeric(d['Monto ejercido'] || d['monto_ejercido']);
      const montoPag = parseNumeric(d['Monto pagado'] || d['monto_pagado']);
      const montoTotImp = parseNumeric(d['Monto total con impuestos'] || d['monto_total_impuestos']);
      const impDRC = parseNumeric(d['Importe DRC'] || d['importe_drc']);
      const impMFIJ = parseNumeric(d['Monto sin imp./mínimo'] || d['importe_mfij']);

      const rawJson = JSON.stringify(d);

      statements.push({
        sql: `INSERT OR REPLACE INTO contratos (
          id, codigo_contrato, titulo_contrato, descripcion_contrato, fecha_inicio, fecha_fin,
          importe_contrato, moneda, estatus_contrato, convenio_modificatorio_ind, monto_convenio,
          plazo_convenio, fecha_firma_convenio, moneda_convenio, convenio_modificatorio_tipo,
          clave_institucion, nombre_institucion, siglas_institucion, unidad_compradora,
          codigo_procedimiento, caracter_procedimiento, tipo_procedimiento, forma_procedimiento,
          rfc_proveedor, nombre_proveedor, nombre_proveedor_norm, direccion_anuncio,
          monto_adjudicado, monto_ejercido, monto_pagado, monto_total_impuestos,
          importe_drc, importe_mfij, year_file, file_sha256, row_index, raw_data_json
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?
        );`,
        args: [
          uniqueId, codigoContrato, tituloContrato, descContrato, parsedInicio.normalized, parsedFin.normalized,
          importeContrato, monedaContrato, estatus, convInd, montoConv,
          plazoConv, fechaFirmaConv, monedaConv, convTipo,
          claveInst, nombreInst, siglasInst, unidadComp,
          codProcedimiento, carProcedimiento, tipoProcedimiento, formaProcedimiento,
          rfcNorm, rawNombreProv, nombreProvNorm, direccionAnuncio,
          montoAdj, montoEjerc, montoPag, montoTotImp,
          impDRC, impMFIJ, year, fileSha256, rowIdx, rawJson,
        ],
      });
    } catch {
      errors++;
    }
  }

  if (statements.length > 0) {
    try {
      await client.batch(statements, 'write');
      inserted = statements.length;

      // Actualizar contador en archivos_importados
      await client.execute({
        sql: `UPDATE archivos_importados
              SET filas_importadas = filas_importadas + ?,
                  estado = CASE WHEN ? = 1 THEN 'completado' ELSE 'en_progreso' END
              WHERE sha256 = ?;`,
        args: [inserted, isLastChunk ? 1 : 0, fileSha256],
      });
    } catch (e: any) {
      // Reintentar fila por fila en caso de fallo atómico
      for (const stmt of statements) {
        try {
          await client.execute(stmt);
          inserted++;
        } catch {
          errors++;
        }
      }
    }
  }

  return { inserted, errors };
}

export interface SearchFilters {
  years?: number[];
  status?: string[];
  institutions?: string[];
  currency?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface SearchQueryParam {
  query?: string;
  rfc?: string;
  code?: string;
  filters?: SearchFilters;
  page?: number;
  pageSize?: number;
}

export async function searchIndividual(client: Client, params: SearchQueryParam) {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(10, params.pageSize || 25));
  const offset = (page - 1) * pageSize;

  const conditions: string[] = [];
  const args: any[] = [];

  const rawQuery = (params.query || '').trim();
  const normalizedQuery = normalizeName(rawQuery);
  const possibleRfc = normalizeRFC(rawQuery);

  if (params.code && params.code.trim()) {
    conditions.push(`codigo_contrato LIKE ?`);
    args.push(`%${params.code.trim()}%`);
  } else if (params.rfc && params.rfc.trim()) {
    conditions.push(`rfc_proveedor = ?`);
    args.push(normalizeRFC(params.rfc));
  } else if (rawQuery.length > 0) {
    // Si parece RFC válido (10 a 13 caracteres alfanuméricos)
    if (possibleRfc.length >= 9 && possibleRfc.length <= 13 && /^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{0,3}$/.test(possibleRfc)) {
      conditions.push(`(rfc_proveedor = ? OR nombre_proveedor_norm LIKE ?)`);
      args.push(possibleRfc, `%${normalizedQuery}%`);
    } else {
      // Búsqueda por nombre o tokens
      const words = normalizedQuery.split(/\s+/).filter(w => w.length > 2);
      if (words.length > 0) {
        const wordConditions = words.slice(0, 4).map(() => `nombre_proveedor_norm LIKE ?`).join(' AND ');
        conditions.push(`(${wordConditions} OR codigo_contrato LIKE ?)`);
        for (const w of words.slice(0, 4)) {
          args.push(`%${w}%`);
        }
        args.push(`%${rawQuery}%`);
      } else {
        conditions.push(`(nombre_proveedor_norm LIKE ? OR codigo_contrato LIKE ?)`);
        args.push(`%${normalizedQuery}%`, `%${rawQuery}%`);
      }
    }
  }

  // Filtros adicionales
  if (params.filters?.years && params.filters.years.length > 0) {
    const placeholders = params.filters.years.map(() => '?').join(',');
    conditions.push(`year_file IN (${placeholders})`);
    args.push(...params.filters.years);
  }

  if (params.filters?.currency && params.filters.currency.trim()) {
    conditions.push(`moneda = ?`);
    args.push(params.filters.currency.trim().toUpperCase());
  }

  if (params.filters?.institutions && params.filters.institutions.length > 0) {
    const placeholders = params.filters.institutions.map(() => '?').join(',');
    conditions.push(`siglas_institucion IN (${placeholders})`);
    args.push(...params.filters.institutions);
  }

  if (params.filters?.minAmount !== undefined && params.filters.minAmount > 0) {
    conditions.push(`importe_contrato >= ?`);
    args.push(params.filters.minAmount);
  }

  if (params.filters?.maxAmount !== undefined && params.filters.maxAmount > 0) {
    conditions.push(`importe_contrato <= ?`);
    args.push(params.filters.maxAmount);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Conteo total
  const countSql = `SELECT COUNT(*) as total FROM contratos ${whereClause};`;
  const countRes = await client.execute({ sql: countSql, args });
  const total = Number(countRes.rows[0]?.total || 0);

  // Consulta de datos con paginación
  const dataSql = `
    SELECT id, codigo_contrato, titulo_contrato, descripcion_contrato, fecha_inicio, fecha_fin,
           importe_contrato, moneda, estatus_contrato, convenio_modificatorio_ind,
           clave_institucion, nombre_institucion, siglas_institucion, unidad_compradora,
           codigo_procedimiento, tipo_procedimiento, rfc_proveedor, nombre_proveedor,
           direccion_anuncio, year_file
    FROM contratos
    ${whereClause}
    ORDER BY year_file DESC, importe_contrato DESC
    LIMIT ? OFFSET ?;
  `;

  const queryArgs = [...args, pageSize, offset];
  const dataRes = await client.execute({ sql: dataSql, args: queryArgs });

  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
    items: dataRes.rows,
  };
}

export interface BulkItemInput {
  name?: string;
  rfc?: string;
}

export interface BulkMatchResult {
  inputName: string;
  inputRfc: string;
  matchType: 'EXACT_RFC' | 'EXACT_NAME' | 'FUZZY_NAME' | 'NONE';
  contractsCount: number;
  totalAmountMXN: number;
  contracts: any[];
}

export async function searchBulk(
  client: Client,
  items: BulkItemInput[],
  limitPerTerm: number = 20
): Promise<{ matches: BulkMatchResult[]; notFound: BulkItemInput[]; totalMatched: number }> {
  const matches: BulkMatchResult[] = [];
  const notFound: BulkItemInput[] = [];

  for (const item of items) {
    const rawRfc = normalizeRFC(item.rfc);
    const rawName = (item.name || '').trim();
    const nameNorm = normalizeName(rawName);

    let matchType: 'EXACT_RFC' | 'EXACT_NAME' | 'FUZZY_NAME' | 'NONE' = 'NONE';
    let contracts: any[] = [];

    // 1. Prioridad: Coincidencia exacta por RFC
    if (rawRfc && rawRfc.length >= 9) {
      const rfcRes = await client.execute({
        sql: `SELECT id, codigo_contrato, titulo_contrato, fecha_inicio, fecha_fin,
                     importe_contrato, moneda, rfc_proveedor, nombre_proveedor,
                     siglas_institucion, year_file, direccion_anuncio
              FROM contratos
              WHERE rfc_proveedor = ?
              ORDER BY year_file DESC, importe_contrato DESC
              LIMIT ?;`,
        args: [rawRfc, limitPerTerm],
      });

      if (rfcRes.rows.length > 0) {
        matchType = 'EXACT_RFC';
        contracts = rfcRes.rows;
      }
    }

    // 2. Si no hubo coincidencia por RFC y hay nombre, buscar por nombre normalizado exacto
    if (contracts.length === 0 && nameNorm.length > 3) {
      const nameRes = await client.execute({
        sql: `SELECT id, codigo_contrato, titulo_contrato, fecha_inicio, fecha_fin,
                     importe_contrato, moneda, rfc_proveedor, nombre_proveedor,
                     siglas_institucion, year_file, direccion_anuncio
              FROM contratos
              WHERE nombre_proveedor_norm = ?
              ORDER BY year_file DESC, importe_contrato DESC
              LIMIT ?;`,
        args: [nameNorm, limitPerTerm],
      });

      if (nameRes.rows.length > 0) {
        matchType = 'EXACT_NAME';
        contracts = nameRes.rows;
      }
    }

    // 3. Búsqueda por candidatos indexados (LIKE) con filtrado de similitud
    if (contracts.length === 0 && nameNorm.length > 4) {
      const words = nameNorm.split(/\s+/).filter(w => w.length >= 3);
      if (words.length > 0) {
        // Tomar las dos palabras más largas para no recorrer toda la tabla
        words.sort((a, b) => b.length - a.length);
        const topWords = words.slice(0, 2);
        const likeClause = topWords.map(() => `nombre_proveedor_norm LIKE ?`).join(' AND ');
        const likeArgs = topWords.map(w => `%${w}%`);

        const candidateRes = await client.execute({
          sql: `SELECT id, codigo_contrato, titulo_contrato, fecha_inicio, fecha_fin,
                       importe_contrato, moneda, rfc_proveedor, nombre_proveedor,
                       nombre_proveedor_norm, siglas_institucion, year_file, direccion_anuncio
                FROM contratos
                WHERE ${likeClause}
                ORDER BY year_file DESC
                LIMIT ?;`,
          args: [...likeArgs, limitPerTerm],
        });

        // LIKE solamente genera candidatos; sin validar similitud produce falsos positivos.
        const verified = candidateRes.rows.filter(c =>
          stringSimilarity(nameNorm, String(c.nombre_proveedor_norm || '')) >= 0.82
        );
        if (verified.length > 0) {
          matchType = 'FUZZY_NAME';
          contracts = verified;
        }
      }
    }

    if (contracts.length > 0) {
      // Calcular suma solo en MXN para no mezclar divisas
      const totalAmountMXN = contracts
        .filter(c => (c.moneda || 'MXN').toUpperCase() === 'MXN')
        .reduce((sum, c) => sum + (Number(c.importe_contrato) || 0), 0);

      matches.push({
        inputName: rawName,
        inputRfc: rawRfc,
        matchType,
        contractsCount: contracts.length,
        totalAmountMXN,
        contracts,
      });
    } else {
      notFound.push({ name: rawName, rfc: rawRfc });
    }
  }

  return {
    matches,
    notFound,
    totalMatched: matches.length,
  };
}

export async function getContratoFull(client: Client, id: string) {
  const res = await client.execute({
    sql: `SELECT * FROM contratos WHERE id = ?;`,
    args: [id],
  });

  if (res.rows.length === 0) return null;
  const row = res.rows[0];
  let rawJson = {};
  try {
    rawJson = JSON.parse(String(row.raw_data_json || '{}'));
  } catch {
    rawJson = {};
  }

  return {
    ...row,
    raw_data: rawJson,
  };
}

export async function getGlobalStats(client: Client) {
  // Conteo total de contratos y proveedores únicos
  const totalsRes = await client.execute(`
    SELECT COUNT(*) as total_contratos,
           COUNT(DISTINCT rfc_proveedor) as total_proveedores,
           COUNT(DISTINCT siglas_institucion) as total_instituciones
    FROM contratos;
  `);

  // Distribución por año
  const byYearRes = await client.execute(`
    SELECT year_file, COUNT(*) as count, SUM(CASE WHEN moneda = 'MXN' THEN importe_contrato ELSE 0 END) as total_mxn
    FROM contratos
    GROUP BY year_file
    ORDER BY year_file ASC;
  `);

  // Top instituciones
  const topInstRes = await client.execute(`
    SELECT siglas_institucion, COUNT(*) as count, SUM(CASE WHEN moneda = 'MXN' THEN importe_contrato ELSE 0 END) as total_mxn
    FROM contratos
    WHERE siglas_institucion IS NOT NULL AND siglas_institucion != ''
    GROUP BY siglas_institucion
    ORDER BY count DESC
    LIMIT 10;
  `);

  // Distribución por moneda
  const byCurrencyRes = await client.execute(`
    SELECT moneda, COUNT(*) as count, SUM(importe_contrato) as total
    FROM contratos
    WHERE moneda IS NOT NULL AND moneda != ''
    GROUP BY moneda
    ORDER BY count DESC
    LIMIT 5;
  `);

  return {
    totals: totalsRes.rows[0] || { total_contratos: 0, total_proveedores: 0, total_instituciones: 0 },
    byYear: byYearRes.rows,
    topInstituciones: topInstRes.rows,
    byMoneda: byCurrencyRes.rows,
  };
}

export async function getAdminStatus(client: Client) {
  const countRes = await client.execute(`SELECT COUNT(*) as total FROM contratos;`);
  const total = Number(countRes.rows[0]?.total || 0);

  const filesRes = await client.execute(`
    SELECT sha256, nombre_archivo, year, total_filas, filas_importadas, filas_anomalas, tamano_bytes, estado, fecha_importacion
    FROM archivos_importados
    ORDER BY year ASC, fecha_importacion DESC;
  `);

  return {
    totalContratos: total,
    archivos: filesRes.rows,
    // Estimación cuota gratuita Turso: 5GB, 10M escrituras mensuales
    estimatedStorageMB: Math.round((total * 1.2) / 1024), // ~1.2 KB por fila en SQLite
    freeLimitStorageMB: 5120, // 5 GB
    freeLimitRows: 10000000,
  };
}

export async function deleteImportedFile(client: Client, sha256: string) {
  await client.execute({
    sql: `DELETE FROM contratos WHERE file_sha256 = ?;`,
    args: [sha256],
  });
  await client.execute({
    sql: `DELETE FROM archivos_importados WHERE sha256 = ?;`,
    args: [sha256],
  });
  return { success: true };
}
