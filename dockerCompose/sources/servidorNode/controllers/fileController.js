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

            // Obtener la lista de archivos existentes para determinar el siguiente número
            let existingFiles = [];
            try {
                existingFiles = await ftpService.listFiles('.');
                // Filtrar solo los archivos que corresponden a esta prueba
                existingFiles = existingFiles.filter(file => 
                    file.name.startsWith(`archivo_${pruebaId}_`));
                console.log('Archivos existentes:', existingFiles.map(f => f.name));
            } catch (error) {
                console.log('No se encontraron archivos previos, comenzando desde 1');
            }

            // Determinar el siguiente número de archivo
            let nextFileNumber = 1;
            if (existingFiles.length > 0) {
                // Extraer los números de los nombres de archivo existentes
                const fileNumbers = existingFiles.map(file => {
                    const match = file.name.match(`archivo_${pruebaId}_(\d+)`);
                    return match ? parseInt(match[1]) : 0;
                });
                // Encontrar el número más alto y sumar 1
                nextFileNumber = Math.max(...fileNumbers) + 1;
            }

            for (const file of req.files) {
                const fileExt = path.extname(file.originalname);
                const newFileName = `archivo_${pruebaId}_${nextFileNumber}${fileExt}`;
                
                console.log(`Intentando subir archivo: ${newFileName}`);
                const success = await ftpService.uploadFile(file.path, newFileName);

                if (success) {
                    uploadedFiles.push({
                        originalName: file.originalname,
                        storedName: newFileName,
                        type: file.mimetype,
                        size: file.size
                    });
                    nextFileNumber++;
                } else {
                    console.error(`Fallo al subir el archivo: ${newFileName}`);
                }

                // Eliminar el archivo temporal
                await fs.unlink(file.path).catch(err => {
                    console.error(`Error al eliminar archivo temporal ${file.path}:`, err);
                });
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
            console.log(`[DEBUG] Buscando archivos para prueba ID: ${pruebaId}`);
            
            // Obtener todos los archivos del directorio
            console.log('[DEBUG] Solicitando listado de archivos al FTP...');
            const allFiles = await ftpService.listFiles('.');
            console.log('[DEBUG] Archivos recibidos del FTP:', JSON.stringify(allFiles));
            
            // Filtrar solo los archivos que corresponden a esta prueba
            const files = allFiles.filter(file => 
                file.name.startsWith(`archivo_${pruebaId}_`));

            console.log(`[DEBUG] Archivos encontrados para prueba ${pruebaId}:`, JSON.stringify(files.map(f => f.name)));
            console.log('[DEBUG] Respuesta que se enviará al cliente:', JSON.stringify({
                files: files.map(file => ({
                    name: file.name,
                    size: file.size,
                    type: path.extname(file.name),
                    lastModified: file.modifiedAt
                }))
            }));

            res.json({
                files: files.map(file => ({
                    name: file.name,
                    size: file.size,
                    type: path.extname(file.name),
                    lastModified: file.modifiedAt
                }))
            });
        } catch (error) {
            console.error('[ERROR] Error al obtener archivos:', error);
            res.status(500).json({ error: 'Error al obtener los archivos' });
        }
    }

    async downloadPruebaFile(req, res) {
        try {
            const { pruebaId, fileName } = req.params;
            const localFilePath = path.join('/tmp', fileName);

            console.log(`Intentando descargar archivo: ${fileName}`);
            const success = await ftpService.downloadFile(fileName, localFilePath);

            if (success) {
                res.download(localFilePath, fileName, async (err) => {
                    if (err) {
                        console.error('Error al enviar el archivo:', err);
                    }
                    // Eliminar el archivo temporal después de enviarlo
                    await fs.unlink(localFilePath).catch(err => {
                        console.error(`Error al eliminar archivo temporal ${localFilePath}:`, err);
                    });
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

            console.log(`Intentando eliminar archivo: ${fileName}`);
            const success = await ftpService.deleteFile(fileName);

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