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
                
                try {
                    await this.client.ensureDir('/facturas');
                } catch (err) {
                    console.error('Error al crear directorio facturas:', err);
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
    
    async uploadFacturaFile(localPath, remotePath) {
        const maxRetries = 3;
        let retryCount = 0;

        while (retryCount < maxRetries) {
            try {
                // Ensure connection is active
                if (!await this.connect()) {
                    throw new Error('No se pudo establecer conexión FTP');
                }

                // Navigate to facturas directory
                await this.client.cd('/facturas');
                console.log('Navegando a directorio: /facturas');
                
                // Extract just the filename from remotePath
                const fileName = remotePath.includes('/') ? remotePath.split('/').pop() : remotePath;
                
                // Upload the file with just the filename
                await this.client.uploadFrom(localPath, fileName);
                console.log(`Factura subida exitosamente: ${fileName}`);
                return true;
            } catch (err) {
                console.error(`Error al subir la factura (intento ${retryCount + 1}/${maxRetries}):`, err);
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

    async ensureFacturasDirectoryExists(closeClient = true) {
        try {
            await this.connect();
            
            try {
                // Intentar navegar al directorio /facturas
                await this.client.cd('/facturas');
                console.log('El directorio /facturas ya existe');
                return true;
            } catch (error) {
                // Si no existe, crearlo
                console.log('El directorio /facturas no existe, creándolo...');
                await this.client.cd('/');
                await this.client.mkdir('facturas');
                console.log('Directorio /facturas creado correctamente');
                return true;
            }
        } catch (error) {
            console.error('Error al verificar/crear el directorio /facturas:', error);
            return false;
        } finally {
            // Solo cerrar el cliente si se solicita explícitamente
            if (closeClient && this.client) {
                this.client.close();
            }
        }
    }


    async downloadFacturaFile(remotePath, localPath) {
        const maxRetries = 3;
        let retries = 0;
        let success = false;

        while (retries < maxRetries && !success) {
          try {
            await this.connect();
            // No cerrar el cliente después de verificar el directorio
            await this.ensureFacturasDirectoryExists(false);
            
            // Navegar al directorio /facturas
            await this.client.cd('/facturas');
            
            // Extraer el nombre del archivo de la ruta remota
            const fileName = remotePath.split('/').pop();
            
            // Descargar el archivo
            await this.client.downloadTo(localPath, fileName);
            
            success = true;
          } catch (error) {
            retries++;
            console.error(`Error al descargar archivo de factura (intento ${retries}/${maxRetries}):`, error);
            
            if (retries >= maxRetries) {
              throw new Error(`No se pudo descargar el archivo de factura después de ${maxRetries} intentos: ${error.message}`);
            }
            
            // Esperar antes de reintentar
            await new Promise(resolve => setTimeout(resolve, 1000 * retries));
          } finally {
            if (this.client) {
              this.client.close();
            }
          }
        }
    }

    async downloadFile(remotePath, localPath, directory) {
        const maxRetries = 3;
        let retries = 0;
        let success = false;

        while (retries < maxRetries && !success) {
          try {
            await this.connect();
            
            // Navegar al directorio especificado
            await this.client.cd(`/${directory}`);
            
            // Extraer el nombre del archivo de la ruta remota
            const fileName = remotePath.split('/').pop();
            
            // Descargar el archivo
            await this.client.downloadTo(localPath, fileName);
            
            success = true;
          } catch (error) {
            retries++;
            console.error(`Error al descargar archivo de ${directory} (intento ${retries}/${maxRetries}):`, error);
            
            if (retries >= maxRetries) {
              throw new Error(`No se pudo descargar el archivo después de ${maxRetries} intentos: ${error.message}`);
            }
            
            // Esperar antes de reintentar
            await new Promise(resolve => setTimeout(resolve, 1000 * retries));
          } finally {
            if (this.client) {
              this.client.close();
            }
          }
        }
    }
}

module.exports = new FtpService();