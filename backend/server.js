const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const { conectarDB, sql } = require('./db');

const app = express();

app.use(cors());
app.use(bodyParser.json());

// ======================================
// CONECTAR BASE DE DATOS
// ======================================

conectarDB();

// ======================================
// RUTA PRINCIPAL
// ======================================

app.get('/', (req, res) => {

    res.send('Servidor funcionando correctamente');

});

// ======================================
// LOGIN
// ======================================

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

// ======================================
// OBTENER PRODUCTOS
// ======================================

app.get('/productos', async(req, res) => {

    try {

        const result = await new sql.Request()

            .query(`
                SELECT *
                FROM Productos
                WHERE activo = 1
                ORDER BY nombre
            `);

        res.json(result.recordset);

    } catch(error){

        console.log(error);

        res.status(500).json({
            message: 'Error obteniendo productos'
        });

    }

});

// ======================================
// AGREGAR PRODUCTO
// ======================================

app.post('/productos', async(req, res) => {

    const {
        nombre,
        codigo,
        precio,
        stock,
        tipo_venta
    } = req.body;

    try {

    const existente = await new sql.Request()

        .input('codigo', sql.VarChar, codigo)

        .query(`
            SELECT *
            FROM Productos
            WHERE codigo = @codigo
        `);

    if(existente.recordset.length > 0){

        await new sql.Request()

            .input('codigo', sql.VarChar, codigo)

            .input('nombre', sql.VarChar, nombre)

            .input('precio', sql.Decimal(10,2), precio)

            .input('stock', sql.Decimal(10,2), stock)

            .input('tipo_venta', sql.VarChar, tipo_venta)

            .query(`
                UPDATE Productos
                SET
                    nombre = @nombre,
                    precio = @precio,
                    stock = @stock,
                    tipo_venta = @tipo_venta,
                    activo = 1
                WHERE codigo = @codigo
            `);

        return res.json({
            success:true
        });

    }

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
        success:true
    });

} catch(error){

        console.log(error);

        res.status(500).json({
            message: 'Error agregando producto'
        });

    }

});

// ======================================
// EDITAR PRODUCTO
// ======================================

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

// ======================================
// ELIMINAR PRODUCTO
// ======================================

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

// ======================================
// REGISTRAR VENTA
// ======================================

