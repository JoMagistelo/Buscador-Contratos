#!/usr/bin/env python3
"""Convierte los siete CSV oficiales de CompraNet/Compras MX a una base SQLite
compatible con la tabla contratos de este repositorio.

No requiere paquetes externos: solo Python 3.10+.
Uso:
  py scripts/generar_bd_contratos.py --source "C:\Ruta\CSV" --output "C:\Ruta\contratos_apf.db"

Los archivos originales NUNCA se modifican. No contiene nombres buscados por usuarios.
"""
import argparse
import csv
import hashlib
import json
import re
import sqlite3
import unicodedata
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

SCHEMA = """
CREATE TABLE IF NOT EXISTS contratos (
 id TEXT PRIMARY KEY, codigo_contrato TEXT, titulo_contrato TEXT,
 descripcion_contrato TEXT, fecha_inicio TEXT, fecha_fin TEXT,
 importe_contrato REAL, moneda TEXT, estatus_contrato TEXT,
 convenio_modificatorio_ind TEXT, monto_convenio REAL, plazo_convenio TEXT,
 fecha_firma_convenio TEXT, moneda_convenio TEXT, convenio_modificatorio_tipo TEXT,
 clave_institucion TEXT, nombre_institucion TEXT, siglas_institucion TEXT,
 unidad_compradora TEXT, codigo_procedimiento TEXT, caracter_procedimiento TEXT,
 tipo_procedimiento TEXT, forma_procedimiento TEXT, rfc_proveedor TEXT,
 nombre_proveedor TEXT, nombre_proveedor_norm TEXT, direccion_anuncio TEXT,
 monto_adjudicado REAL, monto_ejercido REAL, monto_pagado REAL,
 monto_total_impuestos REAL, importe_drc REAL, importe_mfij REAL,
 year_file INTEGER, file_sha256 TEXT, row_index INTEGER, raw_data_json TEXT
);
CREATE TABLE IF NOT EXISTS archivos_importados (
 sha256 TEXT PRIMARY KEY, nombre_archivo TEXT, year INTEGER, total_filas INTEGER,
 filas_importadas INTEGER, filas_anomalas INTEGER, tamano_bytes INTEGER,
 estado TEXT, fecha_importacion TEXT, detalles_json TEXT
);
"""
INDEXES = """
CREATE INDEX IF NOT EXISTS idx_contratos_rfc ON contratos(rfc_proveedor);
CREATE INDEX IF NOT EXISTS idx_contratos_nombre_norm ON contratos(nombre_proveedor_norm);
CREATE INDEX IF NOT EXISTS idx_contratos_codigo ON contratos(codigo_contrato);
CREATE INDEX IF NOT EXISTS idx_contratos_year ON contratos(year_file);
CREATE INDEX IF NOT EXISTS idx_contratos_siglas ON contratos(siglas_institucion);
CREATE INDEX IF NOT EXISTS idx_contratos_file ON contratos(file_sha256);
"""
COLS = [
    "id", "codigo_contrato", "titulo_contrato", "descripcion_contrato", "fecha_inicio",
    "fecha_fin", "importe_contrato", "moneda", "estatus_contrato", "convenio_modificatorio_ind",
    "monto_convenio", "plazo_convenio", "fecha_firma_convenio", "moneda_convenio",
    "convenio_modificatorio_tipo", "clave_institucion", "nombre_institucion",
    "siglas_institucion", "unidad_compradora", "codigo_procedimiento",
    "caracter_procedimiento", "tipo_procedimiento", "forma_procedimiento",
    "rfc_proveedor", "nombre_proveedor", "nombre_proveedor_norm", "direccion_anuncio",
    "monto_adjudicado", "monto_ejercido", "monto_pagado", "monto_total_impuestos",
    "importe_drc", "importe_mfij", "year_file", "file_sha256", "row_index", "raw_data_json",
]
SQL_INSERT = "INSERT INTO contratos (" + ",".join(COLS) + ") VALUES (" + ",".join("?" for _ in COLS) + ")"

def sha256_file(path):
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for data in iter(lambda: stream.read(4 * 1024 * 1024), b""):
            h.update(data)
    return h.hexdigest()

def normalize_name(value):
    s = unicodedata.normalize("NFD", (value or "").upper())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return " ".join(re.sub(r"[^A-Z0-9 ]", " ", s).split())

def normalize_rfc(value):
    return re.sub(r"[^A-Z0-9&Ñ]", "", (value or "").upper())

def parse_date(value):
    s = (value or "").strip()
    if not s:
        return ""
    match = re.match(r"^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s|$)", s)
    if match:
        day, month, year = map(int, match.groups())
        return f"{year:04d}-{month:02d}-{day:02d}"
    match = re.match(r"^(\d{4})[/-](\d{1,2})[/-](\d{1,2})(?:\s|$)", s)
    if match:
        year, month, day = map(int, match.groups())
        return f"{year:04d}-{month:02d}-{day:02d}"
    return s

def amount(value):
    s = (value or "").strip()
    if not s:
        return 0.0
    try:
        return float(s.replace(",", "").replace("$", "").replace("€", "").replace(" ", ""))
    except (ValueError, OverflowError):
        return 0.0

def distinct_headers(headers):
    counts = Counter(headers)
    seen = Counter()
    result = []
    for h in headers:
        seen[h] += 1
        result.append(f"{h}_{seen[h]}" if counts[h] > 1 else h)
    return result

