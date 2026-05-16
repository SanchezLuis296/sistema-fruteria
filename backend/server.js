const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const { conectarDB } = require('./db');

const app = express();

app.use(cors());
app.use(bodyParser.json());

conectarDB();

app.get('/', (req, res) => {
    res.send('Servidor funcionando correctamente');
});

const { sql } = require('./db');

app.post('/login', async (req, res) => {

    const { username, password } = req.body;

    try {

        const result = await sql.query`
            SELECT * FROM Usuarios
            WHERE username = ${username}
            AND password_hash = ${password}
        `;

        if (result.recordset.length > 0) {

            res.json({
                success: true,
                usuario: result.recordset[0]
            });

        } else {

            res.json({
                success: false,
                mensaje: 'Usuario o contraseña incorrectos'
            });

        }

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            mensaje: 'Error del servidor'
        });

    }

});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});