import Papa from 'papaparse';
import { CSV_COLUMN_KEYS_73 } from '../shared/contratosSchema.js';

export interface ChunkProgress {
  totalRows: number;
  processedRows: number;
  percentage: number;
  speedRowsPerSec: number;
  currentChunk: number;
  totalChunks: number;
  errorsCount: number;
  status: 'idle' | 'parsing' | 'uploading' | 'paused' | 'completed' | 'error';
  errorMessage?: string;
  detectedYear: number;
  encodingUsed: string;
  sha256: string;
}

export interface CsvValidationSummary {
  fileName: string;
  fileSizeBytes: number;
  sha256: string;
  totalEstimatedRows: number;
  detectedYear: number;
  detectedColumnsCount: number;
  has73Columns: boolean;
  duplicateHeadersDetected: string[];
  sampleRows: any[];
}

/**
 * Calcula la huella SHA-256 de un archivo en el navegador
 */
export async function calculateFileSha256(file: File): Promise<string> {
  // La huella debe representar TODO el CSV; nombre/mtime/20 MB no son SHA256 del archivo.
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Detecta el año a partir del nombre del archivo o del contenido
 */
export function extractYearFromFile(file: File): number {
  const name = file.name.toUpperCase();
  const match = name.match(/202[0-9]/);
  if (match) {
    return parseInt(match[0], 10);
  }
  return 2024;
}

/**
 * Inspecciona y valida el encabezado de un CSV antes de iniciar la importación completa
 */
export async function inspectCsvHeader(file: File): Promise<CsvValidationSummary> {
  const sha256 = await calculateFileSha256(file);
  const detectedYear = extractYearFromFile(file);

  // Leer los primeros 32 KB para inspeccionar encabezados y primeras filas
  const slice = file.slice(0, 32 * 1024);
  const text = await readFileAsTextWindows1252(slice);

  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      preview: 5,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          return reject(new Error('El archivo CSV está vacío'));
        }

        const rawHeaders = (results.data[0] as string[]) || [];
        const duplicateHeaders: string[] = [];
        const seen = new Set<string>();

        for (const h of rawHeaders) {
          const trimmed = (h || '').trim();
          if (seen.has(trimmed)) {
            duplicateHeaders.push(trimmed);
          }
          seen.add(trimmed);
        }

        // Estimación aproximada de filas basada en tamaño promedio de fila
        const sampleTextLength = text.length;
        const avgRowBytes = Math.max(100, Math.floor(sampleTextLength / (results.data.length || 1)));
        const totalEstimatedRows = Math.round(file.size / avgRowBytes);

        resolve({
          fileName: file.name,
          fileSizeBytes: file.size,
          sha256,
          totalEstimatedRows,
          detectedYear,
          detectedColumnsCount: rawHeaders.length,
          has73Columns: rawHeaders.length === 73 && rawHeaders.every((h, i) => h.trim() === CSV_COLUMN_KEYS_73[i].replace(/_(1|2)$/, '')),
          duplicateHeadersDetected: duplicateHeaders,
          sampleRows: results.data.slice(1, 4),
        });
      },
      error: (err: any) => reject(err),
    });
  });
}

/**
 * Lee un Blob/File utilizando codificación Windows-1252 (con fallback a UTF-8)
 */
export function readFileAsTextWindows1252(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const buffer = reader.result as ArrayBuffer;
        // Intentar decodificar con windows-1252
        const decoder1252 = new TextDecoder('windows-1252');
        const text = decoder1252.decode(buffer);
        resolve(text);
      } catch {
        const decoderUtf8 = new TextDecoder('utf-8');
        resolve(decoderUtf8.decode(reader.result as ArrayBuffer));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}

export interface ChunkUploaderOptions {
  file: File;
  token: string;
  year: number;
  fileSha256: string;
  chunkSizeRows?: number;
  onProgress: (progress: ChunkProgress) => void;
}

export class ChunkCsvUploader {
  private file: File;
  private token: string;
  private year: number;
  private fileSha256: string;
  private chunkSizeRows: number;
  private onProgress: (progress: ChunkProgress) => void;

  private isPaused: boolean = false;
  private isCancelled: boolean = false;
  private processedRows: number = 0;
  private totalRowsCount: number = 0;
  private chunkIndex: number = 0;
  private startTime: number = 0;
  private errorsCount: number = 0;

  constructor(options: ChunkUploaderOptions) {
    this.file = options.file;
    this.token = options.token;
    this.year = options.year;
    this.fileSha256 = options.fileSha256;
    this.chunkSizeRows = options.chunkSizeRows || 300; // Lotes seguros para Cloudflare Workers Free (< 50 subrequests / timeout)
    this.onProgress = options.onProgress;
  }

  public pause() {
    this.isPaused = true;
  }

  public resume() {
    if (this.isPaused) {
      this.isPaused = false;
    }
  }

  public cancel() {
    this.isCancelled = true;
  }

