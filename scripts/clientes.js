// Variáveis globais
let currentClientId = null;

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    loadClients();
    setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
    // Botão adicionar cliente
    document.getElementById('addClientBtn').addEventListener('click', function() {
        openClientModal();
    });

    // Formulário de cliente
    document.getElementById('clientForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveClient();
    });

    // Fechar modais
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            closeModal();
        });
    });

    // Fechar modal clicando fora
    window.addEventListener('click', function(event) {
        const clientModal = document.getElementById('clientModal');
        const equipmentModal = document.getElementById('equipmentModal');
        
        if (event.target === clientModal) {
            clientModal.style.display = 'none';
        }
        if (event.target === equipmentModal) {
            equipmentModal.style.display = 'none';
        }
    });
}

// Carregar lista de clientes
function loadClients() {
    fetch('php/clientes_crud.php?action=list')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayClients(data.clients);
            } else {
                console.error('Erro ao carregar clientes:', data.message);
                alert('Erro ao carregar clientes: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro ao carregar clientes');
        });
}

// Exibir clientes na tabela
function displayClients(clients) {
    const tbody = document.getElementById('clientsTableBody');
    tbody.innerHTML = '';

    clients.forEach(client => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${client.id_cliente}</td>
            <td>${client.nome}</td>
            <td>${client.telefone || 'N/A'}</td>
            <td>
                <button class="btn-view" onclick="viewClientEquipments(${client.id_cliente}, '${client.nome}')">
                    Ver Equipamentos
                </button>
                <button class="btn-edit" onclick="editClient(${client.id_cliente})">
                    Editar
                </button>
                <button class="btn-delete" onclick="deleteClient(${client.id_cliente})">
                    Excluir
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Abrir modal de cliente
function openClientModal(clientData = null) {
    const modal = document.getElementById('clientModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('clientForm');

    if (clientData) {
        modalTitle.textContent = 'Editar Cliente';
        document.getElementById('clientId').value = clientData.id_cliente;
        document.getElementById('clientName').value = clientData.nome;
        document.getElementById('clientPhone').value = clientData.telefone || '';
        currentClientId = clientData.id_cliente;
    } else {
        modalTitle.textContent = 'Adicionar Cliente';
        form.reset();
        document.getElementById('clientId').value = '';
        currentClientId = null;
    }

    modal.style.display = 'block';
}

// Fechar modal
function closeModal() {
    document.getElementById('clientModal').style.display = 'none';
    document.getElementById('equipmentModal').style.display = 'none';
}

// Salvar cliente
function saveClient() {
    const formData = new FormData(document.getElementById('clientForm'));
    const action = currentClientId ? 'update' : 'create';
    formData.append('action', action);

    fetch('php/clientes_crud.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
            closeModal();
            loadClients();
        } else {
            alert('Erro: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao salvar cliente');
    });
}

// Editar cliente
function editClient(clientId) {
    fetch(`php/clientes_crud.php?action=get&id=${clientId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                openClientModal(data.client);
            } else {
                alert('Erro ao carregar dados do cliente: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro ao carregar dados do cliente');
        });
}

// Excluir cliente
function deleteClient(clientId) {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
        const formData = new FormData();
        formData.append('action', 'delete');
        formData.append('id', clientId);

        fetch('php/clientes_crud.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
                loadClients();
            } else {
                alert('Erro: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro ao excluir cliente');
        });
    }
}

// Ver equipamentos do cliente
function viewClientEquipments(clientId, clientName) {
    const modal = document.getElementById('equipmentModal');
    const modalTitle = document.getElementById('equipmentModalTitle');
    const equipmentList = document.getElementById('equipmentList');

    modalTitle.textContent = `Equipamentos de ${clientName}`;
    equipmentList.innerHTML = '<p>Carregando equipamentos...</p>';

    fetch(`php/clientes_crud.php?action=equipments&client_id=${clientId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayClientEquipments(data.equipments);
            } else {
                equipmentList.innerHTML = '<p>Erro ao carregar equipamentos: ' + data.message + '</p>';
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            equipmentList.innerHTML = '<p>Erro ao carregar equipamentos</p>';
        });

    modal.style.display = 'block';
}

// Exibir equipamentos do cliente
function displayClientEquipments(equipments) {
    const equipmentList = document.getElementById('equipmentList');
    
    if (equipments.length === 0) {
        equipmentList.innerHTML = '<p>Este cliente não possui equipamentos cadastrados.</p>';
        return;
    }

    let html = '';
    equipments.forEach(equipment => {
        const imageSrc = equipment.imagem ? 
            `data:image/jpeg;base64,${equipment.imagem}` : 
            'img/no-image.png';
            
        html += `
            <div class="equipment-item">
                <img src="${imageSrc}" alt="${equipment.nome}" class="equipment-image" 
                     onerror="this.src='img/no-image.png'">
                <div class="equipment-info">
                    <div class="equipment-name">${equipment.nome}</div>
                    <div class="equipment-details">
                        <strong>Tipo:</strong> ${equipment.tipo}<br>
                        <strong>Serial:</strong> ${equipment.serial}<br>
                        <strong>Técnico:</strong> ${equipment.tecnico_nome}
                    </div>
                </div>
            </div>
        `;
    });
    
    equipmentList.innerHTML = html;
}

