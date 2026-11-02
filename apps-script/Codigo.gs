/**
 * AJ Studio · Portal "Mis fotos y videos"
 * Cada evento = una subcarpeta dentro de CARPETA_EVENTOS, y el NOMBRE de la subcarpeta es el código.
 * Ejemplo: BODA-ANA-0612
 *
 * IMPORTANTE: este script usa el servicio avanzado "Drive API" (mucho más rápido que DriveApp).
 * Actívalo una sola vez: en el editor de Apps Script → Servicios (+) → Drive API → versión v3 → Agregar.
 *
 * Parámetros que recibe:
 *   ?codigo=XXX              → todos los archivos del evento
 *   ?codigo=XXX&desde=MS     → solo los archivos subidos después de esa fecha (milisegundos); responde parcial:true
 *   ?codigo=XXX&archivo=ID   → el archivo en base64 (lo usa el iPhone para guardarlo en Fotos)
 */

// 1) Pega aquí el ID de tu carpeta principal de Drive (lo que va después de /folders/ en su URL)
const CARPETA_EVENTOS = "1Q3-roj58S_Z84D1FaS3msvVY7au-4Cuw";
const MAX_B64 = 25 * 1024 * 1024;   // archivos más grandes se descargan con el enlace normal

// Respuesta JSON para la página web
function doGet(e) {
  const p = (e && e.parameter) || {};
  const codigo = (p.codigo || "").trim().toUpperCase();
  if (!codigo) return salida({ ok: false, error: "Falta el código del evento." });

  const evento = buscarCarpeta(codigo);
  if (!evento) return salida({ ok: false, error: "No encontramos ese código. Revisa que esté bien escrito." });

  if (p.archivo) return archivoB64(evento, p.archivo);

  // Una sola consulta a Drive trae hasta 1000 archivos con todos sus datos
  const desde = Number(p.desde) || 0;
  let q = "'" + evento.id + "' in parents and trashed = false and (mimeType contains 'image/' or mimeType contains 'video/')";
  if (desde > 0) q += " and createdTime > '" + new Date(desde).toISOString() + "'";

  const archivos = listar(q, "id,name,mimeType,createdTime,permissionIds").map(function (f) {
    // Para que se pueda ver y descargar sin iniciar sesión en Google (solo se toca la primera vez)
    const permisos = f.permissionIds || [];
    if (permisos.indexOf("anyoneWithLink") < 0 && permisos.indexOf("anyone") < 0) compartir(f.id);
    return {
      id: f.id,
      nombre: f.name,
      tipo: f.mimeType.indexOf("video/") === 0 ? "video" : "foto",
      fecha: new Date(f.createdTime).getTime(),
      thumb: "https://drive.google.com/thumbnail?id=" + f.id + "&sz=w600",
      ver: "https://drive.google.com/file/d/" + f.id + "/preview",
      descargar: "https://drive.google.com/uc?export=download&id=" + f.id
    };
  });
  archivos.sort(function (a, b) { return a.fecha - b.fecha; });
  return salida({ ok: true, evento: evento.name, archivos: archivos, parcial: desde > 0 });
}

// Busca la carpeta del evento por su nombre y la recuerda 6 horas para no buscarla en cada visita
function buscarCarpeta(codigo) {
  const cache = CacheService.getScriptCache();
  const guardada = cache.get("carpeta_" + codigo);
  if (guardada) return JSON.parse(guardada);

  const base = "'" + CARPETA_EVENTOS + "' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false";
  const nombre = codigo.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  let r = listar(base + " and name = '" + nombre + "'", "id,name");
  if (!r.length) {   // la carpeta tiene minúsculas o espacios de más: se revisan todas
    r = listar(base, "id,name").filter(function (c) { return c.name.trim().toUpperCase() === codigo; });
  }
  if (!r.length) return null;
  const evento = { id: r[0].id, name: r[0].name };
  cache.put("carpeta_" + codigo, JSON.stringify(evento), 21600);
  return evento;
}

// Consulta a Drive de 1000 en 1000
function listar(q, campos) {
  const out = [];
  let token;
  do {
    const r = Drive.Files.list({ q: q, fields: "nextPageToken,files(" + campos + ")", pageSize: 1000, pageToken: token });
    (r.files || []).forEach(function (f) { out.push(f); });
    token = r.nextPageToken;
  } while (token);
  return out;
}

function compartir(id) {
  try { DriveApp.getFileById(id).setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); }
  catch (err) { console.warn("No se pudo compartir " + id + ": " + err); }
}

// El iPhone pide el archivo en base64 para poder guardarlo directo en Fotos
function archivoB64(evento, id) {
  let f;
  try { f = Drive.Files.get(id, { fields: "id,name,mimeType,size,parents" }); }
  catch (err) { return salida({ ok: false, error: "Archivo no encontrado." }); }
  if ((f.parents || []).indexOf(evento.id) < 0) return salida({ ok: false, error: "Archivo no encontrado." });
  if (Number(f.size) > MAX_B64) return salida({ ok: false, error: "Archivo muy grande." });
  const blob = DriveApp.getFileById(id).getBlob();
  return salida({ ok: true, nombre: f.name, mime: f.mimeType, b64: Utilities.base64Encode(blob.getBytes()) });
}

function salida(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Atajo para crear la carpeta de un nuevo evento:
 * cambia el texto de abajo, selecciona "crearEvento" arriba y pulsa Ejecutar.
 */
function crearEvento() {
  const codigo = "BODA-ANA-0612";
  DriveApp.getFolderById(CARPETA_EVENTOS).createFolder(codigo);
  Logger.log("Carpeta creada: " + codigo);
}
