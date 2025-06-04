
USE clinicLink;

-- Usuarios
INSERT INTO Usuario (nombre, email, contrasena, rol) VALUES
('Admin', 'admin@cliniclink.com', '$2a$10$eoW14Fq.d9m1sBssQnwQ4u9fv4q77iBmN9nl6iIv5lvIRUZ5l4ljC', 'recepcion'),
('Dr. Juan Perez', 'juan.perez@cliniclink.com', '$2a$10$eoW14Fq.d9m1sBssQnwQ4u9fv4q77iBmN9nl6iIv5lvIRUZ5l4ljC', 'medico'),
('Dra. Maria Lopez', 'maria.lopez@cliniclink.com', '$2a$10$eoW14Fq.d9m1sBssQnwQ4u9fv4q77iBmN9nl6iIv5lvIRUZ5l4ljC', 'medico'),
('Carlos Rodriguez', 'carlos@example.com', '$2a$10$eoW14Fq.d9m1sBssQnwQ4u9fv4q77iBmN9nl6iIv5lvIRUZ5l4ljC', 'paciente'),
('Ana Martinez', 'ana@example.com', '$2a$10$eoW14Fq.d9m1sBssQnwQ4u9fv4q77iBmN9nl6iIv5lvIRUZ5l4ljC', 'paciente');

-- Recepcion
INSERT INTO Recepcion (id_usuario) VALUES (1);

-- Medicos
INSERT INTO Medico (id_usuario, especialidad) VALUES
(2, 'Cardiologia'),
(3, 'Dermatologia');

-- Pacientes
INSERT INTO Paciente (id_usuario, dni, telefono, fechaNacimiento, direccion) VALUES
(4, '12345678A', '600123456', '1985-05-15', 'Calle Principal 123'),
(5, '87654321B', '600654321', '1990-10-20', 'Avenida Central 456');

-- Medicamentos
INSERT INTO Medicamento (nombre, descripcion) VALUES
('Paracetamol', 'Analgesico y antipiretico'),
('Ibuprofeno', 'Antiinflamatorio no esteroideo'),
('Amoxicilina', 'Antibiotico de amplio espectro');

-- Citas
INSERT INTO Cita (id_paciente, id_medico, fecha, hora, estado, info) VALUES
(1, 1, '2023-12-01', '10:00:00', 'espera', 'Consulta rutinaria'),
(2, 2, '2023-12-02', '11:30:00', 'espera', 'Revision dermatologica'),
(1, 2, '2023-12-05', '09:15:00', 'espera', 'Seguimiento');

-- Pruebas
INSERT INTO Prueba (id_medicoManda, tipo_prueba, descripcion, estado) VALUES
(1, 'Electrocardiograma', 'Evaluacion de la actividad electrica del corazon', 'pendiente'),
(2, 'Análisis de sangre', 'Hemograma completo', 'pendiente');

-- Actualizar citas con pruebas
UPDATE Cita SET id_prueba = 1, es_prueba = TRUE, tipo_prueba = 'Electrocardiograma' WHERE id = 3;

-- Actualizar pruebas con citas
UPDATE Prueba SET id_cita = 3 WHERE id = 1;

-- Recetas medicas
INSERT INTO RecetaMedica (id_cita, id_medico, id_paciente, descripcion, fecha) VALUES
(1, 1, 1, 'Tratamiento para hipertension', NOW()),
(2, 2, 2, 'Tratamiento para dermatitis', NOW());

-- Recetas con medicamentos
INSERT INTO RecetaMedicamento (id_receta, id_medicamento, frecuencia, duracion, dosis, instrucciones) VALUES
(1, 1, 'Cada 8 horas', '7 dias', '1 comprimido', 'Tomar despues de las comidas'),
(1, 2, 'Cada 12 horas', '5 dias', '1 comprimido', 'Tomar con alimentos'),
(2, 3, 'Cada 8 horas', '10 dias', '1 cápsula', 'Completar todo el tratamiento');

-- Facturas
INSERT INTO Factura (id_paciente, monto, estado, fecha) VALUES
(1, 150.00, 'en espera', NOW()),
(2, 200.00, 'cobrado', NOW());