
(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);

  const menu = $("#menuSecciones");
  const modal = $("#modalSeccion");
  const modalTitulo = $("#modalTitulo");
  const modalContenido = $("#modalContenido");
  const botonCerrar = $("#cerrarModal");

  let secciones = [];
  let tarjetaAnterior = null;
  let modalAbierto = false;

  const params = new URLSearchParams(window.location.search);

  function crearElemento(tag, className, texto) {
    const elemento = document.createElement(tag);

    if (className) elemento.className = className;
    if (texto !== undefined) elemento.textContent = texto;

    return elemento;
  }

  function actualizarReloj() {
    const ahora = new Date();

    $("#reloj").textContent = ahora.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });

    $("#fechaActual").textContent = ahora.toLocaleDateString("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }

    async function actualizarTemperatura() {
    const elemento = $("#temperatura");
    if (!elemento) return;

    try {
      const respuesta = await fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=18.8814&longitude=-99.1775&current=temperature_2m&timezone=America%2FMexico_City"
      );

      if (!respuesta.ok) throw new Error("Clima no disponible");

      const datos = await respuesta.json();

      elemento.textContent =
        `🌤️ ${Math.round(datos.current.temperature_2m)} °C · Jiutepec`;

    } catch (error) {
      elemento.textContent = "🌤️ Jiutepec";
    }
  }
  
  function fechaLocal(valor) {
    if (!valor) return null;

    const partes = valor.split("-");

    if (partes.length !== 3) return null;

    const fecha = new Date(
      Number(partes[0]),
      Number(partes[1]) - 1,
      Number(partes[2])
    );

    return Number.isNaN(fecha.getTime()) ? null : fecha;
  }

  function formatoFecha(fecha) {
    return fecha.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }

  function mostrarEstancia() {
    const llegada = fechaLocal(params.get("llegada"));
    const salida = fechaLocal(params.get("salida"));
    const contenedor = $("#datosEstancia");

    contenedor.replaceChildren();

    if (!llegada && !salida) return;

    function agregarDato(etiqueta, valor) {
      const item = crearElemento("div", "tv-stay-item");
      item.appendChild(crearElemento("span", "", etiqueta));
      item.appendChild(crearElemento("strong", "", valor));
      contenedor.appendChild(item);
    }

    if (llegada) {
      agregarDato("Llegada", formatoFecha(llegada));
    }

    if (salida) {
      agregarDato("Salida", formatoFecha(salida));
    }

    if (llegada && salida && salida >= llegada) {
      const dias = Math.round((salida - llegada) / 86400000);
      const duracion = crearElemento(
        "div",
        "tv-stay-duration",
        `${dias} ${dias === 1 ? "día de estancia" : "días de estancia"}`
      );

      contenedor.appendChild(duracion);
    }
  }

  function personalizarBienvenida(datos) {
    const nombre = params.get("huesped");
    const plural = params.get("plural") === "1";

    $("#nombreCasa").textContent = datos.nombre || "NUESTRA CASA";

    if (nombre) {
      $("#saludo").textContent = plural
        ? `¡Bienvenidos, ${nombre}!`
        : `¡Bienvenido(a), ${nombre}!`;
    } else {
      $("#saludo").textContent = "¡Bienvenidos a nuestra casa!";
    }

    $("#mensajeBienvenida").textContent =
      datos.mensajeBienvenida ||
      "Deseamos que disfruten cada momento de su estancia.";

    $("#mensajeFinal").textContent = datos.mensajeFinal || "";

    const foto = datos.fotoPrincipal;

    if (foto) {
      $("#fotoBienvenida").style.backgroundImage =
        `url("${encodeURI(foto)}")`;
    }

    mostrarEstancia();
  }

  function esSubtitulo(texto) {
    if (!texto || texto.length > 90) return false;

    return (
      texto === texto.toLocaleUpperCase("es-MX") &&
      /[A-ZÁÉÍÓÚÜÑ]/.test(texto)
    );
  }

  function crearTarjeta(seccion, indice) {
    const tarjeta = crearElemento("button", "tv-card");
    tarjeta.type = "button";
    tarjeta.dataset.indice = indice;

    const icono = crearElemento(
      "span",
      "tv-card-icon",
      seccion.icono || "ℹ️"
    );

    const texto = crearElemento("span", "tv-card-text");

    texto.appendChild(
      crearElemento("span", "tv-card-title", seccion.titulo || "Información")
    );

    texto.appendChild(
      crearElemento(
        "span",
        "tv-card-description",
        seccion.descripcion || "Consulta los detalles."
      )
    );

    tarjeta.append(icono, texto);

    tarjeta.addEventListener("click", () => {
      abrirSeccion(indice, tarjeta);
    });

    return tarjeta;
  }


