const ftp = require('basic-ftp');
const path = require('path');

class FtpService {
    constructor() {
        this.client = new ftp.Client();
        this.client.ftp.verbose = false;
        this.config = {
            host: '192.168.1.4',
            user: 'cliniclink',
            password: 'cliniclink123',
            secure: false
        };
    }

    async connect() {
        try {
            // Si ya hay una conexión activa, la reutilizamos
            if (this.client.closed === false) {
                console.log('Reutilizando conexión FTP existente');
                return true;
            }
            
            console.log(`Conectando al servidor FTP: ${this.config.host}`);
            await this.client.access(this.config);
            console.log('Conexión FTP establecida correctamente');
            return true;
        } catch (err) {
            console.error('Error al conectar con el servidor FTP:', err);
            return false;
        }
    }
    
    async closeConnection() {
        console.log('Cerrando conexión FTP');
        this.client.close();
        console.log('Conexión FTP cerrada');
    }
    
    async directoryExists(dirPath) {
        try {
            console.log(`Verificando si existe el directorio: ${dirPath}`);
            // Guardar el directorio actual
            const currentDir = await this.client.pwd();
            console.log(`Directorio actual: ${currentDir}`);
            
            // Intentar cambiar al directorio para ver si existe
            await this.client.cd(dirPath);
            console.log(`El directorio ${dirPath} existe`);
            
            // Volver al directorio original
            await this.client.cd(currentDir);
            return true;
        } catch (err) {
            console.log(`El directorio ${dirPath} no existe:`, err.message);
            return false;
        }
    }

    async uploadFile(localFilePath, remoteFileName) {
        try {
            await this.connect();
            
            // Extraer el directorio del nombre de archivo remoto
            const remoteDir = path.dirname(remoteFileName);
            
            console.log(`Directorio remoto: ${remoteDir}`);
            console.log(`Nombre de archivo remoto: ${remoteFileName}`);
            
            // Verificar si el directorio existe, si no, crearlo
            if (remoteDir !== '/' && remoteDir !== '.') {
                const dirExists = await this.directoryExists(remoteDir);
                
                if (!dirExists) {
                    // Si no existe, crear el directorio
                    console.log(`Creando directorio: ${remoteDir}`);
                    await this.client.ensureDir(remoteDir);
                    console.log(`Directorio ${remoteDir} creado`);
                }
                
                // Cambiar al directorio donde se subirá el archivo
                console.log(`Cambiando al directorio: ${remoteDir}`);
                await this.client.cd(remoteDir);
            }
            
            // Obtener solo el nombre del archivo sin la ruta
            const fileName = path.basename(remoteFileName);
            console.log(`Nombre de archivo a subir: ${fileName}`);
            
            // Subir el archivo
            console.log(`Subiendo archivo desde ${localFilePath} a ${fileName}`);
            await this.client.uploadFrom(localFilePath, fileName);
            console.log(`Archivo subido correctamente a ${remoteFileName}`);
            
            // Volver al directorio raíz
            await this.client.cd('/');
            
            return true;
        } catch (err) {
            console.error('Error al subir el archivo:', err);
            return false;
        }
    }

    async downloadFile(remoteFileName, localFilePath) {
        try {
            await this.connect();
            console.log(`Descargando archivo desde ${remoteFileName} a ${localFilePath}`);
            await this.client.downloadTo(localFilePath, remoteFileName);
            console.log(`Archivo descargado correctamente desde ${remoteFileName}`);
            return true;
        } catch (err) {
            console.error('Error al descargar el archivo:', err);
            return false;
        }
        // Eliminamos el finally para no cerrar la conexión automáticamente
    }

    async listFiles(directory = '/') {
        try {
            await this.connect();
            console.log(`Listando archivos en directorio: ${directory}`);
            const list = await this.client.list(directory);
            console.log(`Archivos encontrados en ${directory}:`, list.map(item => item.name));
            return list;
        } catch (err) {
            console.error('Error al listar archivos:', err);
            return [];
        }
        // Eliminamos el finally para no cerrar la conexión automáticamente
    }

    async deleteFile(remoteFileName) {
        try {
            await this.connect();
            console.log(`Eliminando archivo: ${remoteFileName}`);
            await this.client.remove(remoteFileName);
            console.log(`Archivo ${remoteFileName} eliminado correctamente`);
            return true;
        } catch (err) {
            console.error('Error al eliminar el archivo:', err);
            return false;
        }
        // Eliminamos el finally para no cerrar la conexión automáticamente
    }
}

module.exports = new FtpService();