#!/bin/bash

# Crear usuario del sistema si no existe
adduser --disabled-password --gecos "" cliniclink || echo "Usuario ya existe"

# Crear directorio para archivos de pruebas médicas
mkdir -p /home/cliniclink/pruebas
chown -R cliniclink:cliniclink /home/cliniclink/pruebas
chmod -R 755 /home/cliniclink/pruebas

# Configurar permisos del directorio principal
chown -R cliniclink:cliniclink /home/cliniclink
chmod -R 755 /home/cliniclink

# Crear usuario FTP si no existe
if ! pure-pw show cliniclink > /dev/null 2>&1; then
  pure-pw useradd cliniclink -u $(id -u cliniclink) -g $(id -g cliniclink) -d /home/cliniclink -m <<EOF
cliniclink123
cliniclink123
EOF
  pure-pw mkdb /etc/pure-ftpd/pureftpd.pdb -f /etc/pure-ftpd/pureftpd.passwd
fi

# Configurar el modo pasivo para FTP
echo "30000 30009" > /etc/pure-ftpd/conf/PassivePortRange

# Configurar la IP pública para conexiones pasivas
# Usar la IP del host para conexiones externas
echo "127.0.0.1" > /etc/pure-ftpd/conf/ForcePassiveIP

# Iniciar el servidor FTP con autenticación por archivo de contraseñas
# -E: Habilitar modo EPSV
# -j: Habilitar autenticación por archivo de contraseñas
# -R: No permitir anónimos
# -p: Rango de puertos pasivos
/usr/sbin/pure-ftpd -l puredb:/etc/pure-ftpd/pureftpd.pdb -E -j -R -p 30000:30009