function crearGaleria(imagenes, esWifi = false) {
  if (!Array.isArray(imagenes) || !imagenes.length) return null;

  const galeria = crearElemento(
    "div",
    esWifi ? "tv-gallery wifi-gallery" : "tv-gallery"
  );

  imagenes.forEach((imagen) => {
    if (!imagen || !imagen.src) return;

    const img = document.createElement("img");
    img.src = encodeURI(imagen.src);
    img.alt = imagen.alt || "Fotografía de la casa";
    img.loading = "lazy";

    galeria.appendChild(img);
  });

  return galeria.children.length ? galeria : null;
}

  function crearContenido(seccion) {
    const fragmento = document.createDocumentFragment();

    const contenido = Array.isArray(seccion.contenido)
      ? seccion.contenido
      : [];

    contenido.forEach((linea) => {
      if (typeof linea !== "string") return;

      if (linea.startsWith("MAPA|")) {
        const partes = linea.split("|");
        const nombre = partes[1] || "Ver ubicación";
        const url = partes.slice(2).join("|");

        try {
          const direccion = new URL(url);

          if (
            direccion.protocol === "https:" &&
            (
              direccion.hostname === "google.com" ||
              direccion.hostname.endsWith(".google.com") ||
              direccion.hostname === "maps.google.com"
            )
          ) {
            const enlace = crearElemento(
              "a",
              "tv-map-link",
              `Ver ubicación en mapa: ${nombre}`
            );

            enlace.href = direccion.href;
            enlace.target = "_blank";
            enlace.rel = "noopener noreferrer";

            fragmento.appendChild(enlace);
          }
        } catch (error) {
          // Se omite cualquier enlace que no sea válido.
        }

        return;
      }

      if (esSubtitulo(linea)) {
        fragmento.appendChild(crearElemento("h3", "", linea));
      } else {
        fragmento.appendChild(crearElemento("p", "", linea));
      }
    });

 const esWifi = (seccion.id || "").toLowerCase() === "wifi";
const galeria = crearGaleria(seccion.imagenes, esWifi);

    if (galeria) {
      fragmento.appendChild(galeria);
    }

    return fragmento;
  }

  function abrirSeccion(indice, tarjeta) {
    const seccion = secciones[indice];

    if (!seccion) return;

    tarjetaAnterior = tarjeta || document.activeElement;
    modalTitulo.textContent = `${seccion.icono || ""} ${seccion.titulo || "Información"}`;

    modalContenido.replaceChildren();
    modalContenido.appendChild(crearContenido(seccion));

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    modalAbierto = true;

    requestAnimationFrame(() => {
      modalContenido.focus();
      modalContenido.scrollTop = 0;
    });
  }

  function cerrarSeccion() {
    if (!modalAbierto) return;

    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    modalAbierto = false;

    if (tarjetaAnterior && tarjetaAnterior.isConnected) {
      tarjetaAnterior.focus();
    }
  }

  

