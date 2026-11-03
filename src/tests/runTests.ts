import {
  normalizeRFC,
  normalizeName,
  parseNumeric,
  parseDateString,
  sanitizeForExcel,
  stringSimilarity,
  COLUMNAS_OFICIALES_73,
} from '../shared/contratosSchema.js';
import { createSessionToken, verifySessionToken } from '../server/auth.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FALLO: ${message}`);
    failed++;
  }
}

async function runTestSuite() {
  console.log('==================================================');
  console.log('INICIANDO PRUEBAS AUTOMATIZADAS: EXPLORADOR APF');
  console.log('==================================================\n');

  // PRUEBA 1: Normalización de RFC
  console.log('1. Pruebas de Normalización de RFC:');
  assert(normalizeRFC(' bba-830831-lj2 ') === 'BBA830831LJ2', 'Limpia espacios, guiones y convierte a mayúsculas');
  assert(normalizeRFC('cna 980101 xyz') === 'CNA980101XYZ', 'Limpia espacios internos en RFC');
  assert(normalizeRFC('') === '', 'Maneja cadenas vacías');
  assert(normalizeRFC(null as any) === '', 'Maneja null y undefined');

  // PRUEBA 2: Normalización de Nombres y Razones Sociales
  console.log('\n2. Pruebas de Normalización de Nombres:');
  assert(
    normalizeName('CONSTRUCCIÓN Y MONTAJES DEL SURESTE, S.A. DE C.V.') ===
      'CONSTRUCCION Y MONTAJES DEL SURESTE S A DE C V',
    'Elimina diacríticos (acentos) y signos de puntuación'
  );
  assert(
    normalizeName('  pérez   gómez   josé  luis ') === 'PEREZ GOMEZ JOSE LUIS',
    'Colapsa espacios múltiples y quita acentos en nombres propios'
  );

  // PRUEBA 3: Parseo Numérico de Importes
  console.log('\n3. Pruebas de Limpieza de Montos e Importes:');
  assert(parseNumeric('$1,234,567.89') === 1234567.89, 'Parsea montos con símbolo de dólar y comas');
  assert(parseNumeric('   450000.50  ') === 450000.5, 'Parsea montos planos con espacios');
  assert(parseNumeric(null) === 0, 'Valores nulos retornan 0');
  assert(parseNumeric('') === 0, 'Cadena vacía retorna 0');

  // PRUEBA 4: Fechas y Detección de Anomalías
  console.log('\n4. Pruebas de Fechas y Detección de Anomalías:');
  const d1 = parseDateString('15/03/2023');
  assert(d1.normalized === '2023-03-15' && !d1.isAnomaly, 'Parsea DD/MM/AAAA a formato ISO estándar');

  const d2 = parseDateString('2024-08-20 14:30:00');
  assert(d2.normalized === '2024-08-20' && !d2.isAnomaly, 'Parsea AAAA-MM-DD HH:mm:ss');

  const anomalia = parseDateString('01/01/1850');
  assert(anomalia.isAnomaly, 'Detecta correctamente fecha anómala con año histórico o erróneo (1850)');

  // PRUEBA 5: Seguridad y Protección de Fórmulas en Excel
  console.log('\n5. Pruebas de Seguridad contra Inyección de Fórmulas en Excel:');
  assert(sanitizeForExcel('=CMD|" /C calc"!A0') === "'=CMD|\" /C calc\"!A0", 'Antepone comilla simple a fórmulas =');
  assert(sanitizeForExcel('+123456') === "'+123456", 'Protege strings que inician con +');
  assert(sanitizeForExcel('@SUM(A1:B10)') === "'@SUM(A1:B10)", 'Protege strings que inician con @');
  assert(sanitizeForExcel('CONTRATO ORDINARIO') === 'CONTRATO ORDINARIO', 'No altera textos legítimos');

  // PRUEBA 6: Integridad de 73 Columnas y Duplicados
  console.log('\n6. Integridad del Esquema Oficial de 73 Columnas:');
  assert(COLUMNAS_OFICIALES_73.length === 73, 'El esquema oficial contiene exactamente 73 columnas');
  
  const monedas = COLUMNAS_OFICIALES_73.filter(c => c.headerOriginal === 'Moneda');
  assert(monedas.length === 2, 'Contiene 2 columnas Moneda oficiales');
  assert(monedas[0].id === 'moneda_contrato' && monedas[1].id === 'moneda_convenio', 'Monedas diferenciadas correctamente');

  const convenios = COLUMNAS_OFICIALES_73.filter(c => c.headerOriginal === 'Convenio modificatorio');
  assert(convenios.length === 2, 'Contiene 2 columnas Convenio modificatorio oficiales');
  assert(convenios[0].id === 'convenio_modificatorio_ind' && convenios[1].id === 'convenio_modificatorio_tipo', 'Convenios diferenciados correctamente');

  // PRUEBA 7: Seguridad de Autenticación HMAC Web Crypto
  console.log('\n7. Pruebas de Autenticación Administrativa HMAC-SHA256:');
  const secret = 'clave-super-secreta-de-prueba-minimo-32-chars';
  const token = await createSessionToken(secret, 'admin');
  assert(Boolean(token && token.includes('.')), 'Genera token firmado con estructura payload.signature');
  
  const isValid = await verifySessionToken(token, secret);
  assert(isValid === true, 'Token válido es verificado exitosamente');

  const isInvalidSecret = await verifySessionToken(token, 'clave-incorrecta-diferente-1234567890');
  assert(isInvalidSecret === false, 'Token firmado con clave diferente es rechazado');

  // PRUEBA 8: Algoritmo de Similitud Aproximada
  console.log('\n8. Pruebas de Similitud Aproximada de Nombres:');
  const sim1 = stringSimilarity('FARMACEUTICA DEL CENTRO SA DE CV', 'FARMACEUTICA DEL CENTRO S.A. DE C.V.');
  assert(sim1 >= 0.9, `Similitud alta para variaciones de puntuación (${sim1.toFixed(2)})`);

  const sim2 = stringSimilarity('CFE SUMINISTRADOR DE SERVICIOS BASICOS', 'CFE DISTRIBUCION');
  assert(sim2 > 0.2 && sim2 < 0.7, `Similitud parcial para misma entidad (${sim2.toFixed(2)})`);

  console.log('\n==================================================');
  console.log(`RESULTADO FINAL: ${passed} pruebas pasadas, ${failed} falladas.`);
  console.log('==================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Error ejecutando pruebas:', err);
  process.exit(1);
});
