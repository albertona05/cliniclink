const ftp = require('basic-ftp');
const path = require('path');

class FtpService {
    constructor() {
        this.config = {
            host: '192.168.1.4',
            user: 'cliniclink',
            password: 'cliniclink123',
            secure: false
        };
    }

    createClient() {
        const client = new ftp.Client();
        client.ftp.verbose = false;
        return client;
    }

    async connect(client) {
        const maxRetries = 3;
        let retryCount = 0;

        while (retryCount < maxRetries) {
            try {
                await client.access(this.config);

                try {
                    await client.ensureDir('/recetas');
                } catch (err) {
                    console.error('Error al crear directorio recetas:', err);
                }
                
                try {
                    await client.ensureDir('/facturas');
                } catch (err) {
                    console.error('Error al crear directorio facturas:', err);
                }
                
                try {
                    await client.ensureDir('/pruebas');
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

                await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount - 1)));
            }
        }
        return false;
    }

    async listFiles(directory = '/', ftpDirectory = 'recetas') {
        const client = this.createClient();
        try {
            console.log(`Conectando al FTP para listar archivos en directorio: ${directory}`);
            await this.connect(client);
            console.log(`Conexión FTP establecida, navegando a /${ftpDirectory}`);
            await client.cd(`/${ftpDirectory}`);
            console.log(`Listando archivos en: ${directory === '/' ? '.' : directory}`);
            const list = await client.list(directory === '/' ? '.' : directory);
            console.log(`Archivos encontrados en FTP: ${list.length}`, list.map(f => f.name));
            return list;
        } catch (err) {
            console.error('Error al listar archivos:', err);
            return [];
        } finally {
            client.close();
        }
    }

    async downloadFile(remoteFileName, localFilePath) {
        const client = this.createClient();
        try {
            await this.connect(client);
            await client.cd('/recetas');
            await client.downloadTo(localFilePath, remoteFileName);
            return true;
        } catch (err) {
            console.error('Error al descargar el archivo:', err);
            return false;
        } finally {
            client.close();
        }
    }

    async downloadPruebaFile(remoteFileName, localFilePath) {
        const client = this.createClient();
        try {
            await this.connect(client);
            await client.cd('/pruebas');
            await client.downloadTo(localFilePath, remoteFileName);
            return true;
        } catch (err) {
            console.error('Error al descargar el archivo de prueba:', err);
            return false;
        } finally {
            client.close();
        }
    }

    async deleteFile(remoteFileName) {
        const client = this.createClient();
        try {
            await this.connect(client);
            await client.cd('/recetas');
            await client.remove(remoteFileName);
            return true;
        } catch (err) {
            console.error('Error al eliminar el archivo:', err);
            return false;
        } finally {
            client.close();
        }
    }

    async uploadFile(localPath, remotePath) {
        const maxRetries = 3;
        let retryCount = 0;

        while (retryCount < maxRetries) {
            const client = this.createClient();
            try {
                if (!await this.connect(client)) {
                    throw new Error('No se pudo establecer conexión FTP');
                }

                await client.cd('/recetas');
                console.log('Navegando a directorio: /recetas');
                
                const fileName = remotePath.includes('/') ? remotePath.split('/').pop() : remotePath;
                
                await client.uploadFrom(localPath, fileName);
                console.log(`Archivo subido exitosamente: ${fileName}`);
                return true;
            } catch (err) {
                console.error(`Error al subir el archivo (intento ${retryCount + 1}/${maxRetries}):`, err);
                retryCount++;
                
                if (retryCount === maxRetries) {
                    return false;
                }
                
                await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            } finally {
                client.close();
            }
        }
        return false;
    }
    
    async uploadPruebaFile(localPath, remotePath) {
        const maxRetries = 3;
        let retryCount = 0;

        while (retryCount < maxRetries) {
            const client = this.createClient();
            try {
                if (!await this.connect(client)) {
                    throw new Error('No se pudo establecer conexión FTP');
                }

                await client.cd('/pruebas');
                console.log('Navegando a directorio: /pruebas');
                
                const fileName = remotePath.includes('/') ? remotePath.split('/').pop() : remotePath;
                
                await client.uploadFrom(localPath, fileName);
                console.log(`Archivo de prueba subido exitosamente: ${fileName}`);
                return true;
            } catch (err) {
                console.error(`Error al subir el archivo de prueba (intento ${retryCount + 1}/${maxRetries}):`, err);
                retryCount++;
                
                if (retryCount === maxRetries) {
                    return false;
                }
                
                await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            } finally {
                client.close();
            }
        }
        return false;
    }
    
    async uploadFacturaFile(localPath, remotePath) {
        const maxRetries = 3;
        let retryCount = 0;

        while (retryCount < maxRetries) {
            const client = this.createClient();
            try {
                if (!await this.connect(client)) {
                    throw new Error('No se pudo establecer conexión FTP');
                }

                await client.cd('/facturas');
                console.log('Navegando a directorio: /facturas');

                const fileName = remotePath.includes('/') ? remotePath.split('/').pop() : remotePath;

                await client.uploadFrom(localPath, fileName);
                console.log(`Factura subida exitosamente: ${fileName}`);
                return true;
            } catch (err) {
                console.error(`Error al subir la factura (intento ${retryCount + 1}/${maxRetries}):`, err);
                retryCount++;
                
                if (retryCount === maxRetries) {
                    return false;
                }

                await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            } finally {
                client.close();
            }
        }
        return false;
    }

    async ensureFacturasDirectoryExists(client, closeClient = true) {
        try {
            await this.connect(client);
            
            try {
                // Intentar navegar al directorio /facturas
                await client.cd('/facturas');
                console.log('El directorio /facturas ya existe');
                return true;
            } catch (error) {
                // Si no existe, crearlo
                console.log('El directorio /facturas no existe, creándolo...');
                await client.cd('/');
                await client.mkdir('facturas');
                console.log('Directorio /facturas creado correctamente');
                return true;
            }
        } catch (error) {
            console.error('Error al verificar/crear el directorio /facturas:', error);
            return false;
        } finally {
            // Solo cerrar el cliente si se solicita explícitamente
            if (closeClient && client) {
                client.close();
            }
        }
    }

    async downloadFacturaFile(fileName, localPath) {
        const maxRetries = 3;
        let retries = 0;
        let success = false;

        while (retries < maxRetries && !success) {
            const client = this.createClient();
            try {
                await this.connect(client);
                // No cerrar el cliente después de verificar el directorio
                await this.ensureFacturasDirectoryExists(client, false);
                
                // Navegar al directorio /facturas
                await client.cd('/facturas');
                
                // Descargar el archivo usando directamente el nombre del archivo
                await client.downloadTo(localPath, fileName);
                
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
                if (client) {
                    client.close();
                }
            }
        }
    }

    async downloadFile(remotePath, localPath, directory) {
        const maxRetries = 3;
        let retries = 0;
        let success = false;

        while (retries < maxRetries && !success) {
            const client = this.createClient();
            try {
                await this.connect(client);
                
                // Navegar al directorio especificado
                await client.cd(`/${directory}`);
                
                // Extraer el nombre del archivo de la ruta remota
                const fileName = remotePath.split('/').pop();
                
                // Descargar el archivo
                await client.downloadTo(localPath, fileName);
                
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
                if (client) {
                    client.close();
                }
            }
        }
    }


}

module.exports = new FtpService();