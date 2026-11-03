# EXPLORADOR DE CONTRATOS APF (2020 - 2026)

Buscador público y plataforma analítica de contratos gubernamentales de la Administración Pública Federal (APF) de México, consolidando las bases oficiales de **CompraNet** (2020 a 2024) y **Compras MX** (2025 y 2026).

Diseñado para funcionar **100% bajo planes gratuitos**, sin tarjeta bancaria, con persistencia permanente en **Turso Cloud** y alojamiento distribuido en **Cloudflare Workers**.

---

## 🏛️ Características Principales

1. **Base de Datos Permanente (535,022 contratos):**
   - Almacenamiento indexado en Turso Cloud (SQLite distribuido).
   - Disponible las 24 horas del día aunque tu computadora personal esté apagada.
   - Preservación íntegra de las **73 columnas oficiales**, sin perder datos ni eliminar contratos con códigos repetidos asociados a proveedores distintos.

2. **Privacidad Absoluta de Consultas (Regla Mandatoria):**
   - Las búsquedas de los visitantes se procesan exclusivamente en memoria volátil (RAM).
   - **Cero registros:** no se almacena ningún nombre, RFC o consulta en Turso, SQLite, logs ni historial local (`Cache-Control: no-store`).
   - Sin herramientas de rastreo ni llamadas a inteligencias artificiales externas.

3. **Búsqueda Individual y Masiva (Excel Copy-Paste):**
   - Permite pegar directamente 2 columnas desde Excel (`Nombre \t RFC`) o listas mixtas.
   - Coincidencia exacta por RFC, coincidencia exacta por nombre normalizado y candidatos por similitud aproximada.
   - Paginación del lado del servidor para no sobrecargar el navegador.

4. **Exportación Segura a Excel (.xlsx):**
   - Generación de libros de trabajo en el navegador con estilos institucionales APF.
   - Protección contra inyección de fórmulas de Excel (CSV/Formula Injection).
   - Pestaña independiente para descargar los términos sin coincidencias.

5. **Importador por Fragmentos (Chunking en Navegador):**
   - Decodificación nativa de **Windows-1252** para preservar tildes y caracteres especiales.
   - Manejo diferenciado de encabezados duplicados (`Moneda_1`, `Moneda_2`, `Convenio_1`, `Convenio_2`).
   - Capacidad de subir archivos de más de 150 MB (ej. 2023 con 169k filas) mediante micro-lotes sin exceder los límites de CPU de Cloudflare Workers Free.

---

## 🚀 Guía Paso a Paso para Principiantes (Despliegue Gratuito)

No necesitas experiencia previa en administración de servidores ni bases de datos. Sigue estos 12 pasos ordenados:

