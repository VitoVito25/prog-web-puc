// Variáveis globais
let currentEquipmentId = null;
let clients = [];
let technicians = [];
let pieces = [];

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    loadEquipments();
    loadClients();
    loadTechnicians();
    loadPieces();
    setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
    // Botão adicionar equipamento
    document.getElementById('addEquipmentBtn').addEventListener('click', function() {
        openEquipmentModal();
    });

    // Formulário de equipamento
    document.getElementById('equipmentForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveEquipment();
    });

    // Preview de imagem
    document.getElementById('equipmentImage').addEventListener('change', function(e) {
        previewImage(e.target.files[0]);
    });

    // Fechar modais
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            closeModal();
            closeViewModal();
        });
    });

    // Fechar modal clicando fora
    window.addEventListener('click', function(event) {
        const equipmentModal = document.getElementById('equipmentModal');
        const viewModal = document.getElementById('viewModal');
        
        if (event.target === equipmentModal) {
            equipmentModal.style.display = 'none';
        }
        if (event.target === viewModal) {
            viewModal.style.display = 'none';
        }
    });
}

// Carregar lista de equipamentos
function loadEquipments() {
    fetch('php/equipamentos_crud.php?action=list')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayEquipments(data.equipments);
            } else {
                console.error('Erro ao carregar equipamentos:', data.message);
                alert('Erro ao carregar equipamentos: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro ao carregar equipamentos');
        });
}

// Carregar clientes
function loadClients() {
    fetch('php/clientes_crud.php?action=list')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                clients = data.clients;
                populateClientSelect();
            }
        })
        .catch(error => {
            console.error('Erro ao carregar clientes:', error);
        });
}

// Carregar técnicos
function loadTechnicians() {
    fetch('php/equipamentos_crud.php?action=technicians')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                technicians = data.technicians;
                populateTechnicianSelect();
            }
        })
        .catch(error => {
            console.error('Erro ao carregar técnicos:', error);
        });
}

// Carregar peças
function loadPieces() {
    fetch('php/pecas_crud.php?action=list')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                pieces = data.pieces;
                populatePiecesContainer();
            }
        })
        .catch(error => {
            console.error('Erro ao carregar peças:', error);
        });
}

// Exibir equipamentos em cards
function displayEquipments(equipments) {
    const grid = document.getElementById('equipmentGrid');
    grid.innerHTML = '';

    equipments.forEach(equipment => {
        const imageSrc = equipment.imagem ? 
            `data:image/jpeg;base64,${equipment.imagem}` : 
            'img/no-image.png';

        const card = document.createElement('div');
        card.className = 'equipment-card';
        card.innerHTML = `
            <img src="${imageSrc}" alt="${equipment.nome}" class="equipment-image" 
                 onerror="this.src='img/no-image.png'">
            <div class="equipment-info">
                <div class="equipment-name">${equipment.nome}</div>
                <div class="equipment-type">${equipment.tipo}</div>
                <div class="equipment-serial">Serial: ${equipment.serial}</div>
                <div class="equipment-client">Cliente: ${equipment.cliente_nome}</div>
                <div class="equipment-actions">
                    <button class="btn-edit" onclick="editEquipment(${equipment.id_equipamento})">
                        Editar
                    </button>
                    <button class="btn-delete" onclick="deleteEquipment(${equipment.id_equipamento})">
                        Excluir
                    </button>
                </div>
            </div>
        `;

        // Adicionar evento de clique no card para visualizar detalhes
        card.addEventListener('click', function(e) {
            // Não abrir detalhes se clicou em um botão
            if (!e.target.classList.contains('btn-edit') && !e.target.classList.contains('btn-delete')) {
                viewEquipmentDetails(equipment.id_equipamento);
            }
        });

        grid.appendChild(card);
    });
}

// Popular select de clientes
function populateClientSelect() {
    const select = document.getElementById('equipmentClient');
    select.innerHTML = '<option value="">Selecione o cliente</option>';
    
    clients.forEach(client => {
        const option = document.createElement('option');
        option.value = client.id_cliente;
        option.textContent = client.nome;
        select.appendChild(option);
    });
}

// Popular select de técnicos
function populateTechnicianSelect() {
    const select = document.getElementById('equipmentTechnician');
    select.innerHTML = '<option value="">Selecione o técnico</option>';
    
    technicians.forEach(technician => {
        const option = document.createElement('option');
        option.value = technician.id_tecnico;
        option.textContent = technician.nome;
        select.appendChild(option);
    });
}

// Popular container de peças
function populatePiecesContainer() {
    const container = document.getElementById('piecesContainer');
    container.innerHTML = '';
    
    pieces.forEach(piece => {
        const div = document.createElement('div');
        div.className = 'piece-checkbox';
        div.innerHTML = `
            <input type="checkbox" id="piece_${piece.id_peca}" name="pieces[]" value="${piece.id_peca}">
            <label for="piece_${piece.id_peca}">${piece.nome}</label>
        `;
        container.appendChild(div);
    });
}

// Preview de imagem
function previewImage(file) {
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = '';
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            preview.appendChild(img);
        };
        reader.readAsDataURL(file);
    }
}