def make_row(values, unique_headers, year, sha, row_index):
    g = lambda pos: values[pos].strip()
    drc, mfij_min, mfij_max = g(44), g(51), g(53)
    display_amount = drc or mfij_min or mfij_max
    currency = g(45) if drc else (g(55) or g(45))
    provider = g(65)
    raw = json.dumps(dict(zip(unique_headers, values)), ensure_ascii=False, separators=(",", ":"))
    return (
        f"{sha[:12]}_{year}_{row_index}",
        g(35), g(37), g(38), parse_date(g(41)), parse_date(g(42)),
        amount(display_amount), currency.upper(), g(40) or g(48), g(46),
        0.0, g(58), g(63), g(55).upper(), g(56),
        g(4), g(6), g(5).upper(), g(8), g(23), g(25), g(14), g(26),
        normalize_rfc(g(64)), provider, normalize_name(provider), g(72),
        0.0, 0.0, 0.0, 0.0, amount(drc), amount(mfij_min),
        year, sha, row_index, raw,
    )

def main():
    parser = argparse.ArgumentParser(description="Generar contratos_apf.db sin modificar CSV originales")
    parser.add_argument("--source", required=True, help="Carpeta con los siete CONTRATOS_*.CSV")
    parser.add_argument("--output", default="contratos_apf.db", help="Ruta final del archivo SQLite")
    parser.add_argument("--batch", type=int, default=2000)
    args = parser.parse_args()
    files = sorted(Path(args.source).glob("CONTRATOS_*.CSV"))
    if len(files) != 7:
        parser.error(f"Se requieren exactamente 7 CSV; se encontraron {len(files)}")
    target = Path(args.output).resolve()
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists():
        parser.error(f"Ya existe {target}. No se sobrescribe para evitar pérdida de datos.")
    db = sqlite3.connect(str(target))
    db.execute("PRAGMA journal_mode=WAL")
    db.execute("PRAGMA synchronous=NORMAL")
    db.executescript(SCHEMA)
    reference = None
    total = 0
    try:
        for file in files:
            year_match = re.search(r"20\d{2}", file.name)
            if not year_match:
                raise ValueError(f"Nombre sin año: {file.name}")
            year = int(year_match.group())
            file_hash = sha256_file(file)
            with file.open("r", encoding="cp1252", errors="replace", newline="") as stream:
                csv_reader = csv.reader(stream)
                headers = next(csv_reader)
                if len(headers) != 73:
                    raise ValueError(f"{file.name}: {len(headers)} columnas (se esperaban 73)")
                # Proteger contra archivos que tienen 73 columnas, pero distinto orden.
                required_headers = {
                    4: "Clave Institución", 6: "Institución", 23: "Número de procedimiento",
                    35: "Código del contrato", 44: "Importe DRC", 45: "Moneda",
                    51: "Monto sin imp./mínimo", 55: "Moneda", 64: "rfc",
                    65: "Proveedor o contratista", 72: "Dirección del anuncio",
                }
                for position, expected_header in required_headers.items():
                    if headers[position].strip() != expected_header:
                        raise ValueError(
                            f"{file.name}, columna {position + 1}: "
                            f"encabezado {headers[position]!r}, se esperaba {expected_header!r}"
                        )
                if reference is None:
                    reference = headers
                elif headers != reference:
                    raise ValueError(f"El encabezado de {file.name} no coincide con los otros CSV")
                names = distinct_headers(headers)
                rows, count = [], 0
                for row in csv_reader:
                    if not row or (len(row) == 1 and not row[0].strip()):
                        continue
                    count += 1
                    if len(row) != 73:
                        raise ValueError(f"{file.name} registro {count}: {len(row)} campos, esperado 73")
                    rows.append(make_row(row, names, year, file_hash, count))
                    if len(rows) >= args.batch:
                        db.executemany(SQL_INSERT, rows)
                        db.commit()
                        rows.clear()
                if rows:
                    db.executemany(SQL_INSERT, rows)
                    db.commit()
            db.execute(
                """INSERT INTO archivos_importados
                (sha256,nombre_archivo,year,total_filas,filas_importadas,filas_anomalas,
                 tamano_bytes,estado,fecha_importacion,detalles_json)
                VALUES (?,?,?,?,?,?,?,?,?,?)""",
                (file_hash, file.name, year, count, count, 0, file.stat().st_size,
                 "completado", datetime.now(timezone.utc).isoformat(),
                 json.dumps({"columnas": 73, "fuente": "CSV oficial", "codificacion": "Windows-1252",
                             "sha256": "completo"}, ensure_ascii=False)),
            )
            db.commit()
            total += count
            print(f"{file.name}: {count:,} registros; acumulado {total:,}", flush=True)
        print("Creando índices...", flush=True)
        db.executescript(INDEXES)
        db.execute("ANALYZE")
        db.commit()
        db.execute("PRAGMA wal_checkpoint(TRUNCATE)")
        integrity = db.execute("PRAGMA integrity_check").fetchone()[0]
        records = db.execute("SELECT COUNT(*) FROM contratos").fetchone()[0]
        metadata = db.execute("SELECT COUNT(*) FROM archivos_importados").fetchone()[0]
        if integrity != "ok" or records != total or metadata != 7:
            raise RuntimeError(f"Falló verificación: integridad={integrity}, filas={records}, archivos={metadata}")
        print(f"VALIDADO: {records:,} contratos, 7 CSV, {target.stat().st_size:,} bytes. Archivo: {target}", flush=True)
        if records != 535022:
            print("AVISO: el total difiere de la versión de CSV original (535,022). Revisar si hubo actualizaciones.")
    finally:
        db.close()

if __name__ == "__main__":
    main()
