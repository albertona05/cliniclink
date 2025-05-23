const express = require('express');
const router = express.Router();
const fileControllerModule = require('../controllers/fileController');
const FileController = fileControllerModule.FileController;
const upload = fileControllerModule.upload;
const { verificarToken } = require('../middleware/authMiddleware');

const fileController = new FileController();

router.use(verificarToken);

// Verifica que los métodos están definidos
if (!fileController.uploadPruebaFiles) {
    throw new Error("uploadPruebaFiles no está definido en FileController");
}

// Ruta para subir archivos de una prueba médica 10 max
router.post('/pruebas/:pruebaId/files', upload.array('files', 10), fileController.uploadPruebaFiles);

// Ruta para obtener la lista de archivos de una prueba
router.get('/pruebas/:pruebaId/files', fileController.getPruebaFiles);

// Ruta para descargar un archivo específico
router.get('/pruebas/:pruebaId/files/:fileName', fileController.downloadPruebaFile);

// Ruta para eliminar un archivo
router.delete('/pruebas/:pruebaId/files/:fileName', fileController.deletePruebaFile);

module.exports = router;
