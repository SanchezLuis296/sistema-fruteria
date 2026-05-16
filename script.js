function go(page) {
    window.location.href = page;
}

// LOGIN REAL
async function login() {

    const username = document.getElementById('username').value;

    const password = document.getElementById('password').value;

    try {

        const response = await fetch('http://localhost:3000/login', {

            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({
                username,
                password
            })

        });

        const data = await response.json();

        if (data.success) {

            alert('Bienvenido ' + data.usuario.nombre);

            window.location.href = 'menu.html';

        } else {

            alert(data.mensaje);

        }

    } catch (error) {

        console.log(error);

        alert('Error al conectar con el servidor');

    }

}