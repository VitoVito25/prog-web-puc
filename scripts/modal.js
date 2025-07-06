document.addEventListener('DOMContentLoaded', function() {
    // Aguarda o carregamento do modal
    const checkModal = setInterval(function() {
        const modal = document.getElementById('userModal');
        const modalData = document.getElementById('modalData');
        if (modal && modalData) {
            clearInterval(checkModal);

            const params = new URLSearchParams(window.location.search);
            const name = params.get('name');
            const email = params.get('email');
            const age = params.get('age');

            if (name && email && age) {
            modalData.innerHTML = `
                <p><strong>Nome:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Idade:</strong> ${age}</p>
            `;
            modal.style.display = 'flex';
            }

            // Fechar modal ao clicar nos botões ou fora do conteúdo
            function closeModal() {
            modal.style.display = 'none';
            }

            ['closeModal', 'closeModalButton'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.onclick = closeModal;
            });

            modal.onclick = function(e) {
            if (e.target === modal) closeModal();
            };
        }
    }, 100);
});