function cargarSecciones(datos) {
  const originales = Array.isArray(datos.secciones)
    ? datos.secciones
    : [];

  // Orden de prioridad para las tarjetas de TV.
  secciones = [...originales].sort((a, b) => {
    const normalizar = (texto) =>
      `${texto || ""}`
        .toLocaleLowerCase("es-MX")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const prioridad = (seccion) => {
      const texto = normalizar(
        `${seccion.id || ""} ${seccion.titulo || ""} ${seccion.descripcion || ""}`
      );

      if (/bienvenida|welcome/.test(texto)) return 0;
      if (/emergencia/.test(texto)) return 1;
      if (/ayuda/.test(texto)) return 2;

      return 3;
    };

    return prioridad(a) - prioridad(b);
  });

  menu.replaceChildren();

  if (!secciones.length) {
    menu.appendChild(
      crearElemento("p", "tv-loading", "No hay secciones disponibles.")
    );
    return;
  }

  secciones.forEach((seccion, indice) => {
    menu.appendChild(crearTarjeta(seccion, indice));
  });
}

  function elementoEnFoco() {
    const elemento = document.activeElement;

    if (
      !elemento ||
      elemento === document.body ||
      !elemento.matches("button, a, [tabindex='0']")
    ) {
      return null;
    }

    return elemento;
  }

  function navegarFlechas(direccion) {
    const actual = elementoEnFoco();

    if (!actual) return;

    if (modalAbierto && actual === modalContenido) {
      if (direccion === "down") {
        modalContenido.scrollBy({ top: 160, behavior: "smooth" });
      } else if (direccion === "up") {
        modalContenido.scrollBy({ top: -160, behavior: "smooth" });
      }
      return;
    }

    if (modalAbierto && actual === botonCerrar) {
      if (direccion === "down") {
        modalContenido.focus();
      }
      return;
    }

    const candidatos = Array.from(
      (modalAbierto ? modal : document).querySelectorAll(
        "button:not(:disabled), a[href], [tabindex='0']"
      )
    ).filter((elemento) => {
      return elemento !== actual && elemento.offsetParent !== null;
    });

    const rectActual = actual.getBoundingClientRect();
    const centroActual = {
      x: rectActual.left + rectActual.width / 2,
      y: rectActual.top + rectActual.height / 2
    };

    const vectores = {
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 },
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 }
    };

    const vector = vectores[direccion];
    let mejor = null;
    let mejorPuntuacion = Infinity;

    candidatos.forEach((candidato) => {
      const rect = candidato.getBoundingClientRect();

      const dx = rect.left + rect.width / 2 - centroActual.x;
      const dy = rect.top + rect.height / 2 - centroActual.y;

      const avance = dx * vector.x + dy * vector.y;
      const lateral = Math.abs(dx * vector.y - dy * vector.x);

      if (avance <= 0) return;

      const puntuacion = avance + lateral * 2.2;

      if (puntuacion < mejorPuntuacion) {
        mejorPuntuacion = puntuacion;
        mejor = candidato;
      }
    });

    if (mejor) {
      mejor.focus();
    } else if (!modalAbierto) {
      const tarjetas = Array.from(menu.querySelectorAll(".tv-card"));
      const indice = tarjetas.indexOf(actual);

      if (direccion === "left" && indice === 0) {
        tarjetas[tarjetas.length - 1]?.focus();
      } else if (
        direccion === "right" &&
        indice === tarjetas.length - 1
      ) {
        tarjetas[0]?.focus();
      }
    }
  }

  function manejarTeclado(evento) {
    const teclasFlecha = {
      ArrowLeft: "left",
      ArrowRight: "right",
      ArrowUp: "up",
      ArrowDown: "down"
    };

    if (teclasFlecha[evento.key]) {
      evento.preventDefault();
      navegarFlechas(teclasFlecha[evento.key]);
      return;
    }

    if (
      evento.key === "Escape" ||
      evento.key === "Backspace" ||
      evento.key === "BrowserBack" ||
      evento.key === "GoBack" ||
      evento.keyCode === 461
    ) {
      if (modalAbierto) {
        evento.preventDefault();
        cerrarSeccion();
      }
      return;
    }

    if (evento.key === "Enter" || evento.key === " ") {
      const actual = elementoEnFoco();

      if (actual && actual.tagName === "A") {
        return;
      }

      if (actual && actual.tagName === "BUTTON") {
        evento.preventDefault();
        actual.click();
      }
    }
  }

  async function iniciar() {
    actualizarReloj();
    setInterval(actualizarReloj, 1000);

    botonCerrar.addEventListener("click", cerrarSeccion);

    document.addEventListener("keydown", manejarTeclado);

    modal.addEventListener("click", (evento) => {
      if (evento.target === modal) {
        cerrarSeccion();
      }
    });

    try {
      const respuesta = await fetch("data/alojamiento.json", {
        cache: "no-cache"
      });

      if (!respuesta.ok) {
        throw new Error("No se pudo cargar alojamiento.json");
      }

      const datos = await respuesta.json();

      personalizarBienvenida(datos);
      cargarSecciones(datos);

      requestAnimationFrame(() => {
        menu.querySelector(".tv-card")?.focus();
      });
    } catch (error) {
      console.error("Error al cargar la guía de TV:", error);

      menu.replaceChildren(
        crearElemento(
          "p",
          "tv-loading",
          "No fue posible cargar la información. Verifica que el archivo data/alojamiento.json exista y que la página se abra desde el sitio publicado."
        )
      );
    }
  }

  document.addEventListener("DOMContentLoaded", iniciar);
})();
