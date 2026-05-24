function go(page){
    window.location.href = page;
}

function logout(){
    localStorage.removeItem("usuario");
    window.location.href = "login.html";
}