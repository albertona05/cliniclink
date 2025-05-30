#!/bin/bash

# Crear directorio principal si no existe
mkdir -p /home/cliniclink

# Crear directorio principal si no existe
mkdir -p /home/cliniclink

# Crear directorio para archivos de pruebas médicas
mkdir -p /home/cliniclink/pruebas

# Configurar permisos
chown -R ftpuser:ftpgroup /home/cliniclink
chmod -R 755 /home/cliniclink

# Crear usuario FTP
# El formato es: pure-pw useradd [nombre_usuario] -u [uid_usuario] -g [gid_grupo] -d [directorio_home] -m
pure-pw useradd ${FTP_USER_NAME} -u ftpuser -g ftpgroup -d ${FTP_USER_HOME} -m <<EOF
${FTP_USER_PASS}
${FTP_USER_PASS}
EOF

# Iniciar el servidor FTP
/usr/sbin/pure-ftpd