### Paso 1: Crear tus 3 cuentas gratuitas (Sin tarjeta bancaria)
Crea una cuenta gratuita con tu correo electrónico o cuenta de Google en los siguientes tres servicios:
1. **GitHub:** [https://github.com](https://github.com) (almacén de tu código).
2. **Turso Cloud:** [https://turso.tech](https://turso.tech) (base de datos SQLite permanente).
3. **Cloudflare:** [https://dash.cloudflare.com](https://dash.cloudflare.com) (servidor público y buscador web).

---

### Paso 2: Crear la base de datos en Turso
1. Inicia sesión en [Turso.tech](https://turso.tech).
2. En tu panel principal, haz clic en el botón azul **"Create database"**.
3. En el campo de nombre escribe: `contratos-apf`.
4. Elige el motor estándar de Turso y una región cercana (por ejemplo `us-east` o `iad`).
5. Haz clic en **"Create"**. La base se creará en 2 segundos.

---

### Paso 3: Obtener la URL y el Token de Turso
1. En la página de tu base `contratos-apf`, localiza la **Database URL**. Verás una dirección como:
   `libsql://contratos-apf-tu-usuario.turso.io`
   *(Copia y guarda esta URL)*.
2. Haz clic en la pestaña **"Tokens"** o en el botón **"Generate Token"**.
3. asígnale un nombre (ej. `token-apf`) y pulsa **"Create"**.
4. Copia el token alfanumérico generado.
   *(Copia y guarda este Token en un bloc de notas seguro)*.

---

### Paso 4: Exportar el proyecto de Google AI Studio a GitHub
1. En la esquina superior derecha de Google AI Studio Build, haz clic en el botón **"Export"** o el icono de **GitHub**.
2. Conecta tu cuenta de GitHub.
3. Elige un nombre para el repositorio, por ejemplo: `explorador-contratos-apf`.
4. Selecciónalo como **Private** (Privado) o **Public** (Público) según tu preferencia.
5. Confirma la exportación. En unos segundos tu repositorio en GitHub tendrá todo el código del proyecto.

---

### Paso 5: Conectar GitHub con Cloudflare Workers
1. Entra a tu cuenta en [Cloudflare Dashboard](https://dash.cloudflare.com).
2. En el menú lateral izquierdo ve a **Workers & Pages** → haz clic en **Create application**.
3. Selecciona la pestaña **Pages** o **Workers** y pulsa **"Connect to Git"**.
4. Autoriza a Cloudflare para acceder a tu GitHub y selecciona el repositorio `explorador-contratos-apf`.
5. En la sección **Build settings** (Ajustes de compilación):
   - **Framework preset:** None (o Vite).
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
6. Haz clic en **"Save and Deploy"**.

---

### Paso 6: Configurar las 4 Variables y Secretos en Cloudflare
Para que el Worker se conecte a Turso y proteja tu panel administrativo:
1. En Cloudflare, ve a tu Worker recién creado → entra en **Settings** → **Variables and Secrets**.
2. Haz clic en **"Add"** y crea las siguientes **4 variables tipo Secret**:

| Variable | Tipo | Valor |
|---|---|---|
| `TURSO_DATABASE_URL` | Secret | La URL de Turso (`libsql://contratos-apf-...turso.io`) |
| `TURSO_AUTH_TOKEN` | Secret | El token que generaste en Turso |
| `ADMIN_PASSWORD` | Secret | Una contraseña segura que tú inventes para el panel de administración |
| `ADMIN_SESSION_SECRET` | Secret | Una clave aleatoria de al menos 32 caracteres (ej: `k9!mX7#pQ2@vL8$zW1*rT4^yU6&bE3%t`) |

3. Guarda los cambios y pulsa **"Deploy"** o **"Redeploy"** para que tomen efecto.

---

### Paso 7: Publicar la aplicación y abrir el enlace
Cloudflare te proporcionará un enlace público gratuito tipo:
`https://explorador-contratos-apf.tu-subdominio.workers.dev`

Abre ese enlace en tu navegador. El buscador ya está activo y disponible públicamente.

---

### Paso 8: Abrir el Panel Administrativo
1. En tu aplicación publicada, haz clic en la pestaña superior **"Administración"**.
2. Introduce la contraseña que configuraste en `ADMIN_PASSWORD`.
3. Verás el indicador verde de conexión: **Turso Cloud (Remoto)**.
4. Haz clic en el botón **"Verificar Tablas e Índices"** para asegurarte de que las tablas `contratos` y `archivos_importados` estén listas.

---

### Paso 9: Importar los 7 archivos CSV (Orden recomendado)
Sube los archivos uno por uno desde el panel, comenzando por los más pequeños para verificar el funcionamiento:

1. **`CONTRATOS_COMPRANET_2020.CSV`** (5 filas — se carga en 1 segundo).
2. **`CONTRATOS_COMPRANET_2021.CSV`** (31 filas).
3. **`CONTRATOS_COMPRANET_2022.CSV`** (1,678 filas).
4. **`CONTRATOS_COMPRANET_2024.CSV`** (146,509 filas).
5. **`CONTRATOS_COMPRASMX_2025.CSV`** (128,880 filas).
6. **`CONTRATOS_COMPRASMX_2026.CSV`** (88,089 filas).
7. **`CONTRATOS_COMPRANET_2023.CSV`** (169,830 filas — el más grande, ~160 MB).

El importador calculará la huella SHA-256, verificará las 73 columnas, preservará las tildes con Windows-1252 y enviará micro-lotes progresivos mostrando velocidad en filas/segundo. Puedes pausar o reanudar si lo requieres.

---

### Paso 10: Comprobar los 535,022 registros
Al finalizar la carga de los 7 archivos:
1. Revisa la tarjeta de resumen en el panel de administración: el contador debe marcar exactamente **535,022 contratos**.
2. El consumo de almacenamiento reportará aproximadamente **640 MB**, quedando más de 4.3 GB libres dentro de tu cuota de 5 GB gratis en Turso.

---

### Paso 11: Probar el buscador público y compartir el enlace
1. Abre tu URL en una ventana de incógnito o en tu teléfono celular.
2. Realiza búsquedas de proveedores, personas físicas, RFC o pega una lista desde Excel.
3. Comprueba que las fichas se abren con las 73 columnas y los enlaces a los anuncios oficiales.
4. Descarga reportes en Excel.
5. Comparte la URL con cualquier usuario; nadie necesita registrarse ni instalar nada.

---

### Paso 12: Cómo actualizar la información en el futuro
Cuando la Secretaría de Anticorrupción y Buen Gobierno publique un nuevo CSV en:
[https://comprasmx.buengobierno.gob.mx/datos-abiertos](https://comprasmx.buengobierno.gob.mx/datos-abiertos)

1. Entra a tu **Panel Administrativo**.
2. En la tabla de archivos cargados, haz clic en el icono de papelera junto al año que vas a actualizar para retirar la versión anterior.
3. Selecciona el nuevo CSV y pulsa **Iniciar Carga por Fragmentos**.
4. La base se actualizará limpiamente sin crear registros duplicados.

---

## 🛠️ Ejecución Local en Desarrollo

Si deseas ejecutar o modificar el proyecto en tu computadora local:

```bash
# 1. Instalar dependencias
npm install

# 2. Ejecutar suite de pruebas automáticas (27 tests)
npm test

# 3. Iniciar servidor local de desarrollo (Puerto 3000)
npm run dev
```

En desarrollo local, el sistema crea automáticamente una base SQLite local (`file:contratos_local.db`) si no defines credenciales de Turso en tu archivo `.env`.

---

## 🔒 Privacidad y Cumplimiento Normativo
- **Cero Telemetría:** Sin Google Analytics, sin Meta Pixel, sin cookies de seguimiento.
- **Consultas Efímeras:** Las listas cargadas por los usuarios se descartan inmediatamente al cerrar la pestaña.
- **Protección contra Inyección:** Consultas SQL parametrizadas con `?` y desinfección de celdas en hojas de cálculo contra comandos maliciosos.
