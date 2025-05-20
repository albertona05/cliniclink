const db = require('../models');
const { Medicamento } = db;
const xss = require('xss');

// Función para sanitizar input
const sanitizarInput = (input) => {
    if (typeof input !== 'string') return input;
    return xss(input.trim());
};

// Obtener todos los medicamentos
async function obtenerMedicamentos(req, res) {
    try {
        const medicamentos = await Medicamento.findAll({
            attributes: ['id', 'nombre', 'descripcion'],
            order: [['nombre', 'ASC']]
        });

        res.json({
            success: true,
            data: medicamentos
        });
    } catch (error) {
        console.error('Error al obtener medicamentos:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener los medicamentos'
        });
    }
}

// Crear un nuevo medicamento
async function crearMedicamento(req, res) {
    try {
        const { nombre, descripcion } = req.body;
        
        // Validar datos requeridos
        if (!nombre) {
            return res.status(400).json({
                success: false,
                mensaje: 'El nombre del medicamento es requerido'
            });
        }

        // Sanitizar inputs
        const nombreSanitizado = sanitizarInput(nombre);
        const descripcionSanitizada = descripcion ? sanitizarInput(descripcion) : null;

        // Verificar si ya existe un medicamento con el mismo nombre
        const medicamentoExistente = await Medicamento.findOne({
            where: { nombre: nombreSanitizado }
        });

        if (medicamentoExistente) {
            return res.status(400).json({
                success: false,
                mensaje: 'Ya existe un medicamento con ese nombre'
            });
        }

        // Crear el medicamento
        const nuevoMedicamento = await Medicamento.create({
            nombre: nombreSanitizado,
            descripcion: descripcionSanitizada
        });

        res.status(201).json({
            success: true,
            mensaje: 'Medicamento creado exitosamente',
            data: nuevoMedicamento
        });
    } catch (error) {
        console.error('Error al crear medicamento:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al crear el medicamento'
        });
    }
}

module.exports = {
    obtenerMedicamentos,
    crearMedicamento
};