document.addEventListener('DOMContentLoaded', function() {
    fetch('elements/sidebar.html')
        .then(res => res.text())
        .then(html => {
            document.getElementById('sidebar').innerHTML = html;
            // Após inserir a sidebar, define o link ativo
            const links = document.querySelectorAll('.sidebar a');
            let algumAtivo = false;
            links.forEach(link => {
                if (window.location.pathname.endsWith(link.getAttribute('href'))) {
                    link.classList.add('active');
                    algumAtivo = true;
                } else {
                    link.classList.remove('active');
                }
            });
            // Se nenhum ficou ativo, ativa o primeiro (Home)
            if (!algumAtivo && links.length > 0) {
                links[0].classList.add('active');
            }
        });
});