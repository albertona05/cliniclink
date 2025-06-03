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
        const maxRetries = 3;
        let retryCount = 0;

        while (retryCount < maxRetries) {
            try {
                await this.client.access(this.config);
                
                // Create base directories if they don't exist
                try {
                    await this.client.ensureDir('/pruebas');
                } catch (err) {
                    console.error('Error al crear directorio pruebas:', err);
                }
                
                return true;
            } catch (err) {
                console.error(`Error al conectar con el servidor FTP (intento ${retryCount + 1}/${maxRetries}):`, err);
                retryCount++;
                
                if (retryCount === maxRetries) {
                    return false;
                }
                
                // Wait before retrying with exponential backoff
                await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount - 1)));
            }
        }
        return false;
    }

    // Método eliminado - se usa el método uploadFile con retry logic más abajo

    async downloadFile(remoteFileName, localFilePath) {
        try {
            await this.connect();
            await this.client.cd('/pruebas');
            await this.client.downloadTo(localFilePath, remoteFileName);
            return true;
        } catch (err) {
            console.error('Error al descargar el archivo:', err);
            return false;
        } finally {
            this.client.close();
        } finally {
            this.client.close();
        }
    }

    async listFiles(directory = '/') {
        try {
            console.log(`Conectando al FTP para listar archivos en directorio: ${directory}`);
            await this.connect();
            console.log('Conexión FTP establecida, navegando a /pruebas');
            await this.client.cd('/pruebas');
            console.log(`Listando archivos en: ${directory === '/' ? '.' : directory}`);
            const list = await this.client.list(directory === '/' ? '.' : directory);
            console.log(`Archivos encontrados en FTP: ${list.length}`, list.map(f => f.name));
            return list;
        } catch (err) {
            console.error('Error al listar archivos:', err);
            return [];
        } finally {
            this.client.close();
        } finally {
            this.client.close();
        }
    }

    async deleteFile(remoteFileName) {
        try {
            await this.connect();
            await this.client.cd('/pruebas');
            await this.client.remove(remoteFileName);
            return true;
        } catch (err) {
            console.error('Error al eliminar el archivo:', err);
            return false;
        } finally {
            this.client.close();
        }
    }

    async uploadFile(localPath, remotePath) {
        const maxRetries = 3;
        let retryCount = 0;

        while (retryCount < maxRetries) {
            try {
                // Ensure connection is active
                if (!await this.connect()) {
                    throw new Error('No se pudo establecer conexión FTP');
                }

                // Navigate to pruebas directory
                await this.client.cd('/pruebas');
                console.log('Navegando a directorio: /pruebas');
                
                // Extract just the filename from remotePath (remove 'pruebas/' prefix if present)
                const fileName = remotePath.includes('/') ? remotePath.split('/').pop() : remotePath;
                
                // Upload the file with just the filename
                await this.client.uploadFrom(localPath, fileName);
                console.log(`Archivo subido exitosamente: ${fileName}`);
                return true;
            } catch (err) {
                console.error(`Error al subir el archivo (intento ${retryCount + 1}/${maxRetries}):`, err);
                retryCount++;
                
                if (retryCount === maxRetries) {
                    return false;
                }
                
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            } finally {
                this.client.close();
            }
        }
        return false;
    }
}

module.exports = new FtpService();