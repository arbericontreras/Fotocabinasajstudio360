/* =====================================================================
   CONFIGURACIÓN COMPARTIDA
   La usan index.html, chatbot.html y asesor.html. Edita todo aquí, una sola vez.
   ===================================================================== */

/* 1) Datos de Firebase (los copias de la consola de Firebase) */
const DB = "https://cabina-de-fotos-4f20d-default-rtdb.firebaseio.com";   // URL de tu Realtime Database (sin "/" al final)
const API_KEY = "AIzaSyD1LkAdkqpAEVBC5aZ8XemYsvMoOC2C7SM";                  // Clave de API web

/* QR de pago del abono de $50.000 (Nequi, Bancolombia, etc.)
   ► AQUÍ VA LA IMAGEN DEL QR: está en la carpeta img/ con el nombre «qr abono.jpeg»
     (si la cambias, cambia también la ruta de abajo). Solo la envía el asesor en línea desde su panel (botón «Enviar QR de reserva»). */
const QR_IMG = "img/qr%20abono.jpeg";

/* 2) Tipos de evento */
const TIPOS = ["Boda","Quince años","Cumpleaños","Fiesta prom","Evento empresarial","Fiesta infantil","Baby shower","Grado","Otro"];

/* Ciudades donde se presta el servicio (el cotizador, el panel y el bot las leen de aquí).
   ► Para agregar una ciudad: ponla en esta lista y, si cobra transporte, agrégala también en RECARGO_CIUDADES_AJ. */
const CIUDADES = ["Bogotá","Zipaquirá","Cajicá","Chía","Soacha","Mosquera","Funza"];

/* 3) Asesores, zonas, precios y planes (ASESORES = números de WhatsApp de respaldo) */
/* ===== CONFIGURACIÓN: zonas y fechas sin disponibilidad ===== */
const NO_SERVICIO = {
  localidades: ["Sumapaz","Usme"],
  barrios: ["Arborizadora Alta", "Arborizadora Baja", "Barlovento", "Bella Vista",
  "Bellavista Jerusalén", "Buenavista Sur",
  "Caracolí", "Compartir", "El Capri", "El Paraíso", "El Tesoro", "Galán Sur", "Ismael Perdomo", "Jerusalén", "La Escala",
  "La Esmeralda", "Las Acacias", "Las Manitas", "Llanos de Chuntame", "Lucero Alto",
  "Lucero Bajo", "Lucero Medio", "Meissen", "Mochuelo Alto",
  "Mochuelo Bajo", "Monteblanco", "Nuestra Señora de la Paz", "Nube de San Antonio",
  "Paraíso Mirador", "Perdomo Alto", "Potosí", "Potosí Jerusalén", "Párroco", "Rincón del Perdomo", "Santo Domingo", "Sierra Morena", "Sotavento", "Tunas Bajo",
  "Vista Hermosa",
  "María Paz", "Patio Bonito", "El Amparo", "Corabastos",
  "La Estanzuela", "Samper Mendoza", "Santa Isabel", "Ricaurte", "Voto Nacional",
  "Las Cruces", "San Bernardo", "La Vera", "Las Nieves", "La Perseverancia",
  "San Bernardino", "Bosa Nova", "Campo Verde",
  "Tibabuyes", "Bilbao", "Lisboa", "El Códito",
  "La Victoria", "Juan Rey", "Diana Turbay", "Molinos",
  "Yomasa", "Santa Librada", "Alfonso López"
  ]
};
const OCUPADAS = {};   /* fecha AAAA-MM-DD -> horas ya reservadas; se llena sola con el panel del asesor */
const avisoCruce = (iso,h) => { const o=OCUPADAS[iso]; if(!o) return "";
  return (h && o.includes(h)) ? "⚠ COINCIDE con un evento ya reservado en la misma fecha y hora." : "⚠ COINCIDE con un evento ya reservado en esta misma fecha (otra hora)."; };
