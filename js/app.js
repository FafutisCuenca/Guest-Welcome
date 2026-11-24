
"use strict";

const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);

function reloj() {
  $("reloj").textContent = new Date().toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function crearMenu(secciones) {
  const box = $("menuPrincipal");
  box.replaceChildren();

  secciones.forEach(s => {
    const b = document.createElement("button");
    b.className = "menu-card";
    b.type = "button";

    const i = document.createElement("span");
    i.className = "menu-icon";
    i.textContent = s.icono || "ℹ️";

    const h = document.createElement("h3");
    h.textContent = s.titulo;

    const p = document.createElement("p");
    p.textContent = s.descripcion || "";

    b.append(i, h, p);
    b.addEventListener("click", () => mostrar(s));
    box.append(b);
  });
}

function mostrar(s) {
  $("modalTitulo").textContent = s.titulo;

  const c = $("modalContenido");
  c.replaceChildren();

  if (s.id === "wifi") {
    const red = document.createElement("div");
    red.className = "wifi-info";

    const icono = document.createElement("div");
    icono.className = "wifi-icon";
    icono.textContent = "📶";

    const etiqueta = document.createElement("p");
    etiqueta.textContent = "NOMBRE DE LA RED";

    const nombre = document.createElement("h3");
    nombre.textContent = "INFINITUMAAFA";

    const instruccion = document.createElement("p");
    instruccion.textContent =
      "Por seguridad, solicítala directamente a la anfitriona o consulta el código QR que se encuentra en el interior de la casa.";

    red.append(icono, etiqueta, nombre, instruccion);
    c.append(red);

  } else {
    (s.contenido || []).forEach((t, i) => {
      const p = document.createElement("p");
      p.textContent = t;

      if (s.id === "acceso" && i === 1) {
        p.className = "note";
      }

      c.append(p);
    });
  }

  if (s.imagenes?.length) {
    const g = document.createElement("div");
    g.className = "gallery";

    s.imagenes.forEach(im => {
      const el = document.createElement("img");
      el.src = im.src;
      el.alt = im.alt || s.titulo;
      g.append(el);
    });

    c.append(g);
  }

  $("modal").classList.add("visible");
  $("modal").setAttribute("aria-hidden", "false");
  $("cerrarModal").focus();
}

function cerrar() {
  $("modal").classList.remove("visible");
  $("modal").setAttribute("aria-hidden", "true");
}

async function iniciar() {
  try {
    const r = await fetch("data/alojamiento.json");

    if (!r.ok) {
      throw Error("No se pudo cargar alojamiento.json");
    }

    const d = await r.json();

    $("nombreAlojamiento").textContent = d.nombre;
    $("mensajeBienvenida").textContent = d.mensajeBienvenida;
    $("mensajeFinal").textContent = d.mensajeFinal;
    $("subtitulo").textContent = d.subtitulo;
    $("fotoPrincipal").style.backgroundImage =
      `url("${d.fotoPrincipal}")`;

    if (d.anfitriona?.foto) {
      $("fotoAnfitriona").src = d.anfitriona.foto;
    }

const h = params.get("huesped");

if (h) {
  const saludo = params.get("plural") === "1"
    ? "¡Bienvenidos"
    : "¡Bienvenido";

  $("mensajeBienvenida").textContent =
    `${saludo}, ${h}! Disfruten nuestra casa. Esperamos que vivan una experiencia inolvidable.`;
}

    const llegada = params.get("llegada");
const salida = params.get("salida");

const fechas = $("fechasEstancia");
fechas.replaceChildren();

function fechaBonita(valor) {
  const partes = valor.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!partes) return null;

  const fecha = new Date(
    Date.UTC(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]), 12)
  );

  return {
    fecha,
    texto: fecha.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC"
    })
  };
}

const fechaLlegada = llegada ? fechaBonita(llegada) : null;
const fechaSalida = salida ? fechaBonita(salida) : null;

if (fechaLlegada || fechaSalida) {
  fechas.className = "stay-dates stay-dates-detail";

  function agregarFecha(titulo, dato) {
    if (!dato) return;

    const tarjeta = document.createElement("div");
    tarjeta.className = "stay-date-item";

    const etiqueta = document.createElement("span");
    etiqueta.textContent = titulo;

    const valor = document.createElement("strong");
    valor.textContent = dato.texto;

    tarjeta.append(etiqueta, valor);
    fechas.append(tarjeta);
  }

  agregarFecha("LLEGADA", fechaLlegada);
  agregarFecha("SALIDA", fechaSalida);

  if (fechaLlegada && fechaSalida) {
    const dias = Math.round(
      (fechaSalida.fecha - fechaLlegada.fecha) / 86400000
    );

    if (dias >= 0) {
      const total = document.createElement("div");
      total.className = "stay-duration";
      total.textContent = `${dias} ${dias === 1 ? "día" : "días"} de estancia`;
      fechas.append(total);
    }
  }
}

    crearMenu(d.secciones || []);

    const tel = (d.anfitriona?.telefono || "").replace(/\D/g, "");

    if (tel) {
      $("contactoWhatsApp").href = "https://wa.me/52" + tel;
    }

    reloj();
    setInterval(reloj, 30000);

    $("cerrarModal").addEventListener("click", cerrar);

    $("modal").addEventListener("click", e => {
      if (e.target === $("modal")) cerrar();
    });

    document.addEventListener("keydown", e => {
      if (e.key === "Escape") cerrar();
    });

  } catch (e) {
    console.error(e);

    document.querySelector("main").innerHTML =
      '<p class="note">No fue posible cargar la guía. Verifica que data/alojamiento.json esté publicado.</p>';
  }
}

document.addEventListener("DOMContentLoaded", iniciar);
