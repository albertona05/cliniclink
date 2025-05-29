#!/bin/bash

# Crear directorio principal si no existe
mkdir -p /home/cliniclink

# Crear directorio para archivos de pruebas médicas
mkdir -p /home/cliniclink/pruebas

# Configurar permisos
chown -R ftpuser:ftpgroup /home/cliniclink
chmod -R 755 /home/cliniclink

# Crear directorio para passwd si no existe
mkdir -p /etc/pure-ftpd/passwd

# Crear usuario FTP si no existe
if ! pure-pw show cliniclink > /dev/null 2>&1; then
  pure-pw useradd cliniclink -u 1000 -g 1000 -d /home/cliniclink -m <<EOF
cliniclink123
cliniclink123
EOF
  pure-pw mkdb /etc/pure-ftpd/pureftpd.pdb -f /etc/pure-ftpd/passwd/pureftpd.passwd
fi

# Iniciar el servidor FTP
/usr/sbin/pure-ftpd
