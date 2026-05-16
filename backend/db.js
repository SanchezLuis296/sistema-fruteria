const sql = require('mssql');

const config = {

    user: 'fruteria_user',

    password: 'Fruteria123!',

    server: 'LAPTOP-MF30DBV8',

    database: 'Fruteria',

    options: {
        trustServerCertificate: true,
        instanceName: 'SQLFERNANDO'
    }

};

async function conectarDB() {

    try {

        await sql.connect(config);

        console.log('Conectado a SQL Server');

    } catch (error) {

        console.log('Error de conexión:', error);

    }

}

module.exports = {
    sql,
    conectarDB
};