const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const { conectarDB, sql } = require('./db');

const app = express();

app.use(cors());
app.use(bodyParser.json());

// ===============================
// CONECTAR DB
// ===============================

conectarDB();

// ===============================
// RUTA PRINCIPAL
// ===============================

app.get('/', (req, res) => {

    res.send('Servidor funcionando correctamente');

});

// ===============================
// LOGIN
// ===============================

app.post('/login', async (req, res) => {

    const { username, password } = req.body;

    try {

        const result = await new sql.Request()

            .input('username', sql.VarChar, username)
            .input('password', sql.VarChar, password)

            .query(`
                SELECT *
                FROM Usuarios
                WHERE username = @username
                AND password_hash = @password
            `);

        if(result.recordset.length > 0){

            res.json({
                success: true,
                usuario: result.recordset[0]
            });

        } else {

            res.json({
                success: false,
                message: 'Usuario o contraseña incorrectos'
            });

        }

    } catch(error){

        console.log(error);

        res.status(500).json({
            success: false,
            message: 'Error del servidor'
        });

    }

});

// ===============================
// OBTENER PRODUCTOS
// ===============================

app.get('/productos', async(req, res) => {

    try {

        const result = await new sql.Request()

            .query(`
                SELECT *
                FROM Productos
                WHERE activo = 1
            `);

        res.json(result.recordset);

    } catch(error){

        console.log(error);

        res.status(500).json({
            message: 'Error obteniendo productos'
        });

    }

});

// ===============================
// AGREGAR PRODUCTO
// ===============================

app.post('/productos', async(req, res) => {

    const {
        nombre,
        codigo,
        precio,
        stock,
        tipo_venta
    } = req.body;

    try {

        await new sql.Request()

            .input('nombre', sql.VarChar, nombre)
            .input('codigo', sql.VarChar, codigo)
            .input('precio', sql.Decimal(10,2), precio)
            .input('stock', sql.Decimal(10,2), stock)
            .input('tipo_venta', sql.VarChar, tipo_venta)

            .query(`
                INSERT INTO Productos
                (
                    nombre,
                    codigo,
                    precio,
                    stock,
                    tipo_venta
                )
                VALUES
                (
                    @nombre,
                    @codigo,
                    @precio,
                    @stock,
                    @tipo_venta
                )
            `);

        res.json({
            success: true
        });

    } catch(error){

        console.log(error);

        res.status(500).json({
            message: 'Error agregando producto'
        });

    }

});

// ===============================
// EDITAR PRODUCTO
// ===============================

app.put('/productos/:id', async(req, res) => {

    const id = req.params.id;

    const {
        nombre,
        codigo,
        precio,
        stock
    } = req.body;

    try {

        await new sql.Request()

            .input('id', sql.Int, id)
            .input('nombre', sql.VarChar, nombre)
            .input('codigo', sql.VarChar, codigo)
            .input('precio', sql.Decimal(10,2), precio)
            .input('stock', sql.Decimal(10,2), stock)

            .query(`
                UPDATE Productos
                SET
                    nombre = @nombre,
                    codigo = @codigo,
                    precio = @precio,
                    stock = @stock
                WHERE id_producto = @id
            `);

        res.json({
            success: true
        });

    } catch(error){

        console.log(error);

        res.status(500).json({
            message: 'Error editando producto'
        });

    }

});

// ===============================
// ELIMINAR PRODUCTO
// ===============================

app.delete('/productos/:id', async(req, res) => {

    const id = req.params.id;

    try {

        await new sql.Request()

            .input('id', sql.Int, id)

            .query(`
                UPDATE Productos
                SET activo = 0
                WHERE id_producto = @id
            `);

        res.json({
            success: true
        });

    } catch(error){

        console.log(error);

        res.status(500).json({
            message: 'Error eliminando producto'
        });

    }

});

// ===============================
// REGISTRAR VENTA
// ===============================

app.post('/ventas', async(req, res) => {

    const { carrito } = req.body;

    try {

        for(const producto of carrito){

            await new sql.Request()

                .input(
                    'cantidad',
                    sql.Decimal(10,2),
                    producto.cantidad
                )

                .input(
                    'id',
                    sql.Int,
                    producto.id_producto
                )

                .query(`
                    UPDATE Productos
                    SET stock = stock - @cantidad
                    WHERE id_producto = @id
                `);

        }

        res.json({
            success: true
        });

    } catch(error){

        console.log(error);

        res.status(500).json({
            message: 'Error registrando venta'
        });

    }

});

// ===============================
// SERVIDOR
// ===============================

const PORT = 3000;

app.listen(PORT, () => {

    console.log(`Servidor corriendo en puerto ${PORT}`);

});