const nodemailer = require('nodemailer');

// Configuración del transporte de correo
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Función para enviar correo de confirmación de cita
const enviarConfirmacionCita = async (emailPaciente, datosCita) => {
    try {
        console.log('Iniciando envío de correo de confirmación');
        console.log('Email del paciente:', emailPaciente);
        console.log('Datos de la cita:', JSON.stringify(datosCita));
        console.log('Configuración del correo:', {
            from: process.env.EMAIL_USER,
            to: emailPaciente
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: emailPaciente,
            subject: 'Confirmación de Cita Médica',
            html: `
                <h2>Confirmación de Cita Médica</h2>
                <p>Su cita ha sido programada exitosamente:</p>
                <ul>
                    <li><strong>Fecha:</strong> ${datosCita.fecha}</li>
                    <li><strong>Hora:</strong> ${datosCita.hora}</li>
                    <li><strong>Médico:</strong> ${datosCita.medico}</li>
                    <li><strong>Especialidad:</strong> ${datosCita.especialidad}</li>
                </ul>
                <p>Por favor, llegue 10 minutos antes de su cita.</p>
                <p>Si necesita cancelar o reprogramar su cita, por favor contáctenos con anticipación.</p>
            `
        };

        console.log('Intentando enviar correo...');
        const info = await transporter.sendMail(mailOptions);
        console.log('Correo enviado exitosamente:', info);
        return true;
    } catch (error) {
        console.error('Error detallado al enviar correo:', {
            message: error.message,
            stack: error.stack,
            code: error.code,
            response: error.response
        });
        return false;
    }
};

module.exports = {
    enviarConfirmacionCita
};