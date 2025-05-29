const ftpService = require('../services/ftpService');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { Cita, Prueba, DataTypes } = require('../models'); 

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
            console.log('ID de la prueba:', pruebaId);

            // Obtener la lista de archivos existentes para determinar el siguiente número
            let existingFiles = [];
            try {
                existingFiles = await ftpService.listFiles('pruebas');
                console.log('Archivos existentes en pruebas:', existingFiles);
            } catch (listErr) {
                console.error('Error al listar archivos existentes:', listErr);
                // Continuar incluso si hay error al listar
            }

            // Filtrar archivos relacionados con esta prueba
            const pruebaFiles = existingFiles.filter(file => 
                file.name.startsWith(`prueba_${pruebaId}_`));
            
            // Determinar el siguiente número para el archivo
            let nextFileNumber = 1;
            if (pruebaFiles.length > 0) {
                // Extraer los números de los archivos existentes
                const fileNumbers = pruebaFiles.map(file => {
                    const match = file.name.match(`prueba_${pruebaId}_(\d+)`);
                    return match ? parseInt(match[1]) : 0;
                });
                
                // Encontrar el número más alto y sumar 1
                nextFileNumber = Math.max(...fileNumbers) + 1;
            }

            for (const file of req.files) {
                // Crear nombre de archivo con formato: prueba_ID_NUMERO.extension
                const fileExt = path.extname(file.originalname);
                const remoteFileName = `pruebas/prueba_${pruebaId}_${nextFileNumber}${fileExt}`;
                
                console.log(`Intentando subir archivo a: ${remoteFileName}`);
                const success = await ftpService.uploadFile(file.path, remoteFileName);

                if (success) {
                    uploadedFiles.push({
                        originalName: file.originalname,
                        storedName: `prueba_${pruebaId}_${nextFileNumber}${fileExt}`,
                        type: file.mimetype,
                        size: file.size
                    });
                    nextFileNumber++;
                } else {
                    console.error(`Error al subir el archivo ${file.originalname}`);
                }

                // Eliminar el archivo temporal
                await fs.unlink(file.path);
            }

            // Cerrar la conexión FTP después de completar todas las operaciones
            await ftpService.closeConnection();

            res.json({
                message: 'Archivos subidos correctamente',
                files: uploadedFiles
            });
        } catch (error) {
            console.error('Error al subir archivos:', error);
            // Asegurarse de cerrar la conexión FTP en caso de error
            await ftpService.closeConnection();
            res.status(500).json({ error: 'Error al procesar la subida de archivos' });
        }
    }

    async getPruebaFiles(req, res) {
        try {
            const citaId = parseInt(req.params.pruebaId);
            console.log(`Buscando archivos para cita ID: ${citaId}`);
    
            // Buscar la prueba asociada a esta cita
            const prueba = await Prueba.findOne({
                where: { id_cita: citaId }
            });

            if (!prueba) {
                console.log(`No se encontró ninguna prueba asociada a la cita ID: ${citaId}`);
                await ftpService.closeConnection();
                return res.status(404).json({ error: 'No se encontró ninguna prueba asociada a esta cita' });
            }
    
            const pruebaId = prueba.id;
            console.log(`ID de la prueba encontrada: ${pruebaId}`);

            const citaPrueba = await Cita.findOne({
                where: { id_prueba: pruebaId }
            });
            const citaIdPrueba = citaPrueba.id;
            console.log(`ID de la cita de la prueba encontrada: ${citaIdPrueba}`);

    
            // Buscar archivos en el directorio "pruebas"
            const allFiles = await ftpService.listFiles('pruebas');
    
            const pruebaFiles = allFiles
                .filter(file => file.name.startsWith(`prueba_${citaIdPrueba}_`))
                .map(file => ({
                    name: file.name,
                    size: file.size,
                    date: file.modifiedAt,
                    url: `/api/pruebas/${citaIdPrueba}/files/${file.name}`
                }));
    
            console.log(`Se encontraron ${pruebaFiles.length} archivos para la prueba ID: ${citaIdPrueba}`);
    
            await ftpService.closeConnection();
            return res.json(pruebaFiles);
    
        } catch (error) {
            console.error('Error al obtener archivos de la prueba:', error);
            await ftpService.closeConnection();
            return res.status(500).json({ error: 'Error al obtener archivos de la prueba' });
        }
    }
    
    

    async downloadPruebaFile(req, res) {
        try {
            const pruebaId = req.params.pruebaId;
            const fileName = req.params.fileName;
            
            // Verificar que el archivo pertenezca a la prueba correcta
            if (!fileName.startsWith(`prueba_${pruebaId}_`)) {
                return res.status(403).json({ error: 'Acceso denegado al archivo' });
            }
            
            // Ruta completa en el servidor FTP
            const remoteFilePath = `pruebas/${fileName}`;
            
            // Ruta temporal local para descargar el archivo
            const localFilePath = path.join('/tmp', fileName);
            
            // Descargar el archivo del servidor FTP
            const success = await ftpService.downloadFile(remoteFilePath, localFilePath);
            
            if (!success) {
                // Cerrar la conexión FTP en caso de error
                await ftpService.closeConnection();
                return res.status(404).json({ error: 'Archivo no encontrado' });
            }
            
            // Cerrar la conexión FTP después de completar la descarga
            await ftpService.closeConnection();
            
            // Enviar el archivo al cliente
            res.download(localFilePath, fileName, async (err) => {
                if (err) {
                    console.error('Error al enviar el archivo:', err);
                }
                
                // Eliminar el archivo temporal después de enviarlo
                try {
                    await fs.unlink(localFilePath);
                } catch (unlinkErr) {
                    console.error('Error al eliminar archivo temporal:', unlinkErr);
                }
            });
        } catch (error) {
            console.error('Error al descargar el archivo:', error);
            // Asegurarse de cerrar la conexión FTP en caso de error
            await ftpService.closeConnection();
            res.status(500).json({ error: 'Error al descargar el archivo' });
        }
    }

    async deletePruebaFile(req, res) {
        try {
            const pruebaId = req.params.pruebaId;
            const fileName = req.params.fileName;
            
            // Verificar que el archivo pertenezca a la prueba correcta
            if (!fileName.startsWith(`prueba_${pruebaId}_`)) {
                return res.status(403).json({ error: 'Acceso denegado al archivo' });
            }
            
            // Ruta completa en el servidor FTP
            const remoteFilePath = `pruebas/${fileName}`;
            
            // Eliminar el archivo del servidor FTP
            const success = await ftpService.deleteFile(remoteFilePath);
            
            // Cerrar la conexión FTP después de completar la operación
            await ftpService.closeConnection();
            
            if (success) {
                res.json({ message: 'Archivo eliminado correctamente' });
            } else {
                res.status(404).json({ error: 'Archivo no encontrado o no se pudo eliminar' });
            }
        } catch (error) {
            console.error('Error al eliminar el archivo:', error);
            // Asegurarse de cerrar la conexión FTP en caso de error
            await ftpService.closeConnection();
            res.status(500).json({ error: 'Error al eliminar el archivo' });
        }
    }
}

module.exports = { FileController, upload };