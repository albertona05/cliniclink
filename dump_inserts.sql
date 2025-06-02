
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `Cita`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Cita` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `id_paciente` bigint NOT NULL,
  `id_medico` bigint DEFAULT NULL,
  `fecha` datetime NOT NULL,
  `hora` time NOT NULL,
  `estado` enum('espera','cancelado','finalizado') NOT NULL DEFAULT 'espera',
  `info` varchar(100) DEFAULT NULL,
  `id_prueba` bigint DEFAULT NULL,
  `es_prueba` tinyint(1) NOT NULL DEFAULT '0',
  `tipo_prueba` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_paciente` (`id_paciente`),
  KEY `id_medico` (`id_medico`),
  KEY `id_prueba` (`id_prueba`),
  CONSTRAINT `Cita_ibfk_182` FOREIGN KEY (`id_paciente`) REFERENCES `Paciente` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Cita_ibfk_183` FOREIGN KEY (`id_medico`) REFERENCES `Medico` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Cita_ibfk_184` FOREIGN KEY (`id_prueba`) REFERENCES `Prueba` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `Cita` WRITE;
/*!40000 ALTER TABLE `Cita` DISABLE KEYS */;
INSERT INTO `Cita` (`id`, `id_paciente`, `id_medico`, `fecha`, `hora`, `estado`, `info`, `id_prueba`, `es_prueba`, `tipo_prueba`) VALUES (1,1,1,'2025-05-20 00:00:00','10:30:00','espera','Chequeo general',NULL,0,NULL),(2,1,1,'2025-05-16 00:00:00','08:00:00','espera',NULL,NULL,0,NULL),(3,1,1,'2025-05-21 00:00:00','08:00:00','finalizado','asdsadd',NULL,0,NULL),(4,1,1,'2025-05-20 00:00:00','08:00:00','cancelado',NULL,NULL,0,NULL),(5,1,1,'2025-05-20 00:00:00','18:00:00','espera',NULL,NULL,0,NULL),(6,1,1,'2025-05-20 00:00:00','08:30:00','finalizado','dfgsgsdf',NULL,0,NULL),(7,1,1,'2025-05-20 00:00:00','08:30:00','finalizado','Prueba: Análisis de sangre. \nResultado: aaaa',2,0,NULL),(8,1,1,'2025-05-20 00:00:00','08:30:00','finalizado','Prueba: Análisis de sangre. \nResultado: qqqqqqqqqqqqq',3,1,'Análisis de sangre'),(9,1,1,'2025-05-20 00:00:00','08:30:00','finalizado','Prueba: Radiografía. \nResultado: dasfasdfsdf',4,1,'Radiografía'),(10,1,1,'2025-05-20 00:00:00','08:30:00','espera','Prueba: Radiografía. ',5,1,'Radiografía'),(11,1,1,'2025-05-20 00:00:00','08:30:00','espera','Prueba: Radiografía. ',6,1,'Radiografía'),(12,1,1,'2025-05-20 00:00:00','08:30:00','espera','Prueba: Radiografía. ',7,1,'Radiografía'),(13,1,1,'2025-05-20 00:00:00','08:30:00','finalizado','Prueba: Radiografía. \nResultado: Muy bine\nResultado: PDF',8,1,'Radiografía'),(14,1,1,'2025-05-20 00:00:00','10:30:00','espera','Prueba: Análisis de sangre. ',9,1,'Análisis de sangre'),(15,1,1,'2025-05-20 00:00:00','10:30:00','espera','Prueba: Radiografía. ',10,1,'Radiografía'),(16,1,1,'2025-05-20 00:00:00','10:30:00','espera','Prueba: Radiografía. ',11,1,'Radiografía'),(17,1,1,'2025-05-27 00:00:00','11:00:00','cancelado','Prueba: Radiografía. ',13,1,'Radiografía'),(18,1,1,'2025-05-24 00:00:00','08:00:00','espera',NULL,NULL,0,NULL),(19,1,1,'2025-05-26 00:00:00','08:00:00','finalizado','Prueba: Radiografía. \nResultado: aaaaaaaaaaaaaaaaaaaaaaa',14,1,'Radiografía'),(20,1,1,'2025-05-30 00:00:00','12:30:00','finalizado','Prueba: Análisis de sangre. fsdafdsdfdsf\nResultado: dsfgsdfgdfg',15,1,'Análisis de sangre'),(21,1,1,'2025-06-04 00:00:00','12:00:00','finalizado','Prueba: TAC. \nResultado: asdasdfsadfdsaf',16,1,'TAC'),(22,1,1,'2025-06-12 00:00:00','19:00:00','finalizado','aaaaaaa',NULL,0,NULL),(23,1,1,'2025-06-13 00:00:00','08:00:00','espera','Prueba: Resonancia magnética. ',17,1,'Resonancia magnética'),(24,1,1,'2025-06-15 00:00:00','11:00:00','finalizado','Prueba: Electrocardiograma. \nResultado: 111111111111111111111',18,1,'Electrocardiograma'),(25,1,1,'2025-06-12 00:00:00','08:00:00','finalizado','Prueba: Ecografía. Esta es\nResultado: Ahora siiiii',19,1,'Ecografía'),(26,1,1,'2025-06-05 00:00:00','08:00:00','espera',NULL,NULL,0,NULL),(27,1,1,'2025-06-10 00:00:00','08:00:00','finalizado','Prueba: Análisis de sangre. sera esta?\nResultado: Eso espero',20,1,'Análisis de sangre');
/*!40000 ALTER TABLE `Cita` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `Factura`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Factura` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `id_paciente` bigint NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `estado` enum('en espera','cobrado') NOT NULL DEFAULT 'en espera',
  `fecha` datetime NOT NULL,
  `ruta` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_paciente` (`id_paciente`),
  CONSTRAINT `Factura_ibfk_1` FOREIGN KEY (`id_paciente`) REFERENCES `Paciente` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `Factura` WRITE;
/*!40000 ALTER TABLE `Factura` DISABLE KEYS */;
INSERT INTO `Factura` (`id`, `id_paciente`, `monto`, `estado`, `fecha`, `ruta`) VALUES (1,1,75.50,'en espera','2025-05-20 10:45:00',NULL),(2,1,100.00,'en espera','2025-05-19 07:58:04',NULL),(3,1,1000.00,'en espera','2025-05-28 12:52:08',NULL),(4,1,120.00,'en espera','2025-05-29 08:28:07',NULL),(5,1,120.00,'en espera','2025-05-29 08:28:08',NULL);
/*!40000 ALTER TABLE `Factura` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `Medicamento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Medicamento` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `Medicamento` WRITE;
/*!40000 ALTER TABLE `Medicamento` DISABLE KEYS */;
INSERT INTO `Medicamento` (`id`, `nombre`, `descripcion`) VALUES (1,'Paracetamol','Analgsico y antipirtico utilizado para aliviar el dolor y la fiebre.');
/*!40000 ALTER TABLE `Medicamento` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `Medico`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Medico` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `id_usuario` bigint NOT NULL,
  `especialidad` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `id_usuario` (`id_usuario`),
  CONSTRAINT `Medico_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `Medico` WRITE;
/*!40000 ALTER TABLE `Medico` DISABLE KEYS */;
INSERT INTO `Medico` (`id`, `id_usuario`, `especialidad`) VALUES (1,2,'Cardiologa');
/*!40000 ALTER TABLE `Medico` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `Paciente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Paciente` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `id_usuario` bigint NOT NULL,
  `dni` varchar(9) NOT NULL,
  `telefono` varchar(15) NOT NULL,
  `fechaNacimiento` date NOT NULL,
  `direccion` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `dni` (`dni`),
  UNIQUE KEY `dni_2` (`dni`),
  UNIQUE KEY `dni_3` (`dni`),
  UNIQUE KEY `dni_4` (`dni`),
  UNIQUE KEY `dni_5` (`dni`),
  UNIQUE KEY `dni_6` (`dni`),
  UNIQUE KEY `dni_7` (`dni`),
  UNIQUE KEY `dni_8` (`dni`),
  UNIQUE KEY `dni_9` (`dni`),
  UNIQUE KEY `dni_10` (`dni`),
  UNIQUE KEY `dni_11` (`dni`),
  UNIQUE KEY `dni_12` (`dni`),
  UNIQUE KEY `dni_13` (`dni`),
  UNIQUE KEY `dni_14` (`dni`),
  UNIQUE KEY `dni_15` (`dni`),
  UNIQUE KEY `dni_16` (`dni`),
  UNIQUE KEY `dni_17` (`dni`),
  UNIQUE KEY `dni_18` (`dni`),
  UNIQUE KEY `dni_19` (`dni`),
  UNIQUE KEY `dni_20` (`dni`),
  UNIQUE KEY `dni_21` (`dni`),
  UNIQUE KEY `dni_22` (`dni`),
  UNIQUE KEY `dni_23` (`dni`),
  UNIQUE KEY `dni_24` (`dni`),
  UNIQUE KEY `dni_25` (`dni`),
  UNIQUE KEY `dni_26` (`dni`),
  UNIQUE KEY `dni_27` (`dni`),
  UNIQUE KEY `dni_28` (`dni`),
  UNIQUE KEY `dni_29` (`dni`),
  UNIQUE KEY `dni_30` (`dni`),
  UNIQUE KEY `dni_31` (`dni`),
  UNIQUE KEY `dni_32` (`dni`),
  UNIQUE KEY `dni_33` (`dni`),
  UNIQUE KEY `dni_34` (`dni`),
  UNIQUE KEY `dni_35` (`dni`),
  UNIQUE KEY `dni_36` (`dni`),
  UNIQUE KEY `dni_37` (`dni`),
  UNIQUE KEY `dni_38` (`dni`),
  UNIQUE KEY `dni_39` (`dni`),
  UNIQUE KEY `dni_40` (`dni`),
  UNIQUE KEY `dni_41` (`dni`),
  UNIQUE KEY `dni_42` (`dni`),
  UNIQUE KEY `dni_43` (`dni`),
  UNIQUE KEY `dni_44` (`dni`),
  UNIQUE KEY `dni_45` (`dni`),
  UNIQUE KEY `dni_46` (`dni`),
  UNIQUE KEY `dni_47` (`dni`),
  UNIQUE KEY `dni_48` (`dni`),
  UNIQUE KEY `dni_49` (`dni`),
  UNIQUE KEY `dni_50` (`dni`),
  UNIQUE KEY `dni_51` (`dni`),
  UNIQUE KEY `dni_52` (`dni`),
  UNIQUE KEY `dni_53` (`dni`),
  UNIQUE KEY `dni_54` (`dni`),
  UNIQUE KEY `dni_55` (`dni`),
  UNIQUE KEY `dni_56` (`dni`),
  UNIQUE KEY `dni_57` (`dni`),
  UNIQUE KEY `dni_58` (`dni`),
  UNIQUE KEY `dni_59` (`dni`),
  UNIQUE KEY `dni_60` (`dni`),
  UNIQUE KEY `dni_61` (`dni`),
  UNIQUE KEY `dni_62` (`dni`),
  KEY `id_usuario` (`id_usuario`),
  CONSTRAINT `Paciente_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `Paciente` WRITE;
/*!40000 ALTER TABLE `Paciente` DISABLE KEYS */;
INSERT INTO `Paciente` (`id`, `id_usuario`, `dni`, `telefono`, `fechaNacimiento`, `direccion`) VALUES (1,1,'12345678A','600123456','1990-05-20','Calle Salud 123, Madrid');
/*!40000 ALTER TABLE `Paciente` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `Prueba`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Prueba` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `id_medicoManda` bigint NOT NULL,
  `id_cita` bigint NOT NULL,
  `id_medicoAsignado` bigint DEFAULT NULL,
  `tipo_prueba` varchar(100) NOT NULL,
  `descripcion` text,
  `estado` enum('pendiente','en_proceso','finalizado') NOT NULL DEFAULT 'pendiente',
  `resultado` text,
  `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `fecha_realizacion` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_medicoManda` (`id_medicoManda`),
  KEY `id_cita` (`id_cita`),
  KEY `id_medicoAsignado` (`id_medicoAsignado`),
  CONSTRAINT `Prueba_ibfk_117` FOREIGN KEY (`id_medicoManda`) REFERENCES `Medico` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `Prueba_ibfk_118` FOREIGN KEY (`id_cita`) REFERENCES `Cita` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `Prueba_ibfk_119` FOREIGN KEY (`id_medicoAsignado`) REFERENCES `Medico` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `Prueba` WRITE;
/*!40000 ALTER TABLE `Prueba` DISABLE KEYS */;
INSERT INTO `Prueba` (`id`, `id_medicoManda`, `id_cita`, `id_medicoAsignado`, `tipo_prueba`, `descripcion`, `estado`, `resultado`, `fecha_creacion`, `fecha_realizacion`) VALUES (1,1,1,NULL,'',NULL,'pendiente',NULL,NULL,NULL),(2,1,6,1,'Análisis de sangre','','finalizado','aaaa','2025-05-23 07:43:08','2025-05-23 07:44:14'),(3,1,6,1,'Análisis de sangre','','finalizado','qqqqqqqqqqqqq','2025-05-23 08:19:51','2025-05-26 09:17:25'),(4,1,6,1,'Radiografía','','finalizado','dasfasdfsdf','2025-05-23 08:29:31','2025-05-28 10:57:01'),(5,1,6,1,'Radiografía','','pendiente','','2025-05-23 08:35:59',NULL),(6,1,6,1,'Radiografía','','pendiente','','2025-05-23 09:00:35',NULL),(7,1,6,1,'Radiografía','','pendiente','','2025-05-23 09:01:29',NULL),(8,1,6,1,'Radiografía','','finalizado','PDF','2025-05-23 09:06:44','2025-05-23 13:10:17'),(9,1,1,1,'Análisis de sangre','','pendiente','','2025-05-23 09:11:54',NULL),(10,1,1,1,'Radiografía','','pendiente','','2025-05-23 09:14:53',NULL),(11,1,1,1,'Radiografía','','pendiente','','2025-05-23 09:18:28',NULL),(12,1,1,1,'Análisis de sangre','','pendiente','','2025-05-23 09:20:36',NULL),(13,1,1,1,'Radiografía','','pendiente','','2025-05-23 09:22:22',NULL),(14,1,18,1,'Radiografía','','finalizado','aaaaaaaaaaaaaaaaaaaaaaa','2025-05-23 13:11:10','2025-05-26 08:07:00'),(15,1,6,1,'Análisis de sangre','fsdafdsdfdsf','finalizado','dsfgsdfgdfg','2025-05-23 13:23:19','2025-05-28 10:30:23'),(16,1,6,1,'TAC','','finalizado','asdasdfsadfdsaf','2025-05-28 11:08:31','2025-05-28 11:43:31'),(17,1,22,1,'Resonancia magnética','','pendiente','','2025-05-28 12:54:27',NULL),(18,1,22,1,'Electrocardiograma','','finalizado','111111111111111111111','2025-05-28 12:58:35','2025-05-28 13:18:05'),(19,1,1,1,'Ecografía','Esta es','finalizado','Ahora siiiii','2025-05-29 08:05:58','2025-05-29 08:08:06'),(20,1,26,1,'Análisis de sangre','sera esta?','finalizado','Eso espero','2025-05-29 08:29:58','2025-05-29 08:31:26');
/*!40000 ALTER TABLE `Prueba` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `Recepcion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Recepcion` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `id_usuario` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `id_usuario` (`id_usuario`),
  CONSTRAINT `Recepcion_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `Recepcion` WRITE;
/*!40000 ALTER TABLE `Recepcion` DISABLE KEYS */;
INSERT INTO `Recepcion` (`id`, `id_usuario`) VALUES (1,3);
/*!40000 ALTER TABLE `Recepcion` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `RecetaMedica`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `RecetaMedica` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `id_cita` bigint NOT NULL,
  `id_medico` bigint NOT NULL,
  `id_paciente` bigint NOT NULL,
  `descripcion` text NOT NULL,
  `fecha` datetime NOT NULL,
  `ruta` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_cita` (`id_cita`),
  KEY `id_medico` (`id_medico`),
  KEY `id_paciente` (`id_paciente`),
  CONSTRAINT `RecetaMedica_ibfk_184` FOREIGN KEY (`id_cita`) REFERENCES `Cita` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `RecetaMedica_ibfk_185` FOREIGN KEY (`id_medico`) REFERENCES `Medico` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `RecetaMedica_ibfk_186` FOREIGN KEY (`id_paciente`) REFERENCES `Paciente` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `RecetaMedica` WRITE;
/*!40000 ALTER TABLE `RecetaMedica` DISABLE KEYS */;
INSERT INTO `RecetaMedica` (`id`, `id_cita`, `id_medico`, `id_paciente`, `descripcion`, `fecha`, `ruta`) VALUES (1,1,1,1,'Paracetamol 500mg cada 8 horas por 5 das','2025-05-20 11:00:00',NULL),(2,3,1,1,'ddddddddddddddd','2025-05-19 07:58:04',NULL);
/*!40000 ALTER TABLE `RecetaMedica` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `RecetaMedicamento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `RecetaMedicamento` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `id_receta` bigint NOT NULL,
  `id_medicamento` bigint NOT NULL,
  `frecuencia` varchar(50) NOT NULL,
  `duracion` varchar(50) NOT NULL,
  `dosis` varchar(50) NOT NULL,
  `instrucciones` text,
  PRIMARY KEY (`id`),
  KEY `id_receta` (`id_receta`),
  KEY `id_medicamento` (`id_medicamento`),
  CONSTRAINT `RecetaMedicamento_ibfk_117` FOREIGN KEY (`id_receta`) REFERENCES `RecetaMedica` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `RecetaMedicamento_ibfk_118` FOREIGN KEY (`id_medicamento`) REFERENCES `Medicamento` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `RecetaMedicamento` WRITE;
/*!40000 ALTER TABLE `RecetaMedicamento` DISABLE KEYS */;
/*!40000 ALTER TABLE `RecetaMedicamento` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `Usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Usuario` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `contrasena` varchar(255) NOT NULL,
  `rol` enum('paciente','medico','recepcion') NOT NULL DEFAULT 'paciente',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `email_2` (`email`),
  UNIQUE KEY `email_3` (`email`),
  UNIQUE KEY `email_4` (`email`),
  UNIQUE KEY `email_5` (`email`),
  UNIQUE KEY `email_6` (`email`),
  UNIQUE KEY `email_7` (`email`),
  UNIQUE KEY `email_8` (`email`),
  UNIQUE KEY `email_9` (`email`),
  UNIQUE KEY `email_10` (`email`),
  UNIQUE KEY `email_11` (`email`),
  UNIQUE KEY `email_12` (`email`),
  UNIQUE KEY `email_13` (`email`),
  UNIQUE KEY `email_14` (`email`),
  UNIQUE KEY `email_15` (`email`),
  UNIQUE KEY `email_16` (`email`),
  UNIQUE KEY `email_17` (`email`),
  UNIQUE KEY `email_18` (`email`),
  UNIQUE KEY `email_19` (`email`),
  UNIQUE KEY `email_20` (`email`),
  UNIQUE KEY `email_21` (`email`),
  UNIQUE KEY `email_22` (`email`),
  UNIQUE KEY `email_23` (`email`),
  UNIQUE KEY `email_24` (`email`),
  UNIQUE KEY `email_25` (`email`),
  UNIQUE KEY `email_26` (`email`),
  UNIQUE KEY `email_27` (`email`),
  UNIQUE KEY `email_28` (`email`),
  UNIQUE KEY `email_29` (`email`),
  UNIQUE KEY `email_30` (`email`),
  UNIQUE KEY `email_31` (`email`),
  UNIQUE KEY `email_32` (`email`),
  UNIQUE KEY `email_33` (`email`),
  UNIQUE KEY `email_34` (`email`),
  UNIQUE KEY `email_35` (`email`),
  UNIQUE KEY `email_36` (`email`),
  UNIQUE KEY `email_37` (`email`),
  UNIQUE KEY `email_38` (`email`),
  UNIQUE KEY `email_39` (`email`),
  UNIQUE KEY `email_40` (`email`),
  UNIQUE KEY `email_41` (`email`),
  UNIQUE KEY `email_42` (`email`),
  UNIQUE KEY `email_43` (`email`),
  UNIQUE KEY `email_44` (`email`),
  UNIQUE KEY `email_45` (`email`),
  UNIQUE KEY `email_46` (`email`),
  UNIQUE KEY `email_47` (`email`),
  UNIQUE KEY `email_48` (`email`),
  UNIQUE KEY `email_49` (`email`),
  UNIQUE KEY `email_50` (`email`),
  UNIQUE KEY `email_51` (`email`),
  UNIQUE KEY `email_52` (`email`),
  UNIQUE KEY `email_53` (`email`),
  UNIQUE KEY `email_54` (`email`),
  UNIQUE KEY `email_55` (`email`),
  UNIQUE KEY `email_56` (`email`),
  UNIQUE KEY `email_57` (`email`),
  UNIQUE KEY `email_58` (`email`),
  UNIQUE KEY `email_59` (`email`),
  UNIQUE KEY `email_60` (`email`),
  UNIQUE KEY `email_61` (`email`),
  UNIQUE KEY `email_62` (`email`),
  UNIQUE KEY `email_63` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `Usuario` WRITE;
/*!40000 ALTER TABLE `Usuario` DISABLE KEYS */;
INSERT INTO `Usuario` (`id`, `nombre`, `email`, `contrasena`, `rol`) VALUES (1,'Juan Prez','juan.perez@example.com','$2a$10$UIaaQ9nuBiXAUcDlTdsRuud6n6iRUjIPIW.toB3eY6.1a8RboljZe','paciente'),(2,'Dra. Ana Ruiz','ana.ruiz@example.com','$2a$10$UIaaQ9nuBiXAUcDlTdsRuud6n6iRUjIPIW.toB3eY6.1a8RboljZe','medico'),(3,'Carlos Lpez','carlos.lopez@example.com','$2a$10$UIaaQ9nuBiXAUcDlTdsRuud6n6iRUjIPIW.toB3eY6.1a8RboljZe','recepcion');
/*!40000 ALTER TABLE `Usuario` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

