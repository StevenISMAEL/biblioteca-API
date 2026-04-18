// server.js - Servidor Express que implementa el contrato OpenAPI
const express = require("express");
const { v4: uuidv4 } = require("uuid");
const app = express();
app.use(express.json());

// ── Base de datos en memoria (cumple el contrato) ──────────────────────────
let autores = [
  {
    id: "1",
    nombre: "Robert C. Martin",
    nacionalidad: "Estadounidense",
    biografia: "Autor de Clean Code y Clean Architecture.",
    libros: ["1"],
  },
  {
    id: "2",
    nombre: "Erich Gamma",
    nacionalidad: "Suizo",
    biografia: "Co-autor del libro Design Patterns (GoF).",
    libros: ["2"],
  },
];

let libros = [
  {
    id: "1",
    isbn: "978-0-13-468599-1",
    titulo: "Clean Code",
    autorId: "1",
    disponible: true,
    copias: 3,
    fechaPublicacion: "2008-08-01",
    genero: "tecnologia",
  },
  {
    id: "2",
    isbn: "978-0-20-163361-5",
    titulo: "Design Patterns",
    autorId: "2",
    disponible: true,
    copias: 2,
    fechaPublicacion: "1994-10-31",
    genero: "tecnologia",
  },
];

let prestamos = [];

// ── Middleware de validación de esquema simple ──────────────────────────────
function validateLibroInput(req, res, next) {
  const { isbn, titulo, autorId, copias } = req.body;
  const errors = [];
  if (!isbn) errors.push("isbn es requerido");
  if (!titulo || titulo.length < 1 || titulo.length > 200)
    errors.push("titulo debe tener entre 1 y 200 caracteres");
  if (!autorId) errors.push("autorId es requerido");
  if (copias === undefined || copias < 1)
    errors.push("copias debe ser un número entero mayor a 0");
  if (errors.length > 0) {
    return res.status(400).json({
      codigo: "VALIDACION_FALLIDA",
      mensaje: "Los datos de entrada son inválidos",
      detalles: errors,
    });
  }
  next();
}

// ── RUTAS: Libros ────────────────────────────────────────────────────────────
app.get("/api/v1/libros", (req, res) => {
  const { disponible, page = 1, limit = 20 } = req.query;
  let resultado = [...libros];
  if (disponible !== undefined) {
    resultado = resultado.filter(
      (l) => l.disponible === (disponible === "true"),
    );
  }
  const total = resultado.length;
  const inicio = (Number(page) - 1) * Number(limit);
  const data = resultado.slice(inicio, inicio + Number(limit));
  res.status(200).json({
    data,
    meta: { total, page: Number(page), limit: Number(limit) },
  });
});

app.post("/api/v1/libros", validateLibroInput, (req, res) => {
  const { isbn, titulo, autorId, copias, fechaPublicacion, genero } = req.body;
  const existe = libros.find((l) => l.isbn === isbn);
  if (existe) {
    return res.status(409).json({
      codigo: "ISBN_DUPLICADO",
      mensaje: `Ya existe un libro con el ISBN ${isbn}`,
    });
  }
  const nuevoLibro = {
    id: uuidv4(),
    isbn,
    titulo,
    autorId,
    disponible: true,
    copias,
    fechaPublicacion: fechaPublicacion || null,
    genero: genero || null,
  };
  libros.push(nuevoLibro);
  res.status(201).json(nuevoLibro);
});

app.get("/api/v1/libros/:id", (req, res) => {
  const libro = libros.find((l) => l.id === req.params.id);
  if (!libro)
    return res
      .status(404)
      .json({ codigo: "NOT_FOUND", mensaje: "El libro solicitado no existe" });
  res.status(200).json(libro);
});

app.put("/api/v1/libros/:id", validateLibroInput, (req, res) => {
  const idx = libros.findIndex((l) => l.id === req.params.id);
  if (idx === -1)
    return res
      .status(404)
      .json({ codigo: "NOT_FOUND", mensaje: "El libro solicitado no existe" });
  libros[idx] = { ...libros[idx], ...req.body };
  res.status(200).json(libros[idx]);
});

app.delete("/api/v1/libros/:id", (req, res) => {
  const idx = libros.findIndex((l) => l.id === req.params.id);
  if (idx === -1)
    return res
      .status(404)
      .json({ codigo: "NOT_FOUND", mensaje: "El libro solicitado no existe" });
  const prestamosActivos = prestamos.filter(
    (p) => p.libroId === req.params.id && p.estado === "activo",
  );
  if (prestamosActivos.length > 0) {
    return res
      .status(409)
      .json({
        codigo: "PRESTAMOS_ACTIVOS",
        mensaje: "No se puede eliminar: el libro tiene préstamos activos",
      });
  }
  libros.splice(idx, 1);
  res.status(204).send();
});

// ── RUTAS: Autores ───────────────────────────────────────────────────────────
app.get("/api/v1/autores", (req, res) => res.status(200).json(autores));

app.post("/api/v1/autores", (req, res) => {
  const { nombre, nacionalidad, biografia } = req.body;
  if (!nombre || nombre.length < 2) {
    return res
      .status(400)
      .json({
        codigo: "VALIDACION_FALLIDA",
        mensaje: "nombre debe tener al menos 2 caracteres",
      });
  }
  if (!nacionalidad) {
    return res
      .status(400)
      .json({
        codigo: "VALIDACION_FALLIDA",
        mensaje: "nacionalidad es requerida",
      });
  }
  const nuevoAutor = {
    id: uuidv4(),
    nombre,
    nacionalidad,
    biografia: biografia || null,
    libros: [],
  };
  autores.push(nuevoAutor);
  res.status(201).json(nuevoAutor);
});

app.get("/api/v1/autores/:id", (req, res) => {
  const autor = autores.find((a) => a.id === req.params.id);
  if (!autor)
    return res
      .status(404)
      .json({ codigo: "NOT_FOUND", mensaje: "El autor solicitado no existe" });
  res.status(200).json(autor);
});
