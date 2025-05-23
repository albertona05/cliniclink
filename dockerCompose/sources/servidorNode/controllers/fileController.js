const ftpService = require('../services/ftpService');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configuración de multer para almacenamiento temporal
const storage = multer.diskStorage({
    destination: '/tmp/uploads',
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

class FileController {
    constructor() {
        // Bind methods to instance
        this.uploadPruebaFiles = this.uploadPruebaFiles.bind(this);
        this.getPruebaFiles = this.getPruebaFiles.bind(this);
        this.downloadPruebaFile = this.downloadPruebaFile.bind(this);
        this.deletePruebaFile = this.deletePruebaFile.bind(this);
    }

    async uploadPruebaFiles(req, res) {
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ error: 'No se han proporcionado archivos' });
            }

            const pruebaId = req.params.pruebaId;
            const uploadedFiles = [];

            for (const file of req.files) {
                const remoteFileName = `prueba_${pruebaId}/${file.filename}`;
                const success = await ftpService.uploadFile(file.path, remoteFileName);

                if (success) {
                    uploadedFiles.push({
                        originalName: file.originalname,
                        storedName: remoteFileName,
                        type: file.mimetype,
                        size: file.size
                    });
                }

                // Eliminar el archivo temporal
                await fs.unlink(file.path);
            }

            res.json({
                message: 'Archivos subidos correctamente',
                files: uploadedFiles
            });
        } catch (error) {
            console.error('Error al subir archivos:', error);
            res.status(500).json({ error: 'Error al procesar la subida de archivos' });
        }
    }

    async getPruebaFiles(req, res) {
        try {
            const pruebaId = req.params.pruebaId;
            const files = await ftpService.listFiles(`prueba_${pruebaId}`);

            res.json({
                files: files.map(file => ({
                    name: file.name,
                    size: file.size,
                    type: path.extname(file.name),
                    lastModified: file.modifiedAt
                }))
            });
        } catch (error) {
            console.error('Error al obtener archivos:', error);
            res.status(500).json({ error: 'Error al obtener los archivos' });
        }
    }

    async downloadPruebaFile(req, res) {
        try {
            const { pruebaId, fileName } = req.params;
            const remoteFileName = `prueba_${pruebaId}/${fileName}`;
            const localFilePath = path.join('/tmp', fileName);

            const success = await ftpService.downloadFile(remoteFileName, localFilePath);

            if (success) {
                res.download(localFilePath, fileName, async (err) => {
                    if (err) {
                        console.error('Error al enviar el archivo:', err);
                    }
                    // Eliminar el archivo temporal después de enviarlo
                    await fs.unlink(localFilePath).catch(console.error);
                });
            } else {
                res.status(404).json({ error: 'Archivo no encontrado' });
            }
        } catch (error) {
            console.error('Error al descargar archivo:', error);
            res.status(500).json({ error: 'Error al descargar el archivo' });
        }
    }

    async deletePruebaFile(req, res) {
        try {
            const { pruebaId, fileName } = req.params;
            const remoteFileName = `prueba_${pruebaId}/${fileName}`;

            const success = await ftpService.deleteFile(remoteFileName);

            if (success) {
                res.json({ message: 'Archivo eliminado correctamente' });
            } else {
                res.status(404).json({ error: 'Archivo no encontrado' });
            }
        } catch (error) {
            console.error('Error al eliminar archivo:', error);
            res.status(500).json({ error: 'Error al eliminar el archivo' });
        }
    }
}

module.exports = { FileController, upload };