// Abrir modal de equipamento
function openEquipmentModal(equipmentData = null) {
    const modal = document.getElementById('equipmentModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('equipmentForm');

    if (equipmentData) {
        modalTitle.textContent = 'Editar Equipamento';
        populateForm(equipmentData);
        currentEquipmentId = equipmentData.id_equipamento;
    } else {
        modalTitle.textContent = 'Adicionar Equipamento';
        form.reset();
        document.getElementById('equipmentId').value = '';
        document.getElementById('imagePreview').innerHTML = '';
        currentEquipmentId = null;
        // Desmarcar todas as peças
        document.querySelectorAll('input[name="pieces[]"]').forEach(checkbox => {
            checkbox.checked = false;
        });
    }

    modal.style.display = 'block';
}

// Popular formulário com dados do equipamento
function populateForm(equipment) {
    document.getElementById('equipmentId').value = equipment.id_equipamento;
    document.getElementById('equipmentName').value = equipment.nome;
    document.getElementById('equipmentType').value = equipment.tipo;
    document.getElementById('equipmentSerial').value = equipment.serial;
    document.getElementById('equipmentClient').value = equipment.id_cliente;
    document.getElementById('equipmentTechnician').value = equipment.id_tecnico;
    
    // Preview da imagem atual
    if (equipment.imagem) {
        const preview = document.getElementById('imagePreview');
        preview.innerHTML = `<img src="data:image/jpeg;base64,${equipment.imagem}" alt="Preview">`;
    }
    
    // Marcar peças selecionadas
    document.querySelectorAll('input[name="pieces[]"]').forEach(checkbox => {
        checkbox.checked = equipment.pieces && equipment.pieces.includes(parseInt(checkbox.value));
    });
}

// Fechar modal
function closeModal() {
    document.getElementById('equipmentModal').style.display = 'none';
}

// Fechar modal de visualização
function closeViewModal() {
    document.getElementById('viewModal').style.display = 'none';
}

// Salvar equipamento
function saveEquipment() {
    const formData = new FormData(document.getElementById('equipmentForm'));
    const action = currentEquipmentId ? 'update' : 'create';
    formData.append('action', action);

    // Adicionar peças selecionadas
    const selectedPieces = [];
    document.querySelectorAll('input[name="pieces[]"]:checked').forEach(checkbox => {
        selectedPieces.push(checkbox.value);
    });
    formData.append('selected_pieces', JSON.stringify(selectedPieces));

    fetch('php/equipamentos_crud.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
            closeModal();
            loadEquipments();
        } else {
            alert('Erro: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao salvar equipamento');
    });
}

// Editar equipamento
function editEquipment(equipmentId) {
    fetch(`php/equipamentos_crud.php?action=get&id=${equipmentId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                openEquipmentModal(data.equipment);
            } else {
                alert('Erro ao carregar dados do equipamento: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro ao carregar dados do equipamento');
        });
}

// Excluir equipamento
function deleteEquipment(equipmentId) {
    if (confirm('Tem certeza que deseja excluir este equipamento?')) {
        const formData = new FormData();
        formData.append('action', 'delete');
        formData.append('id', equipmentId);

        fetch('php/equipamentos_crud.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
                loadEquipments();
            } else {
                alert('Erro: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro ao excluir equipamento');
        });
    }
}

// Visualizar detalhes do equipamento
function viewEquipmentDetails(equipmentId) {
    fetch(`php/equipamentos_crud.php?action=get&id=${equipmentId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayEquipmentDetails(data.equipment);
            } else {
                alert('Erro ao carregar detalhes do equipamento: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro ao carregar detalhes do equipamento');
        });
}

// Exibir detalhes do equipamento
function displayEquipmentDetails(equipment) {
    const modal = document.getElementById('viewModal');
    const modalTitle = document.getElementById('viewModalTitle');
    const detailsContainer = document.getElementById('equipmentDetails');

    modalTitle.textContent = `Detalhes: ${equipment.nome}`;

    const imageSrc = equipment.imagem ? 
        `data:image/jpeg;base64,${equipment.imagem}` : 
        'img/no-image.png';

    const piecesHtml = equipment.pieces_names && equipment.pieces_names.length > 0 ?
        equipment.pieces_names.map(piece => `<span class="piece-tag">${piece}</span>`).join('') :
        '<span class="piece-tag">Nenhuma peça</span>';

    detailsContainer.innerHTML = `
        <div class="equipment-details">
            <div>
                <img src="${imageSrc}" alt="${equipment.nome}" class="detail-image" 
                     onerror="this.src='img/no-image.png'">
            </div>
            <div class="detail-info">
                <div class="detail-item">
                    <div class="detail-label">Nome:</div>
                    <div class="detail-value">${equipment.nome}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Tipo:</div>
                    <div class="detail-value">${equipment.tipo}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Serial:</div>
                    <div class="detail-value">${equipment.serial}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Cliente:</div>
                    <div class="detail-value">${equipment.cliente_nome}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Técnico:</div>
                    <div class="detail-value">${equipment.tecnico_nome}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Peças:</div>
                    <div class="detail-value pieces-list">${piecesHtml}</div>
                </div>
            </div>
        </div>
    `;

    modal.style.display = 'block';
}

