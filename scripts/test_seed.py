"""Prueba sin datos reales: 7 CSV sintéticos con el mismo layout oficial."""
import csv
import json
import sqlite3
import subprocess
import sys
import tempfile
from pathlib import Path

with tempfile.TemporaryDirectory() as tmp:
    root = Path(tmp)
    csv_dir = root / "csv"
    csv_dir.mkdir()
    dest = root / "contratos_apf.db"
    headers = [f"campo_{i}" for i in range(73)]
    for idx, head in {
        4: "Clave Institución", 6: "Institución", 23: "Número de procedimiento",
        35: "Código del contrato", 44: "Importe DRC", 45: "Moneda",
        46: "Convenio modificatorio", 51: "Monto sin imp./mínimo",
        55: "Moneda", 56: "Convenio modificatorio", 64: "rfc",
        65: "Proveedor o contratista", 72: "Dirección del anuncio",
    }.items():
        headers[idx] = head
    for year in range(2020, 2027):
        row = [""] * 73
        row[4] = "012ABC"
        row[6] = "DEPENDENCIA DE PRUEBA"
        row[23] = "AA-123"
        row[35] = f"C-{year}-TEST"
        row[37] = "Contrato de prueba"
        row[41] = "20/03/2023"
        row[42] = "25/03/2023"
        row[44] = "123.45"
        row[45] = "MXN"
        row[46] = "NO"
        row[55] = "USD"
        row[56] = "SÍ"
        row[64] = " aBc010101xyz "
        row[65] = "Ángela Núñez"
        row[72] = "https://example.org/test"
        filename = f"CONTRATOS_{'COMPRANET' if year < 2025 else 'COMPRASMX'}_{year}.CSV"
        with (csv_dir / filename).open("w", encoding="cp1252", newline="") as stream:
            writer = csv.writer(stream)
            writer.writerow(headers)
            writer.writerow(row)
    result = subprocess.run(
        [sys.executable, str(Path(__file__).with_name("generar_bd_contratos.py")),
         "--source", str(csv_dir), "--output", str(dest)],
        capture_output=True, text=True, check=True,
    )
    conn = sqlite3.connect(str(dest))
    assert conn.execute("SELECT COUNT(*) FROM contratos").fetchone()[0] == 7
    assert conn.execute("SELECT COUNT(*) FROM archivos_importados").fetchone()[0] == 7
    assert conn.execute("PRAGMA integrity_check").fetchone()[0] == "ok"
    sample = conn.execute("""SELECT rfc_proveedor, nombre_proveedor_norm,
        importe_contrato, raw_data_json FROM contratos LIMIT 1""").fetchone()
    assert sample[:3] == ("ABC010101XYZ", "ANGELA NUNEZ", 123.45)
    raw = json.loads(sample[3])
    assert raw["Moneda_1"] == "MXN" and raw["Moneda_2"] == "USD"
    assert raw["Convenio modificatorio_1"] == "NO"
    assert raw["Convenio modificatorio_2"] == "SÍ"
    conn.close()
    print("PASS 7 CSV, 7 registros, 73 columnas, RFC, tildes, importes y encabezados repetidos")
