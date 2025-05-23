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
            await this.client.access(this.config);
            return true;
        } catch (err) {
            console.error('Error al conectar con el servidor FTP:', err);
            return false;
        }
    }

    async uploadFile(localFilePath, remoteFileName) {
        try {
            await this.connect();
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
            const list = await this.client.list(directory);
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
            await this.client.remove(remoteFileName);
            return true;
        } catch (err) {
            console.error('Error al eliminar el archivo:', err);
            return false;
        } finally {
            this.client.close();
        }
    }
}

module.exports = new FtpService();