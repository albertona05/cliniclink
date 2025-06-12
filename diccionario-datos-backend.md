# Diccionario de Datos - ClinicLink


---

## 1. Tabla: Usuario
**Descripción:** Almacena la información básica de todos los usuarios del sistema (pacientes, médicos y recepcionistas).

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Identificador único del usuario |
| nombre | VARCHAR(100) | NOT NULL | Nombre completo del usuario |
| email | VARCHAR(255) | NOT NULL, UNIQUE, VALID EMAIL | Correo electrónico único del usuario |
| contrasena | VARCHAR(255) | NOT NULL | Contraseña encriptada del usuario |
| rol | ENUM('paciente', 'medico', 'recepcion') | NOT NULL, DEFAULT 'paciente' | Rol del usuario en el sistema |

**Validaciones:**
- Email debe tener formato válido
- Contraseña debe estar encriptada

---

## 2. Tabla: Paciente
**Descripción:** Información específica de los usuarios que son pacientes.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Identificador único del paciente |
| id_usuario | BIGINT | NOT NULL, FOREIGN KEY → Usuario(id) | Referencia al usuario base |
| dni | VARCHAR(9) | NOT NULL, UNIQUE, PATTERN: '^\d{8}[A-Za-z]$' | DNI del paciente (8 dígitos + letra) |
| telefono | VARCHAR(15) | NOT NULL, NUMERIC, MIN_LENGTH: 9 | Número de teléfono del paciente |
| fechaNacimiento | DATE | NOT NULL | Fecha de nacimiento del paciente |
| direccion | VARCHAR(255) | NOT NULL | Dirección de residencia del paciente |

**Validaciones:**
- DNI debe seguir el formato español (8 dígitos + letra)
- Teléfono debe ser numérico y tener mínimo 9 caracteres

---

## 3. Tabla: Medico
**Descripción:** Información específica de los usuarios que son médicos.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Identificador único del médico |
| id_usuario | BIGINT | NOT NULL, FOREIGN KEY → Usuario(id) | Referencia al usuario base |
| especialidad | VARCHAR(100) | NOT NULL | Especialidad médica del doctor |

---

## 4. Tabla: Recepcion
**Descripción:** Información específica de los usuarios que son recepcionistas.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Identificador único del recepcionista |
| id_usuario | BIGINT | NOT NULL, FOREIGN KEY → Usuario(id) | Referencia al usuario base |

---

## 5. Tabla: Cita
**Descripción:** Gestiona las citas médicas entre pacientes y médicos.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Identificador único de la cita |
| id_paciente | BIGINT | NOT NULL, FOREIGN KEY → Paciente(id) | Paciente que solicita la cita |
| id_medico | BIGINT | NULL, FOREIGN KEY → Medico(id) | Médico asignado a la cita |
| fecha | DATE | NOT NULL | Fecha de la cita |
| hora | TIME | NOT NULL | Hora de la cita |
| estado | ENUM('espera', 'cancelado', 'finalizado') | NOT NULL, DEFAULT 'espera' | Estado actual de la cita |
| info | VARCHAR(100) | NULL | Información adicional sobre la cita |
| id_prueba | BIGINT | NULL, FOREIGN KEY → Prueba(id) | Referencia a prueba médica si aplica |
| es_prueba | BOOLEAN | NOT NULL, DEFAULT false | Indica si la cita es para una prueba médica |
| tipo_prueba | VARCHAR(100) | NULL | Tipo de prueba médica si aplica |

**Reglas de Negocio:**
- Las citas solo pueden programarse en punto o media hora
- Un médico no puede tener dos citas a la misma hora
- Un paciente no puede tener dos citas a la misma hora

---

## 6. Tabla: RecetaMedica
**Descripción:** Almacena las recetas médicas generadas por los médicos.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Identificador único de la receta |
| id_cita | BIGINT | NOT NULL, FOREIGN KEY → Cita(id) | Cita asociada a la receta |
| id_medico | BIGINT | NOT NULL, FOREIGN KEY → Medico(id) | Médico que prescribe la receta |
| id_paciente | BIGINT | NOT NULL, FOREIGN KEY → Paciente(id) | Paciente para quien es la receta |
| descripcion | TEXT | NOT NULL | Descripción general de la receta |
| fecha | DATE | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Fecha de creación de la receta |
| ruta | VARCHAR(255) | NULL | Ruta del archivo PDF de la receta |

---

## 7. Tabla: Medicamento
**Descripción:** Catálogo de medicamentos disponibles en el sistema.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Identificador único del medicamento |
| nombre | VARCHAR(100) | NOT NULL | Nombre comercial del medicamento |
| descripcion | TEXT | NULL | Descripción y propiedades del medicamento |

---

## 8. Tabla: RecetaMedicamento
**Descripción:** Tabla de relación entre recetas médicas y medicamentos con detalles de prescripción.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Identificador único del registro |
| id_receta | BIGINT | NOT NULL, FOREIGN KEY → RecetaMedica(id) | Receta médica asociada |
| id_medicamento | BIGINT | NOT NULL, FOREIGN KEY → Medicamento(id) | Medicamento prescrito |
| frecuencia | VARCHAR(50) | NOT NULL | Frecuencia de toma (ej: "Cada 8 horas") |
| duracion | VARCHAR(50) | NOT NULL | Duración del tratamiento (ej: "7 días") |
| dosis | VARCHAR(50) | NOT NULL | Dosis por toma (ej: "1 comprimido") |
| instrucciones | TEXT | NULL | Instrucciones adicionales para el paciente |

---

## 9. Tabla: Prueba
**Descripción:** Gestiona las pruebas médicas solicitadas por los médicos.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Identificador único de la prueba |
| id_medicoManda | BIGINT | NOT NULL, FOREIGN KEY → Medico(id) | Médico que solicita la prueba |
| id_medicoAsignado | BIGINT | NULL, FOREIGN KEY → Medico(id) | Médico asignado para realizar la prueba |
| id_cita | BIGINT | NULL, FOREIGN KEY → Cita(id) | Cita asociada a la prueba |
| tipo_prueba | VARCHAR(100) | NOT NULL | Tipo de prueba médica |
| descripcion | TEXT | NULL | Descripción detallada de la prueba |
| estado | ENUM('pendiente', 'en_proceso', 'finalizado') | NOT NULL, DEFAULT 'pendiente' | Estado actual de la prueba |
| resultado | TEXT | NULL | Resultados de la prueba |
| fecha_creacion | DATE | NULL, DEFAULT CURRENT_TIMESTAMP | Fecha de creación de la solicitud |
| fecha_realizacion | DATE | NULL | Fecha de realización de la prueba |

---

## 10. Tabla: Factura
**Descripción:** Gestiona la facturación de las consultas y servicios médicos.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Identificador único de la factura |
| id_paciente | BIGINT | NOT NULL, FOREIGN KEY → Paciente(id) | Paciente al que se factura |
| monto | DECIMAL(10,2) | NOT NULL, MIN: 0.01 | Monto total de la factura |
| estado | ENUM('en espera', 'cobrado') | NOT NULL, DEFAULT 'en espera' | Estado de pago de la factura |
| fecha | DATE | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Fecha de generación de la factura |
| ruta | VARCHAR(255) | NULL | Ruta del archivo PDF de la factura |

**Validaciones:**
- El monto debe ser mayor a 0.01
- El monto debe ser un valor decimal válido

---
