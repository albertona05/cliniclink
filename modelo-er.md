# Modelo Entidad-Relación (E/R) - ClinicLink

## Diagrama E/R en Mermaid

```mermaid
erDiagram
    %% Entidades principales
    USUARIO {
        bigint id PK
        varchar(100) nombre
        varchar(255) email UK
        varchar(255) contrasena
        enum rol
    }
    
    PACIENTE {
        bigint id PK
        bigint id_usuario FK
        varchar(9) dni UK
        varchar(15) telefono
        date fechaNacimiento
        varchar(255) direccion
    }
    
    MEDICO {
        bigint id PK
        bigint id_usuario FK
        varchar(100) especialidad
    }
    
    RECEPCION {
        bigint id PK
        bigint id_usuario FK
    }
    
    CITA {
        bigint id PK
        bigint id_paciente FK
        bigint id_medico FK
        date fecha
        time hora
        enum estado
        varchar(100) info
        bigint id_prueba FK
        boolean es_prueba
        varchar(100) tipo_prueba
    }
    
    RECETA_MEDICA {
        bigint id PK
        bigint id_cita FK
        bigint id_medico FK
        bigint id_paciente FK
        text descripcion
        date fecha
        varchar(255) ruta
    }
    
    MEDICAMENTO {
        bigint id PK
        varchar(100) nombre
        text descripcion
    }
    
    RECETA_MEDICAMENTO {
        bigint id PK
        bigint id_receta FK
        bigint id_medicamento FK
        varchar(50) frecuencia
        varchar(50) duracion
        varchar(50) dosis
        text instrucciones
    }
    
    PRUEBA {
        bigint id PK
        bigint id_medicoManda FK
        bigint id_medicoAsignado FK
        bigint id_cita FK
        varchar(100) tipo_prueba
        text descripcion
        enum estado
        text resultado
        date fecha_creacion
        date fecha_realizacion
    }
    
    FACTURA {
        bigint id PK
        bigint id_paciente FK
        decimal(10,2) monto
        enum estado
        date fecha
        varchar(255) ruta
    }
    
    %% Relaciones
    USUARIO ||--|| PACIENTE : "hereda"
    USUARIO ||--|| MEDICO : "hereda"
    USUARIO ||--|| RECEPCION : "hereda"
    
    PACIENTE ||--o{ CITA : "solicita"
    MEDICO ||--o{ CITA : "atiende"
    
    CITA ||--o{ RECETA_MEDICA : "genera"
    MEDICO ||--o{ RECETA_MEDICA : "prescribe"
    PACIENTE ||--o{ RECETA_MEDICA : "recibe"
    
    RECETA_MEDICA ||--o{ RECETA_MEDICAMENTO : "contiene"
    MEDICAMENTO ||--o{ RECETA_MEDICAMENTO : "incluido_en"
    
    MEDICO ||--o{ PRUEBA : "solicita"
    MEDICO ||--o{ PRUEBA : "realiza"
    CITA ||--o{ PRUEBA : "origina"
    
    PACIENTE ||--o{ FACTURA : "debe_pagar"
```

## Descripción de Entidades

### 1. USUARIO
**Entidad padre** que almacena información común de todos los usuarios del sistema.
- **Atributos clave:** id (PK), email (UK)
- **Especialización:** Se especializa en PACIENTE, MEDICO y RECEPCION

### 2. PACIENTE
**Especialización de USUARIO** para personas que reciben atención médica.
- **Atributos únicos:** dni (UK), telefono, fechaNacimiento, direccion
- **Relaciones:** Solicita citas, recibe recetas, debe pagar facturas

### 3. MEDICO
**Especialización de USUARIO** para profesionales médicos.
- **Atributos únicos:** especialidad
- **Relaciones:** Atiende citas, prescribe recetas, solicita y realiza pruebas

### 4. RECEPCION
**Especialización de USUARIO** para personal administrativo.
- **Función:** Gestión administrativa del sistema

### 5. CITA
**Entidad central** que conecta pacientes con médicos.
- **Atributos:** fecha, hora, estado, información adicional
- **Relaciones:** Puede generar recetas y originar pruebas

### 6. RECETA_MEDICA
**Documento médico** que prescribe tratamientos.
- **Relaciones:** Asociada a una cita, prescrita por un médico, dirigida a un paciente

### 7. MEDICAMENTO
**Catálogo** de medicamentos disponibles.
- **Relaciones:** Puede ser incluido en múltiples recetas

### 8. RECETA_MEDICAMENTO
**Entidad de relación** entre RECETA_MEDICA y MEDICAMENTO.
- **Atributos:** frecuencia, duración, dosis, instrucciones

### 9. PRUEBA
**Exámenes médicos** solicitados por médicos.
- **Relaciones:** Solicitada por un médico, puede ser realizada por otro médico

### 10. FACTURA
**Documento de cobro** por servicios médicos.
- **Relaciones:** Asociada a un paciente específico

## Tipos de Relaciones

### Relaciones de Herencia (1:1)
- USUARIO → PACIENTE
- USUARIO → MEDICO  
- USUARIO → RECEPCION

### Relaciones Uno a Muchos (1:N)
- PACIENTE → CITA
- MEDICO → CITA
- CITA → RECETA_MEDICA
- MEDICO → RECETA_MEDICA
- PACIENTE → RECETA_MEDICA
- RECETA_MEDICA → RECETA_MEDICAMENTO
- MEDICO → PRUEBA (solicita)
- MEDICO → PRUEBA (realiza)
- CITA → PRUEBA
- PACIENTE → FACTURA

### Relaciones Muchos a Muchos (N:M)
- RECETA_MEDICA ↔ MEDICAMENTO (a través de RECETA_MEDICAMENTO)

## Restricciones de Integridad

### Restricciones de Dominio
- `rol` ∈ {'paciente', 'medico', 'recepcion'}
- `estado_cita` ∈ {'espera', 'cancelado', 'finalizado'}
- `estado_prueba` ∈ {'pendiente', 'en_proceso', 'finalizado'}
- `estado_factura` ∈ {'en espera', 'cobrado'}
- `dni` debe seguir patrón: 8 dígitos + 1 letra
- `email` debe tener formato válido
- `monto` > 0.01

### Restricciones de Entidad
- Cada entidad tiene clave primaria única
- Atributos marcados como UK (Unique Key) deben ser únicos

### Restricciones Referenciales
- Todas las claves foráneas deben referenciar claves primarias existentes
- Integridad referencial en cascada para eliminaciones

### Restricciones Semánticas
- Un médico no puede tener dos citas a la misma hora
- Un paciente no puede tener dos citas a la misma hora
- Las citas solo pueden programarse en punto o media hora
- Una receta debe estar asociada a una cita finalizada
- Una prueba debe tener al menos un médico que la solicite