FROM stilliard/pure-ftpd

ENV FTP_USER_NAME=cliniclink \
    FTP_USER_PASS=cliniclink123 \
    FTP_USER_HOME=/home/cliniclink \
    PUBLICHOST=localhost \
    FTP_MAX_CLIENTS=50 \
    FTP_MAX_CONNECTIONS=50

# Crear script de configuración
COPY setup.sh /etc/pure-ftpd/setup.sh
RUN chmod +x /etc/pure-ftpd/setup.sh

CMD ["/etc/pure-ftpd/setup.sh"]