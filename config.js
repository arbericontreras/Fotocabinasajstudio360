/* =====================================================================
   CONFIGURACIÓN COMPARTIDA
   La usan index.html, chatbot.html y asesor.html. Edita todo aquí, una sola vez.
   ===================================================================== */

/* 1) Datos de Firebase (los copias de la consola de Firebase) */
const DB = "https://cabina-de-fotos-4f20d-default-rtdb.firebaseio.com";   // URL de tu Realtime Database (sin "/" al final)
const API_KEY = "AIzaSyD1LkAdkqpAEVBC5aZ8XemYsvMoOC2C7SM";                  // Clave de API web

/* QR de pago del abono de $50.000 (Nequi, Bancolombia, etc.)
   ► AQUÍ VA LA IMAGEN DEL QR: guarda tu imagen en la carpeta img/ con el nombre qr-reserva.png
     (o cambia la ruta de abajo). Solo la envía el asesor en línea desde su panel (botón «Enviar QR de reserva»). */
const QR_IMG = "img/qr-reserva.png";

/* 2) Tipos de evento */
const TIPOS = ["Boda","Quince años","Cumpleaños","Fiesta prom","Evento empresarial","Fiesta infantil","Baby shower","Grado","Otro"];

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
const RECARGO_NORTE = 50000;
const LOCALIDADES_NORTE = ["Usaquén","Chapinero","Suba","La Candelaria","Teusaquillo"];
const n0 = x => (x||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
const esNorte = loc => LOCALIDADES_NORTE.some(l=>n0(l)===n0(loc));
function precioFinal(p,h,ciudad,loc){
  return p.precios[h-1] + ((n0(ciudad)==="bogota" && esNorte(loc)) ? RECARGO_NORTE : 0);
}
/* Asesores de respaldo: se usan por WhatsApp cuando nadie está en línea en el panel */
const ASESORES = [
  {n:"Angela",      w:"573106250804"},
  {n:"Jose Arberi", w:"573204981495"}
];
const asesorAzar = () => ASESORES[Math.floor(Math.random()*ASESORES.length)];
const wa = (n,t) => `https://wa.me/${n}?text=${encodeURIComponent(t)}`;
const VALOR_APARTADO = 50000;

const PLANES = [
  {id:"basico", img:"img/cabina3601.png", nombre:"Cabina 360", desc:"Grabacion de tu video con efectos de audio y video", precios:[180000,300000,450000,580000],
   incluye:["Qr para descarga inmediata del video","Plataforma estable de 60 cm"]},
  {id:"pro", img:"img/digital.jpg", nombre:"Digital Pro", desc:"Cabina Digital con efectos(Proms y tira de fotos digital), enviado al instante.", precios:[180000,300000,450000,580000],
   incluye:["Efectos: confeti, burbujas, corazones, estrellas","Música y cámara lenta","Envío inmediato  (requiere internet)"]},
  {id:"tira", img:"img/impresion-tira.jpg", nombre:"Impresión en tira", desc:"Fotocabina con recuerdos físicos impresos al momento.", precios:[220000,390000,560000,700000],
   incluye:["Tira impresa con tres fotos","Personalización con el logo del evento","Accesorios (props) incluidos"]},
  {id:"completo", img:"img/fusion.png", nombre:"Completo", desc:"Cabina 360 y fotocabina impresión tira: la experiencia completa.", precios:[300000,420000,600000,790000],
   incluye:["Tira impresa con tres fotos + logo","Videos digitales inmediatos","Experiencia 360 + fotocabina de impresión"]},
  {id:"premium", img:"img/full.jpg", nombre:"Full Premium", desc:"Cabina 360 + fotocabina digital y fotocabina impresión tira: la experiencia más completa.", precios:[380000,500000,680000,870000],
   incluye:["Tira impresa y digital con tres fotos + logo","Videos digitales inmediatos","Experiencia 360 + fotocabina de impresión + fotos con proms digitales y efectos"]}
];

/* ===== Utilidades ===== */
const norm = n0;
const sinServicio = (loc,b) => NO_SERVICIO.localidades.some(l=>norm(l)===norm(loc)) || NO_SERVICIO.barrios.some(x=>norm(x)===norm(b));
const horasMedias = () => Array.from({length:48},(_,i)=>{ const v=String(i>>1).padStart(2,"0")+":"+(i%2?"30":"00"); return [v,fmtHora(v)]; });
function parseTel(t){ let d=String(t||"").replace(/\D/g,""); if(d.length===12&&d.startsWith("57")) d=d.slice(2); return /^\d{10}$/.test(d)?d:null; }

/* Fechas ya reservadas (las registra el asesor en su panel) */
fetch(`${DB}/ocupadas.json`).then(r=>r.json()).then(o=>{
  if(o) Object.entries(o).forEach(([f,v])=>{ OCUPADAS[f]=(v&&typeof v==="object")?Object.values(v).map(String):[""]; });
  if(typeof render==="function") render();
}).catch(()=>{});