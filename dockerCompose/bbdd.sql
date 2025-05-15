CREATE DATABASE clinicLink;
USE clinicLink;


-- Usuarios (3 roles: paciente, medico, recepcion)
INSERT INTO Usuario (nombre, email, contrasena, rol) VALUES
('Juan Pérez', 'juan.perez@example.com', '$2a$10$UIaaQ9nuBiXAUcDlTdsRuud6n6iRUjIPIW.toB3eY6.1a8RboljZe', 'paciente'), --contrasena_segura123
('Dra. Ana Ruiz', 'ana.ruiz@example.com', '$2a$10$UIaaQ9nuBiXAUcDlTdsRuud6n6iRUjIPIW.toB3eY6.1a8RboljZe', 'medico'), --contrasena_segura123
('Carlos López', 'carlos.lopez@example.com', '$2a$10$UIaaQ9nuBiXAUcDlTdsRuud6n6iRUjIPIW.toB3eY6.1a8RboljZe', 'recepcion'); --contrasena_segura123

-- Paciente (ligado al primer usuario)
INSERT INTO Paciente (id_usuario, dni, telefono, fechaNacimiento, direccion) VALUES
(1, '12345678A', '600123456', '1990-05-20', 'Calle Salud 123, Madrid');

-- Médico (ligado al segundo usuario)
INSERT INTO Medico (id_usuario, especialidad) VALUES
(2, 'Cardiología');

-- Recepcionista (ligado al tercer usuario)
INSERT INTO Recepcion (id_usuario) VALUES
(3);

-- Cita
INSERT INTO Cita (id_paciente, id_medico, fecha, hora, estado, info) VALUES
(1, 1, '2025-05-20', '10:30:00', 'espera', 'Chequeo general');

-- Factura (relacionada al paciente)
INSERT INTO Factura (id_paciente, monto, estado, fecha, ruta) VALUES
(1, 75.50, 'en espera', '2025-05-20 10:45:00', NULL);

-- Prueba (ordenada por el médico para la cita anterior)
INSERT INTO Prueba (id_medicoManda, id_cita) VALUES
(1, 1);

-- Receta Médica (relacionada a la cita, médico y paciente)
INSERT INTO RecetaMedica (id_cita, id_medico, id_paciente, descripcion, fecha, ruta) VALUES
(1, 1, 1, 'Paracetamol 500mg cada 8 horas por 5 días', '2025-05-20 11:00:00', NULL);