#!/bin/bash

# Crear directorio para archivos de pruebas médicas
mkdir -p /home/user/pruebas
chown -R ftp:ftp /home/user/pruebas
chmod -R 755 /home/user/pruebas

# Configurar permisos del directorio principal
chown -R ftp:ftp /home/user
chmod -R 755 /home/user

# Iniciar el servidor FTP
/usr/sbin/pure-ftpd