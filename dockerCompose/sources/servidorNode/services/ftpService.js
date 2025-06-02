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
                    await this.client.ensureDir('/home/cliniclink');
                    await this.client.ensureDir('/home/cliniclink/pruebas');
                } catch (err) {
                    console.error('Error al crear directorios base:', err);
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

    async uploadFile(localFilePath, remoteFileName) {
        try {
            await this.connect();
            // Ensure we're in the correct base directory and create subdirectories
            await this.client.cd('/home/cliniclink/pruebas');
            const directory = path.dirname(remoteFileName);
            if (directory !== '.') {
                try {
                    await this.client.ensureDir(directory);
                } catch (err) {
                    console.log(`Creating directory: ${directory}`);
                    await this.client.mkdir(directory, true);
                }
            }
            await this.client.uploadFrom(localFilePath, remoteFileName);
            return true;
        } catch (err) {
            console.error('Error al subir el archivo:', err);
            return false;
        } finally {
            this.client.close();
        }
    }

    async downloadFile(remoteFileName, localFilePath) {
        try {
            await this.connect();
            await this.client.cd('/home/cliniclink/pruebas');
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
            await this.connect();
            await this.client.cd('/home/cliniclink/pruebas');
            const list = await this.client.list(directory === '/' ? '.' : directory);
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
            await this.client.cd('/home/cliniclink/pruebas');
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

                // Start from root directory
                await this.client.cd('/');
                
                // Create and navigate through each directory level
                const dirs = remotePath.split('/').filter(Boolean);
                let currentPath = '';
                
                for (const dir of dirs.slice(0, -1)) {
                    currentPath += '/' + dir;
                    try {
                        await this.client.cd(currentPath);
                    } catch {
                        await this.client.ensureDir(currentPath);
                        await this.client.cd(currentPath);
                    }
                }
                
                // Upload the file
                await this.client.uploadFrom(localPath, remotePath);
                return true;
            } catch (err) {
                console.error(`Error al subir el archivo (intento ${retryCount + 1}/${maxRetries}):`, err);
                retryCount++;
                
                if (retryCount === maxRetries) {
                    return false;
                }
                
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            }
        }
        return false;
    }
}

module.exports = new FtpService();