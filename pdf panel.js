/* =====================================================================
   Conecta el panel de asesores (asesor.html) con pdf.html.
   Cuando el asesor toca «📄 Formato PDF» en una reserva, el panel guarda los datos
   y abre pdf.html; este archivo los lee y rellena el formulario solo.
   ===================================================================== */
(function(){
  let o;
  try{ o = JSON.parse(localStorage.getItem("ajPdf") || "null"); localStorage.removeItem("ajPdf"); }catch(e){ return; }
  if(!o || Date.now() - o.ts > 10*60*1000) return;        /* datos de hace más de 10 min: se ignoran */

  /* Paquete: el nombre del plan del panel -> el código del paquete de pdf.html */
  const mapa = {"Impresión en tira":"tira","Digital Pro":"dig","Cabina 360":"c360","Completo":"comp","Full Premium":"full"};
  const k = mapa[o.plan];
  if(k){ pk = k; const r = document.querySelector('input[name=pk][value='+k+']'); if(r) r.checked = true; }

  const poner = (id,v) => { if(v !== undefined && v !== null && v !== "") $(id).value = v; };
  poner("nom", o.cliente);          /* nombre del contratante */
  poner("cel", o.tel);              /* celular */
  poner("fev", o.fecha);            /* fecha del evento */
  poner("hin", o.hora);             /* hora de inicio */
  if(o.horas >= 1 && o.horas <= 4) $("dur").value = o.horas;
  poner("lug", o.lugar);            /* dirección, barrio, localidad y ciudad */
  if(o.total > 0) $("tot").value = o.total;
  if(typeof o.abono === "number") $("abo").value = o.abono;

  /* Asesor a cargo: se busca por el primer nombre en la lista de asesores de pdf.html */
  if(o.asesor){
    const p = String(o.asesor).toLowerCase().split(" ")[0];
    const a = advisors().find(x => x.n.toLowerCase().startsWith(p));
    if(a) $("ase").value = a.n;
  }

  fillTerms();   /* condiciones según el paquete */
  render();      /* actualiza el documento */
})();