#!/bin/bash

# Crear directorio para archivos de pruebas médicas
mkdir -p /home/cliniclink/pruebas
chown -R root:root /home/cliniclink/pruebas
chmod -R 755 /home/cliniclink/pruebas

# Configurar permisos del directorio principal
chown -R root:root /home/cliniclink
chmod -R 755 /home/cliniclink

# Iniciar el servidor FTP
/usr/sbin/pure-ftpd