app.post('/ventas', async(req, res) => {

    const { carrito } = req.body;

    const metodo_pago = "Efectivo";

    const id_usuario = 1;

    try {

        let total = 0;

        carrito.forEach(producto => {

            total += (
                producto.precio *
                producto.cantidad
            );

        });

        // ==================================
        // CREAR VENTA
        // ==================================

        const ventaResult = await new sql.Request()

            .input(
                'id_usuario',
                sql.Int,
                id_usuario
            )

            .input(
                'metodo_pago',
                sql.VarChar,
                metodo_pago
            )

            .input(
                'total',
                sql.Decimal(10,2),
                total
            )

            .query(`
                INSERT INTO Ventas
                (
                    id_usuario,
                    metodo_pago,
                    total
                )

                OUTPUT INSERTED.id_venta

                VALUES
                (
                    @id_usuario,
                    @metodo_pago,
                    @total
                )
            `);

        const id_venta =
            ventaResult.recordset[0].id_venta;

        // ==================================
        // RECORRER CARRITO
        // ==================================

        for(const producto of carrito){

            const subtotal =
                producto.precio *
                producto.cantidad;

            // ===============================
            // INSERTAR DETALLE
            // ===============================

            await new sql.Request()

                .input(
                    'id_venta',
                    sql.Int,
                    id_venta
                )

                .input(
                    'id_producto',
                    sql.Int,
                    producto.id_producto
                )

                .input(
                    'cantidad',
                    sql.Decimal(10,2),
                    producto.cantidad
                )

                .input(
                    'precio_unitario',
                    sql.Decimal(10,2),
                    producto.precio
                )

                .input(
                    'subtotal',
                    sql.Decimal(10,2),
                    subtotal
                )

                .query(`
                    INSERT INTO Detalle_Venta
                    (
                        id_venta,
                        id_producto,
                        cantidad,
                        precio_unitario,
                        subtotal
                    )
                    VALUES
                    (
                        @id_venta,
                        @id_producto,
                        @cantidad,
                        @precio_unitario,
                        @subtotal
                    )
                `);

            // ===============================
            // DESCONTAR STOCK
            // ===============================

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

            // ===============================
            // MOVIMIENTO INVENTARIO
            // ===============================

            await new sql.Request()

                .input(
                    'id_producto',
                    sql.Int,
                    producto.id_producto
                )

                .input(
                    'cantidad',
                    sql.Decimal(10,2),
                    producto.cantidad
                )

                .query(`
                    INSERT INTO Movimientos_Inventario
                    (
                        id_producto,
                        tipo,
                        cantidad
                    )
                    VALUES
                    (
                        @id_producto,
                        'Salida',
                        @cantidad
                    )
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

// ======================================
// MOVIMIENTO INVENTARIO
// ======================================

app.post('/inventario', async(req, res) => {

    const {
        id_producto,
        tipo,
        cantidad
    } = req.body;

    try {

        // ==================================
        // VALIDAR PRODUCTO
        // ==================================

        const producto = await new sql.Request()

            .input(
                'id_producto',
                sql.Int,
                id_producto
            )

            .query(`
                SELECT *
                FROM Productos
                WHERE id_producto = @id_producto
            `);

        if(producto.recordset.length === 0){

            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });

        }

        // ==================================
        // REGISTRAR MOVIMIENTO
        // ==================================

        await new sql.Request()

            .input(
                'id_producto',
                sql.Int,
                id_producto
            )

            .input(
                'tipo',
                sql.VarChar,
                tipo
            )

            .input(
                'cantidad',
                sql.Decimal(10,2),
                cantidad
            )

            .query(`
                INSERT INTO Movimientos_Inventario
                (
                    id_producto,
                    tipo,
                    cantidad
                )
                VALUES
                (
                    @id_producto,
                    @tipo,
                    @cantidad
                )
            `);

        // ==================================
        // ENTRADA
        // ==================================

        if(tipo === 'Entrada'){

            await new sql.Request()

                .input(
                    'id_producto',
                    sql.Int,
                    id_producto
                )

                .input(
                    'cantidad',
                    sql.Decimal(10,2),
                    cantidad
                )

                .query(`
                    UPDATE Productos
                    SET stock = stock + @cantidad
                    WHERE id_producto = @id_producto
                `);

        }

        // ==================================
        // SALIDA O MERMA
        // ==================================

        if(
            tipo === 'Salida' ||
            tipo === 'Merma'
        ){

            await new sql.Request()

                .input(
                    'id_producto',
                    sql.Int,
                    id_producto
                )

                .input(
                    'cantidad',
                    sql.Decimal(10,2),
                    cantidad
                )

                .query(`
                    UPDATE Productos
                    SET stock = stock - @cantidad
                    WHERE id_producto = @id_producto
                `);

        }

        res.json({
            success: true
        });

    } catch(error){

        console.log(error);

        res.status(500).json({
            message: 'Error inventario'
        });

    }

});

// ======================================
// REPORTE VENTAS
// ======================================

app.get('/reportes/ventas', async(req, res) => {

    const {
        fechaInicio,
        fechaFin
    } = req.query;

    try {

        const result = await new sql.Request()

            .input(
                'fechaInicio',
                sql.VarChar,
                fechaInicio
            )

            .input(
                'fechaFin',
                sql.VarChar,
                fechaFin
            )

            .query(`
                SELECT *
                FROM Ventas
                WHERE CONVERT(date, fecha)
                BETWEEN CONVERT(date, @fechaInicio)
                AND CONVERT(date, @fechaFin)
                ORDER BY fecha DESC
            `);

        res.json(result.recordset);

    } catch(error){

        console.log(error);

        res.status(500).json({
            message: 'Error reporte ventas'
        });

    }

});

// ======================================
// REPORTE INVENTARIO
// ======================================

app.get('/reportes/inventario', async(req, res) => {

    try {

        const result = await new sql.Request()

            .query(`
                SELECT
                    nombre,
                    stock
                FROM Productos
                WHERE activo = 1
                ORDER BY stock ASC
            `);

        res.json(result.recordset);

    } catch(error){

        console.log(error);

        res.status(500).json({
            message: 'Error reporte inventario'
        });

    }

});

// ======================================
// SERVIDOR
// ======================================

const PORT = 3000;

app.listen(PORT, () => {

    console.log(
        `Servidor corriendo en puerto ${PORT}`
    );

});