  public async start(): Promise<{ success: boolean; totalProcessed: number; errorsCount: number }> {
    this.startTime = Date.now();
    this.isPaused = false;
    this.isCancelled = false;
    this.processedRows = 0;
    this.chunkIndex = 0;
    this.errorsCount = 0;

    // Primer paso: mapear encabezados manejando duplicados
    let headersMap: string[] = [];
    let currentBatch: any[] = [];
    let globalRowIndex = 0;
    let invalidRows = 0;

    return new Promise((resolve, reject) => {
      // Usar FileReader + TextDecoder para Windows-1252 streaming
      // PapaParse soporta file parsing directamente
      Papa.parse(this.file, {
        encoding: 'windows-1252',
        skipEmptyLines: 'greedy',
        worker: false, // En navegador worker puede tener problemas de transferencia con blobs grandes
        step: async (results, parser) => {
          if (this.isCancelled) {
            parser.abort();
            return resolve({ success: false, totalProcessed: this.processedRows, errorsCount: this.errorsCount });
          }

          // Si está pausado, pausar el parser de PapaParse
          let resumedFromUserPause = false;
          while (this.isPaused && !this.isCancelled) {
            parser.pause();
            resumedFromUserPause = true;
            await new Promise((r) => setTimeout(r, 400));
          }
          if (this.isCancelled) { parser.abort(); return resolve({ success: false, totalProcessed: this.processedRows, errorsCount: this.errorsCount }); }
          if (resumedFromUserPause) parser.resume();

          const row = results.data as string[];
          if (!row || row.length === 0) return;

          // Primera fila: Encabezados
          if (headersMap.length === 0) {
            const counts: Record<string, number> = {};
            headersMap = row.map((rawHeader) => {
              const h = (rawHeader || '').trim();
              counts[h] = (counts[h] || 0) + 1;
              if (counts[h] > 1) {
                return `${h}_${counts[h]}`;
              }
              // Normalizar también el primer caso si sabemos que es duplicado
              if (h === 'Moneda' || h === 'Convenio modificatorio') {
                return `${h}_1`;
              }
              return h;
            });
            return;
          }

          // Rechazar filas rotas antes de insertar cualquier dato de esa fila.
          if (row.length !== headersMap.length) {
            invalidRows++;
            parser.abort();
            return reject(new Error(`Fila CSV ${globalRowIndex + 1}: ${row.length} columnas, se esperaban ${headersMap.length}.`));
          }

          // Convertir fila a objeto con claves estructuradas
          globalRowIndex++;
          const rowObj: Record<string, any> = {};
          for (let i = 0; i < headersMap.length; i++) {
            const key = headersMap[i];
            rowObj[key] = row[i] !== undefined ? row[i] : '';
          }

          currentBatch.push({
            rowIndex: globalRowIndex,
            data: rowObj,
          });

          // Si alcanzamos el tamaño del lote, enviar a la API
          if (currentBatch.length >= this.chunkSizeRows) {
            parser.pause();
            const batchToSend = [...currentBatch];
            currentBatch = [];
            this.chunkIndex++;

            try {
              await this.uploadChunk(batchToSend, false);
              this.processedRows += batchToSend.length;
              this.emitProgress('uploading');
              parser.resume();
            } catch (err: any) {
              this.errorsCount += batchToSend.length;
              console.error('Error enviando lote:', err);
              // Reintentar una vez
              try {
                await new Promise((r) => setTimeout(r, 1000));
                await this.uploadChunk(batchToSend, false);
                this.processedRows += batchToSend.length;
                this.emitProgress('uploading');
                parser.resume();
              } catch (retryErr: any) {
                parser.abort();
                return reject(retryErr);
              }
            }
          }
        },
        complete: async () => {
          // Enviar cierre también si el último lote terminó justo en el tamaño de chunk.
          if (!this.isCancelled) {
            this.chunkIndex++;
            try {
              await this.uploadChunk(currentBatch, true);
              this.processedRows += currentBatch.length;
              currentBatch = [];
            } catch (err: any) {
              this.errorsCount += currentBatch.length;
              this.emitProgress('error', err.message);
              return reject(err);
            }
          }

          this.emitProgress('completed');
          resolve({
            success: true,
            totalProcessed: this.processedRows,
            errorsCount: this.errorsCount,
          });
        },
        error: (err: any) => {
          this.emitProgress('error', err.message);
          reject(err);
        },
      });
    });
  }

  private async uploadChunk(rows: any[], isLast: boolean): Promise<void> {
    const response = await fetch('/api/admin/import/chunk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        fileSha256: this.fileSha256,
        fileName: this.file.name,
        year: this.year,
        totalFileRows: this.processedRows + rows.length,
        fileSizeBytes: this.file.size,
        chunkIndex: this.chunkIndex,
        isLastChunk: isLast,
        rows,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Fallo HTTP ${response.status}: ${errText}`);
    }
  }

  private emitProgress(status: ChunkProgress['status'], errorMsg?: string) {
    const elapsedSec = (Date.now() - this.startTime) / 1000;
    const speed = elapsedSec > 0 ? Math.round(this.processedRows / elapsedSec) : 0;
    const estTotal = Math.max(this.processedRows, 1);

    this.onProgress({
      totalRows: this.processedRows,
      processedRows: this.processedRows,
      percentage: status === 'completed' ? 100 : Math.min(99, Math.round((this.processedRows / Math.max(this.totalRowsCount, this.processedRows + 1)) * 100)),
      speedRowsPerSec: speed,
      currentChunk: this.chunkIndex,
      totalChunks: this.chunkIndex + (status === 'completed' ? 0 : 1),
      errorsCount: this.errorsCount,
      status,
      errorMessage: errorMsg,
      detectedYear: this.year,
      encodingUsed: 'Windows-1252',
      sha256: this.fileSha256,
    });
  }
}
