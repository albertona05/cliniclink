-- Script para insertar medicamentos iniciales
USE clinicLink;

-- Crear tabla Medicamento si no existe
CREATE TABLE IF NOT EXISTS Medicamento (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
);

-- Crear tabla RecetaMedicamento si no existe
CREATE TABLE IF NOT EXISTS RecetaMedicamento (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_receta BIGINT NOT NULL,
    id_medicamento BIGINT NOT NULL,
    frecuencia VARCHAR(50) NOT NULL,
    duracion VARCHAR(50) NOT NULL,
    dosis VARCHAR(50) NOT NULL,
    instrucciones TEXT,
    FOREIGN KEY (id_receta) REFERENCES RecetaMedica(id),
    FOREIGN KEY (id_medicamento) REFERENCES Medicamento(id)
);

-- Insertar medicamentos comunes
INSERT INTO Medicamento (nombre, descripcion) VALUES
('Paracetamol 500mg', 'Analgésico y antipirético'),
('Ibuprofeno 400mg', 'Antiinflamatorio no esteroideo'),
('Amoxicilina 500mg', 'Antibiótico de amplio espectro'),
('Loratadina 10mg', 'Antihistamínico'),
('Omeprazol 20mg', 'Inhibidor de la bomba de protones'),
('Atorvastatina 20mg', 'Estatina para reducir el colesterol'),
('Metformina 850mg', 'Antidiabético oral'),
('Enalapril 10mg', 'Inhibidor de la ECA para hipertensión'),
('Diazepam 5mg', 'Ansiolítico'),
('Salbutamol inhalador', 'Broncodilatador');