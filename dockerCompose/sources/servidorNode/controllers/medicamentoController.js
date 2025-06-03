const { Medicamento } = require('../models');
const { Op } = require('sequelize');
const sanitizeHtml = require('sanitize-html');

// Obtener todos los medicamentos o buscar por término
exports.obtenerMedicamentos = async (req, res) => {
  try {
    const { termino } = req.query;
    let condicion = {};
    
    // Si hay un término de búsqueda, filtrar por nombre
    if (termino) {
      condicion = {
        nombre: {
          [Op.like]: `%${termino}%`
        }
      };
    }
    
    const medicamentos = await Medicamento.findAll({
      where: condicion,
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
};

// Crear un nuevo medicamento
exports.crearMedicamento = async (req, res) => {
  try {
    // Sanitizar los datos de entrada
    const nombre = sanitizeHtml(req.body.nombre?.trim() || '', {
      allowedTags: [],
      allowedAttributes: {}
    });
    
    const descripcion = sanitizeHtml(req.body.descripcion?.trim() || '', {
      allowedTags: [],
      allowedAttributes: {}
    });
    
    // Validar que el nombre no esté vacío
    if (!nombre) {
      return res.status(400).json({
        success: false,
        mensaje: 'El nombre del medicamento es obligatorio'
      });
    }
    
    // Verificar si ya existe un medicamento con el mismo nombre
    const medicamentoExistente = await Medicamento.findOne({
      where: {
        nombre: {
          [Op.like]: nombre
        }
      }
    });
    
    if (medicamentoExistente) {
      return res.status(400).json({
        success: false,
        mensaje: 'Ya existe un medicamento con ese nombre',
        data: medicamentoExistente
      });
    }
    
    // Crear el nuevo medicamento
    const nuevoMedicamento = await Medicamento.create({
      nombre,
      descripcion: descripcion || null
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
};