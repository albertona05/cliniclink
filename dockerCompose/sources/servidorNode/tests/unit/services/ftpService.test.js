const FtpService = require('../../../services/ftpService');
const ftp = require('basic-ftp');
const fs = require('fs');

// Mock de basic-ftp y fs
jest.mock('basic-ftp');
jest.mock('fs');

describe('FtpService Tests', () => {
    let ftpService;
    let mockClient;

    beforeEach(() => {
        ftpService = new FtpService();
        mockClient = {
            access: jest.fn(),
            ensureDir: jest.fn(),
            uploadFrom: jest.fn(),
            downloadTo: jest.fn(),
            list: jest.fn(),
            close: jest.fn(),
            ftp: { verbose: false }
        };
        
        ftp.Client.mockImplementation(() => mockClient);
        jest.clearAllMocks();
    });

    describe('connect', () => {
        test('debería conectar exitosamente y crear directorios', async () => {
            mockClient.access.mockResolvedValue();
            mockClient.ensureDir.mockResolvedValue();

            const result = await ftpService.connect(mockClient);

            expect(result).toBe(true);
            expect(mockClient.access).toHaveBeenCalledWith(ftpService.config);
            expect(mockClient.ensureDir).toHaveBeenCalledWith('/recetas');
            expect(mockClient.ensureDir).toHaveBeenCalledWith('/facturas');
            expect(mockClient.ensureDir).toHaveBeenCalledWith('/pruebas');
        });

        test('debería manejar errores de conexión', async () => {
            mockClient.access.mockRejectedValue(new Error('Connection failed'));

            const result = await ftpService.connect(mockClient);

            expect(result).toBe(false);
            expect(mockClient.access).toHaveBeenCalledTimes(3); // 3 reintentos
        });
    });

    describe('uploadFile', () => {
        test('debería subir archivo exitosamente', async () => {
            const mockStats = { isFile: () => true };
            fs.existsSync.mockReturnValue(true);
            fs.statSync.mockReturnValue(mockStats);
            mockClient.access.mockResolvedValue();
            mockClient.ensureDir.mockResolvedValue();
            mockClient.uploadFrom.mockResolvedValue();

            const result = await ftpService.uploadFile('/local/path/file.txt', '/remote/path/file.txt');

            expect(result.success).toBe(true);
            expect(mockClient.uploadFrom).toHaveBeenCalledWith('/local/path/file.txt', '/remote/path/file.txt');
        });

        test('debería fallar si el archivo no existe', async () => {
            fs.existsSync.mockReturnValue(false);

            const result = await ftpService.uploadFile('/nonexistent/file.txt', '/remote/path/file.txt');

            expect(result.success).toBe(false);
            expect(result.error).toContain('no existe');
        });
    });

    describe('createClient', () => {
        test('debería crear un cliente FTP', () => {
            const client = ftpService.createClient();

            expect(ftp.Client).toHaveBeenCalled();
            expect(client.ftp.verbose).toBe(false);
        });
    });
});