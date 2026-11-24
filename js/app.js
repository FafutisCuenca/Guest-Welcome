
"use strict";

const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);

// Subtítulos que deben resaltarse dentro de las secciones.
const SUBTITULOS = [
  "REFERENCIAS DE LA ZONA",
  "PLAZAS Y CENTROS COMERCIALES",
  "SUPERMERCADOS Y COMPRAS",
  "SUPERMERCADOS",
  "SITIOS DE INTERÉS",
  "ATENCIÓN MÉDICA Y HOSPITALES",
  "HOSPITALES Y SERVICIOS MÉDICOS",
  "NÚMEROS DE EMERGENCIA",
  "RECOMENDACIONES IMPORTANTES"
];

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

function esSubtitulo(texto) {
  const limpio = texto.trim();
  const normalizado = limpio.toLocaleUpperCase("es-MX");

  return (
    SUBTITULOS.includes(normalizado) ||
    (
      limpio === normalizado &&
      /[A-ZÁÉÍÓÚÜÑ]/.test(limpio) &&
      !limpio.includes(":")
    )
  );
}

function crearEnlaceMapa(texto, contenedor) {
  const partes = texto.split("|");

  if (partes.length < 3) {
    return false;
  }

  const nombre = partes[1].trim();
  const direccion = partes.slice(2).join("|").trim();

  try {
    const url = new URL(direccion);

    // Solo se permiten enlaces seguros a Google Maps.
    const dominioValido =
      url.protocol === "https:" &&
      (
        url.hostname === "www.google.com" ||
        url.hostname === "google.com" ||
        url.hostname === "maps.google.com"
      );

    if (!dominioValido) {
      return false;
    }

    const enlace = document.createElement("a");
    enlace.className = "mapa-link";
    enlace.href = url.href;
    enlace.target = "_blank";
    enlace.rel = "noopener noreferrer";
    enlace.textContent = "📍 Ver ubicación y ruta en Google Maps: " + nombre;

    contenedor.append(enlace);
    return true;

  } catch (error) {
    console.warn("Enlace de mapa no válido:", direccion);
    return false;
  }
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
      const texto = String(t);

      // Referencias a Google Maps.
      if (texto.startsWith("MAPA|")) {
        const agregado = crearEnlaceMapa(texto, c);

        if (!agregado) {
          const p = document.createElement("p");
          p.textContent = texto;
          c.append(p);
        }

        return;
      }

      // Subtítulos destacados.
      if (esSubtitulo(texto)) {
        const h = document.createElement("h3");
        h.className = "subtitulo-seccion";
        h.textContent = texto;
        c.append(h);
        return;
      }

      // Texto normal.
      const p = document.createElement("p");
      p.textContent = texto;

      if (s.id === "acceso" && i === 1) {
        p.className = "note";
      }

      c.append(p);
    });
  }

  // Galería de fotografías.
  if (s.imagenes?.length) {
const g = document.createElement("div");
g.className = s.id === "wifi"
  ? "gallery wifi-gallery"
  : "gallery";

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

    // Saludo personalizado.
    const h = params.get("huesped");

    if (h) {
      const saludo = params.get("plural") === "1"
        ? "¡Bienvenidos"
        : "¡Bienvenido";

      $("mensajeBienvenida").textContent =
        `${saludo}, ${h}! Disfruten nuestra casa. Esperamos que vivan una experiencia inolvidable.`;
    }

    // Fechas de llegada y salida.
    const llegada = params.get("llegada");
    const salida = params.get("salida");

    const fechas = $("fechasEstancia");
    fechas.replaceChildren();

    function fechaBonita(valor) {
      const partes = valor.match(/^(\d{4})-(\d{2})-(\d{2})$/);

      if (!partes) return null;

      const fecha = new Date(
        Date.UTC(
          Number(partes[1]),
          Number(partes[2]) - 1,
          Number(partes[3]),
          12
        )
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
          total.textContent =
            `${dias} ${dias === 1 ? "día" : "días"} de estancia`;

          fechas.append(total);
        }
      }
    }

    // Crear las tarjetas del menú.
    crearMenu(d.secciones || []);

    // Contacto por WhatsApp.
    const tel = (d.anfitriona?.telefono || "").replace(/\D/g, "");

    if (tel) {
      $("contactoWhatsApp").href = "https://wa.me/52" + tel;
    }

    // Reloj.
    reloj();
    setInterval(reloj, 30000);

    // Cerrar ventanas emergentes.
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