const MENSAJE_NO_DISPONIBLE = "Por el momento no tenemos disponibilidad para ese sector o esa fecha. Puedes probar con otra fecha.";
const BARRIOS_BOGOTA = ["Castilla","Engativá","Suba","Teusaquillo","Los Mártires","Antonio Nariño","Puente Aranda","Candelaria"];
const LOCALIDADES = ["Usaquén","Chapinero","Santa Fe","San Cristóbal","Usme","Tunjuelito","Bosa","Kennedy","Fontibón","Engativá","Suba","Barrios Unidos","Teusaquillo","Los Mártires","Antonio Nariño","Puente Aranda","La Candelaria","Rafael Uribe Uribe","Ciudad Bolívar","Sumapaz"];
const peso = n => "$" + n.toLocaleString("es-CO") + " COP";
const fmtHora = t => { const [h,m]=t.split(":").map(Number); return (h%12||12)+":"+String(m).padStart(2,"0")+(h<12?" a. m.":" p. m."); };
/* Recargos por localidad de Bogotá. Se suman al total SIN mostrarse como una línea aparte: el cliente no los ve.
   ► Para agregar una localidad o cambiar un valor, edita esta lista. */
const RECARGOS = [
  {valor:50000, localidades:["Usaquén","Chapinero","Suba","La Candelaria","Teusaquillo","Engativá","Barrios Unidos","Teusaquillo","Santa Fe","La Candelaria","Chapinero","San Cristóbal"]},
  {valor:30000, localidades:["Fontibón","Puente Aranda","Bosa","Tunjuelito","Antonio Nariño","Los Mártires","Rafael Uribe Uribe"]}
];
const n0 = x => (x||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
const recargoLoc = (ciudad,loc) => { if(n0(ciudad)!=="bogota") return 0;
  const r = RECARGOS.find(x=>x.localidades.some(l=>n0(l)===n0(loc))); return r ? r.valor : 0; };

/* Recargo por fecha: de lunes a viernes, en días PARES del mes (2, 4, 6…), se suma al total.
   El cliente no lo ve: queda incluido en el precio. El valor se puede cambiar desde la pestaña de precios del panel del asesor. */
let RECARGO_PAR_LV = 100000;
const recargoFecha = iso => {
  if(!iso) return 0;
  const [y,m,d] = String(iso).split("-").map(Number);
  if(!y || !m || !d) return 0;
  const dia = new Date(y,m-1,d).getDay();   /* 0 = domingo … 6 = sábado */
  return (dia>=1 && dia<=5 && d%2===0) ? RECARGO_PAR_LV : 0;
};

function precioFinal(p,h,ciudad,loc,iso){
  return p.precios[h-1] + recargoLoc(ciudad,loc) + recargoFecha(iso);
}

/* Recargo de transporte por ciudad fuera de Bogotá (se suma al precio del paquete).
   ► Para cambiar un valor o agregar una ciudad, edita esta lista (el nombre va en minúsculas y sin tildes). */
const RECARGO_CIUDADES_AJ = { zipaquira:250000, cajica:200000, chia:200000, soacha:50000,
  mosquera:100000, funza:120000 };   /* ← Mosquera y Funza: valores SUGERIDOS, cámbialos por los tuyos */
const recargoCiudadAJ = c => RECARGO_CIUDADES_AJ[n0(c)] || 0;
/* Valor NETO que paga el cliente: paquete + zona + fecha + ciudad. Lo usa la cotización en PDF. */
const precioTotal = (p,h,ciudad,loc,iso) => precioFinal(p,h,ciudad,loc,iso) + recargoCiudadAJ(ciudad);

/* ===== Barrios sugeridos por localidad de Bogotá =====
   Es una lista de partida con los barrios principales (no está completa): el cliente también puede escribir
   cualquier otro barrio. Para agregar uno, ponlo en la localidad que corresponde.
   Los barrios sin servicio (NO_SERVICIO) no se sugieren, y Usme y Sumapaz quedan vacías porque no hay servicio. */
const BARRIOS_POR_LOCALIDAD = {
  "Usaquén":["Cedritos","Santa Bárbara","Usaquén","Verbenal","San Cristóbal Norte","Toberín","La Uribe","Country Club","Santa Ana","Santa Paula","Los Cedros","Contador","Cantagallo","Bella Suiza","Servitá","Babilonia","Estrella del Norte","Barrancas","Orquídeas","Santa Cecilia","San Antonio Norte"],
  "Chapinero":["El Nogal","Chicó","Chicó Norte","El Retiro","Rosales","La Cabrera","Quinta Camacho","Chapinero Central","Chapinero Alto","Marly","Antiguo Country","Pardo Rubio","Lago Gaitán","Porciúncula","Bosque Calderón","Sucre","Granada","Emaús","San Isidro","San Luis","El Refugio","Villa del Cerro"],
  "Santa Fe":["La Macarena","Germania","San Martín","Torres del Parque","Parque Central Bavaria","La Alameda","Sagrado Corazón","Lourdes","Veracruz","Santa Fe","Los Laches","San Diego"],
  "San Cristóbal":["20 de Julio","San Blas","La Gloria","Los Libertadores","Villa de los Alpes","Sosiego","Ciudad Londres","Guacamayas","Altamira","Moralba","Victoria","San Vicente"],
  "Usme":[],
  "Tunjuelito":["Venecia","San Carlos","Isla del Sol","Abraham Lincoln","Fátima","Samoré","El Tunal","Ciudad Tunal","Tunjuelito","Meandro del Say"],
  "Bosa":["Bosa Centro","Bosa Occidental","El Porvenir","Brasilia","Antonia Santos","El Recreo","Apogeo","Piamonte","Villa Anny","La Libertad","Chicalá"],
  "Kennedy":["Castilla","Kennedy Central","Timiza","Carvajal","Techo","Roma","Bavaria","Villa Alsacia","Marsella","Nueva Marsella","El Tintal","Calandaima","Class","Las Margaritas","Mandalay","Pastrana","Gran Britalia","Tintalito","Dindalito","Lagos de Castilla","Ciudad Techo","Hipotecho","Villa Nelly","Ciudad Kennedy"],
  "Fontibón":["Fontibón Centro","Modelia","Hayuelos","Capellanía","Salitre Occidental","Puerta de Teja","Versalles","San Pablo","Atahualpa","Villemar","Granjas de Techo","Kasandra","Ferrocaja","Rincón Santo","Zona Franca","Pontevedra"],
  "Engativá":["Engativá Centro","Boyacá Real","Bolivia","Santa Helenita","Las Ferias","Minuto de Dios","Garcés Navas","Villa Luz","Normandía","Quirigua","Álamos Norte","Los Álamos","La Granja","Bonanza","Ciudad Bachué","Villas de Granada","El Muelle"],
  "Suba":["Suba Centro","Niza","La Alhambra","Prado Veraniego","Colina Campestre","Pasadena","Gilmar","Las Villas","Rincón de Suba","Lombardía","Puente Largo","La Campiña","Villa del Prado","Iberia","Cañiza","Casablanca Suba","Santa Rita","San José de Bavaria","Villa Elisa","Costa Azul","Almirante Colón"],
  "Barrios Unidos":["7 de Agosto","Doce de Octubre","Alcázares","La Castellana","Polo Club","Concepción Norte","San Felipe","Los Andes","Entre Ríos","Santa Sofía","Baquero","Benjamín Herrera","Colombia","Rionegro","Simón Bolívar","San Fernando","Metrópolis","Quinta Mutis","Withney"],
  "Teusaquillo":["Teusaquillo","La Soledad","Palermo","Quesada","Galerías","Park Way","La Magdalena","Armenia","Santa Teresita","Pablo VI","Ciudad Salitre Oriental","Nicolás de Federmán","Quinta Paredes","Campín","Belalcázar","Rafael Núñez","Banco Central","Salitre El Greco"],
  "Los Mártires":["Paloquemao","San Victorino","Eduardo Santos","La Sabana","El Listón","La Pepita","El Progreso"],
  "Antonio Nariño":["Restrepo","Santander","Ciudad Jardín","La Fraguita","Policarpa","Sevilla","Villa Mayor","Luna Park","Ciudad Berna","La Hortúa","San Antonio"],
  "Puente Aranda":["Puente Aranda","Ciudad Montes","San Rafael","Zona Industrial","Muzú","Galán","Batallón Caldas","Trinidad Galán","Remanso","Ortezal","Cundinamarca","Alcalá","Pensilvania","Veraguas","La Camelia","Santa Matilde"],
  "La Candelaria":["La Candelaria","La Concordia","Belén","Centro Administrativo","Las Aguas","Egipto"],
  "Rafael Uribe Uribe":["Quiroga","Marruecos","San José","Bravo Páez","Olaya","Claret","Granjas de San Pablo","Country Sur","Gustavo Restrepo","Inglés","Lorenzo Alcantuz","Palermo Sur","Santa Lucía"],
  "Ciudad Bolívar":["Candelaria La Nueva","San Francisco","Quiba"],
  "Sumapaz":[]
};
/* Barrios sugeridos de una localidad (ordenados y sin los que no tienen servicio) */
const barriosDe = loc => (BARRIOS_POR_LOCALIDAD[loc]||[]).filter(b=>!NO_SERVICIO.barrios.some(x=>n0(x)===n0(b))).sort((a,b)=>a.localeCompare(b,"es"));
/* Llena un <datalist> con los barrios de la localidad elegida (solo Bogotá). Si el campo tenía un barrio sugerido
   de otra localidad, lo borra; un barrio escrito a mano se respeta. */
function llenarBarrios(dl,input,ciudad,loc){
  const bog = n0(ciudad)==="bogota", lista = bog ? barriosDe(loc) : [];
  dl.innerHTML = ""; lista.forEach(x=>dl.appendChild(new Option(x)));
  const prev = n0(input.value);
  if(prev && !lista.some(x=>n0(x)===prev) && Object.values(BARRIOS_POR_LOCALIDAD).some(a=>a.some(x=>n0(x)===prev))) input.value = "";
  input.placeholder = !bog ? "Barrio o vereda" : loc ? "Escribe o elige tu barrio" : "Primero elige la localidad"; }
/* Asesores de respaldo: se usan por WhatsApp cuando nadie está en línea en el panel.
   «n» es el nombre corto (chat y panel); «completo» sale en la cotización en PDF. */
const ASESORES = [
  {n:"Angela",      completo:"Angela Fonseca",        w:"573106250804"},
  {n:"Jose Arberi", completo:"Jose Arberi Contreras", w:"573204981495"}
];
const asesorAzar = () => ASESORES[Math.floor(Math.random()*ASESORES.length)];
const wa = (n,t) => `https://wa.me/${n}?text=${encodeURIComponent(t)}`;
const VALOR_APARTADO = 50000;

/* Precios por defecto (1, 2, 3 y 4 horas). Si el asesor los cambia en su panel, esos valores
   se guardan en Firebase (/tarifas) y reemplazan a estos al cargar la página. */
const PLANES = [
  {id:"basico", img:"img/cabina3601.png", nombre:"Cabina 360", desc:"Grabacion de tu video con efectos de audio y video + Página web del evento.", precios:[180000,300000,450000,580000],
   incluye:["Página web de tu evento para descargar fotos y videos, sin costo adicional","Qr para descarga inmediata del video","Plataforma estable de 60 cm"]},
  {id:"pro", img:"img/digital.jpg", nombre:"Digital Pro", desc:"Cabina Digital con efectos(Proms y tira de fotos digital), enviado al instante + Página web del evento.", precios:[200000,370000,540000,680000],
   incluye:["Página web de tu evento para descargar fotos y videos, sin costo adicional","Efectos: confeti, burbujas, corazones, estrellas","Música y cámara lenta","Envío inmediato  (requiere internet)"]},
  {id:"tira", img:"img/impresion-tira.jpg", nombre:"Impresión en tira", desc:"Fotocabina con recuerdos físicos impresos al momento + Página web del evento.", precios:[220000,390000,560000,700000],
   incluye:["Página web de tu evento para descargar fotos y videos, sin costo adicional","Tira impresa con tres fotos","Personalización con el logo del evento","Accesorios (props) incluidos"]},
  {id:"completo", img:"img/fusion.png", nombre:"Completo", desc:"Cabina 360 y fotocabina impresión tira: la experiencia completa + Página web del evento.", precios:[300000,420000,600000,790000],
   incluye:["Página web de tu evento para descargar fotos y videos, sin costo adicional","Tira impresa con tres fotos + logo","Videos digitales inmediatos","Experiencia 360 + fotocabina de impresión"]},
  {id:"premium", img:"img/full.jpg", nombre:"Full Premium", desc:"Cabina 360 + fotocabina digital y fotocabina impresión tira: la experiencia más completa + Página web del evento.", precios:[380000,500000,680000,870000],
   incluye:["Página web de tu evento para descargar fotos y videos, sin costo adicional","Tira impresa y digital con tres fotos + logo","Videos digitales inmediatos","Experiencia 360 + fotocabina de impresión + fotos con proms digitales y efectos"]},
  /* ► SERVICIO NUEVO. La foto va en la carpeta img/ con el nombre «doble-cabina.jpg» (si usas otro nombre o formato, cámbialo aquí en img).
       «nuevo:true» muestra la insignia NUEVO en el cotizador. Para quitarla más adelante, borra «nuevo:true,». */
  {id:"duo", nuevo:true, img:"img/doble-cabina.jpg", nombre:"Doble Cabina", desc:"2 cabinas con impresión en tira funcionando al mismo tiempo + foto digital + Página web del evento.", precios:[360000,540000,720000,900000],
   incluye:["Página web de tu evento para descargar fotos y videos, sin costo adicional","2 cabinas con impresión en tira al mismo tiempo: menos espera para tus invitados","Tira impresa con tres fotos + logo en cada cabina","Foto digital enviada al instante al celular","Accesorios (props) incluidos"]}
];

/* ¿Hay un asesor conectado? El panel de asesores marca su presencia cada 20 segundos. */
const asesorEnLinea = () => fetch(`${DB}/presence.json`).then(r=>r.json()).then(p=>!!(p && Date.now()-p.ts<60000));

/* ===== Utilidades ===== */
const norm = n0;
const sinServicio = (loc,b) => NO_SERVICIO.localidades.some(l=>norm(l)===norm(loc)) || NO_SERVICIO.barrios.some(x=>norm(x)===norm(b));
const horasMedias = () => Array.from({length:48},(_,i)=>{ const v=String(i>>1).padStart(2,"0")+":"+(i%2?"30":"00"); return [v,fmtHora(v)]; });
function parseTel(t){ let d=String(t||"").replace(/\D/g,""); if(d.length===12&&d.startsWith("57")) d=d.slice(2); return /^\d{10}$/.test(d)?d:null; }

/* Precios editados por el asesor: /tarifas = { planes:{ basico:[p1,p2,p3,p4], pro:[...], ... }, recargoPar: 100000 }
   Se valida todo: si algo viene mal (vacío, texto, negativo), se ignora y quedan los precios por defecto. */
function aplicarTarifas(t){
  if(!t || typeof t!=="object") return;
  if(t.planes) PLANES.forEach(p=>{
    let a = t.planes[p.id];
    if(a && !Array.isArray(a) && typeof a==="object") a = Object.values(a);
    if(Array.isArray(a) && a.length===4 && a.every(n=>Number.isFinite(n) && n>0)) p.precios = a.slice();
  });
  if(Number.isFinite(t.recargoPar) && t.recargoPar>=0) RECARGO_PAR_LV = t.recargoPar;
}
fetch(`${DB}/tarifas.json`).then(r=>r.json()).then(t=>{
  aplicarTarifas(t);
  if(typeof render==="function") render();
}).catch(()=>{});

/* Fechas ya reservadas (las registra el asesor en su panel) */
fetch(`${DB}/ocupadas.json`).then(r=>r.json()).then(o=>{
  if(o) Object.entries(o).forEach(([f,v])=>{ OCUPADAS[f]=(v&&typeof v==="object")?Object.values(v).map(String):[""]; });
  if(typeof render==="function") render();
}).catch(()=>{});