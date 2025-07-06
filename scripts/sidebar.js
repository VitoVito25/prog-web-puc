document.addEventListener("DOMContentLoaded", function() {
    fetch("elements/sidebar.html")
        .then(res => res.text())
        .then(html => {
            document.getElementById("sidebar").innerHTML = html;
            // Após inserir a sidebar, define o link ativo
            const links = document.querySelectorAll(".sidebar a");
            let algumAtivo = false;
            links.forEach(link => {
                if (window.location.pathname.endsWith(link.getAttribute("href"))) {
                    link.classList.add("active");
                    algumAtivo = true;
                } else {
                    link.classList.remove("active");
                }
            });
            // Se nenhum ficou ativo, ativa o primeiro (Principal)
            if (!algumAtivo && links.length > 0) {
                links[0].classList.add("active");
            }
            // Chamar a função de verificação de login APÓS a sidebar ser carregada
            if (typeof checkLoginStatus === "function") {
                checkLoginStatus();
            }
        });
});

// Função para verificar se o usuário está logado
function checkLoginStatus() {
    fetch("php/check_session.php")
        .then(response => response.json())
        .then(data => {
            if (data.loggedin) {
                document.getElementById("guest-menu").style.display = "none";
                document.getElementById("user-menu").style.display = "block";
                document.getElementById("user-info").style.display = "block";
                document.getElementById("username-display").textContent = data.username;
            } else {
                document.getElementById("guest-menu").style.display = "block";
                document.getElementById("user-menu").style.display = "none";
                document.getElementById("user-info").style.display = "none";
            }
        })
        .catch(error => {
            console.error("Erro ao verificar sessão:", error);
        });
}

// Função de logout
function logout() {
    fetch("php/logout.php")
        .then(response => response.text())
        .then(data => {
            alert("Logout realizado com sucesso!");
            window.location.href = "index.html";
        })
        .catch(error => {
            console.error("Erro ao fazer logout:", error);
        });
}


