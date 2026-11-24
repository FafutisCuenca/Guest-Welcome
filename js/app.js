
"use strict";

const CONFIG_URL = "data/alojamiento.json";

const parametros = new URLSearchParams(window.location.search);

const huesped = parametros.get("huesped") || "huésped";
const llegada = parametros.get("llegada") || "";
const salida = parametros.get("salida") || "";
const plural = parametros.get("plural") === "1";

const $ = (id) => document.getElementById(id);

function actualizarReloj() {
  const ahora = new Date();

  $("reloj").textContent = ahora.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function mostrarFechas() {
  if (!llegada && !salida) return;

  const formato = (fecha) => {
    if (!fecha) return "";
    const d = new Date(fecha + "T12:00:00");

    if (Number.isNaN(d.getTime())) return fecha;

    return d.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  $("fechasEstancia").textContent =
    (llegada ? "Llegada: " + formato(llegada) : "") +
    (llegada && salida ? "  ·  " : "") +
    (salida ? "Salida: " + formato(salida) : "");
}

function crearMenu(secciones) {
  const contenedor = $("menuPrincipal");
  contenedor.innerHTML = "";

  secciones.forEach((seccion) => {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "menu-card";

    const icono = document.createElement("span");
    icono.className = "menu-icon";
    icono.textContent = seccion.icono || "ℹ️";

    const titulo = document.createElement("h3");
    titulo.textContent = seccion.titulo;

    const descripcion = document.createElement("p");
    descripcion.textContent = seccion.descripcion || "";

    boton.append(icono, titulo, descripcion);

    boton.addEventListener("click", () => {
      mostrarDetalle(seccion);
    });

    contenedor.appendChild(boton);
  });
}

function mostrarDetalle(seccion) {
  $("modalTitulo").textContent = seccion.titulo;

  const contenido = $("modalContenido");
  contenido.replaceChildren();

  (seccion.contenido || []).forEach((texto) => {
    const parrafo = document.createElement("p");
    parrafo.textContent = texto;
    contenido.appendChild(parrafo);
  });

  $("modal").classList.add("visible");
  $("modal").setAttribute("aria-hidden", "false");
}

function configurarModal() {
  const cerrar = () => {
    $("modal").classList.remove("visible");
    $("modal").setAttribute("aria-hidden", "true");
  };

  $("cerrarModal").addEventListener("click", cerrar);

  $("modal").addEventListener("click", (evento) => {
    if (evento.target === $("modal")) cerrar();
  });

  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") cerrar();
  });
}

function configurarContacto(telefono) {
  const enlace = $("contactoWhatsApp");

  const numero = (telefono || "").replace(/\D/g, "");

  if (numero) {
    enlace.href = "https://wa.me/" + numero;
  } else {
    enlace.hidden = true;
  }
}

async function iniciar() {
  try {
    const respuesta = await fetch(CONFIG_URL);

    if (!respuesta.ok) {
      throw new Error("No fue posible cargar alojamiento.json");
    }

    const datos = await respuesta.json();

    $("nombreAlojamiento").textContent = datos.nombre;
    $("pieAlojamiento").textContent = datos.nombre;
    $("nombreHuesped").textContent = huesped;
    $("saludoPlural").textContent = plural ? "s" : "";
    $("mensajeBienvenida").textContent = datos.mensajeBienvenida;
    $("mensajeFinal").textContent = datos.mensajeFinal;

    const foto = $("fotoPrincipal");

    if (datos.fotoPrincipal) {
      foto.style.backgroundImage =
        "url('" + encodeURI(datos.fotoPrincipal) + "')";
    }

    mostrarFechas();
    crearMenu(datos.secciones || []);
    configurarContacto(datos.whatsapp);
    configurarModal();

    actualizarReloj();
    setInterval(actualizarReloj, 30000);

  } catch (error) {
    console.error(error);
    document.body.innerHTML =
      "<h1>No fue posible cargar la guía del alojamiento.</h1>" +
      "<p>Verifica que los archivos estén publicados correctamente.</p>";
  }
}

document.addEventListener("DOMContentLoaded", iniciar);
