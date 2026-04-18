// server.js - Servidor Express que implementa el contrato OpenAPI
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const app = express();
app.use(express.json());

// ── Base de datos en memoria (cumple el contrato) ──────────────────────────
let autores = [
  { id: '1', nombre: 'Robert C. Martin', nacionalidad: 'Estadounidense',
    biografia: 'Autor de Clean Code y Clean Architecture.', libros: ['1'] },
  { id: '2', nombre: 'Erich Gamma', nacionalidad: 'Suizo',
    biografia: 'Co-autor del libro Design Patterns (GoF).', libros: ['2'] },
];

let libros = [
  { id: '1', isbn: '978-0-13-468599-1', titulo: 'Clean Code', autorId: '1',
    disponible: true, copias: 3, fechaPublicacion: '2008-08-01', genero: 'tecnologia' },
  { id: '2', isbn: '978-0-20-163361-5', titulo: 'Design Patterns', autorId: '2',
disponible: true, copias: 2, fechaPublicacion: '1994-10-31', genero: 'tecnologia' },
];

let prestamos = [];

// ── Middleware de validación de esquema simple ──────────────────────────────
function validateLibroInput(req, res, next) {
  const { isbn, titulo, autorId, copias } = req.body;
  const errors = [];
  if (!isbn) errors.push('isbn es requerido');
  if (!titulo || titulo.length < 1 || titulo.length > 200)
    errors.push('titulo debe tener entre 1 y 200 caracteres');
  if (!autorId) errors.push('autorId es requerido');
  if (copias === undefined || copias < 1)
    errors.push('copias debe ser un número entero mayor a 0');
  if (errors.length > 0) {
    return res.status(400).json({
      codigo: 'VALIDACION_FALLIDA',
      mensaje: 'Los datos de entrada son inválidos',
      detalles: errors
    });
  }
  next();
}
