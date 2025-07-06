// Variáveis globais
let currentPieceId = null;

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    loadPieces();
    setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
    // Botão adicionar peça
    document.getElementById('addPieceBtn').addEventListener('click', function() {
        openPieceModal();
    });

    // Formulário de peça
    document.getElementById('pieceForm').addEventListener('submit', function(e) {
        e.preventDefault();
        savePiece();
    });

    // Fechar modais
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            closeModal();
        });
    });

    // Fechar modal clicando fora
    window.addEventListener('click', function(event) {
        const pieceModal = document.getElementById('pieceModal');
        const equipmentModal = document.getElementById('equipmentModal');
        
        if (event.target === pieceModal) {
            pieceModal.style.display = 'none';
        }
        if (event.target === equipmentModal) {
            equipmentModal.style.display = 'none';
        }
    });
}

// Carregar lista de peças
function loadPieces() {
    fetch('php/pecas_crud.php?action=list')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayPieces(data.pieces);
            } else {
                console.error('Erro ao carregar peças:', data.message);
                alert('Erro ao carregar peças: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro ao carregar peças');
        });
}

// Exibir peças na tabela
function displayPieces(pieces) {
    const tbody = document.getElementById('piecesTableBody');
    tbody.innerHTML = '';

    pieces.forEach(piece => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${piece.id_peca}</td>
            <td>${piece.nome}</td>
            <td>
                <span class="equipment-count">${piece.equipment_count || 0} equipamentos</span>
            </td>
            <td>
                <button class="btn-view" onclick="viewPieceEquipments(${piece.id_peca}, '${piece.nome}')">
                    Ver Equipamentos
                </button>
                <button class="btn-edit" onclick="editPiece(${piece.id_peca})">
                    Editar
                </button>
                <button class="btn-delete" onclick="deletePiece(${piece.id_peca})">
                    Excluir
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Abrir modal de peça
function openPieceModal(pieceData = null) {
    const modal = document.getElementById('pieceModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('pieceForm');

    if (pieceData) {
        modalTitle.textContent = 'Editar Peça';
        document.getElementById('pieceId').value = pieceData.id_peca;
        document.getElementById('pieceName').value = pieceData.nome;
        currentPieceId = pieceData.id_peca;
    } else {
        modalTitle.textContent = 'Adicionar Peça';
        form.reset();
        document.getElementById('pieceId').value = '';
        currentPieceId = null;
    }

    modal.style.display = 'block';
}

// Fechar modal
function closeModal() {
    document.getElementById('pieceModal').style.display = 'none';
    document.getElementById('equipmentModal').style.display = 'none';
}

// Salvar peça
function savePiece() {
    const formData = new FormData(document.getElementById('pieceForm'));
    const action = currentPieceId ? 'update' : 'create';
    formData.append('action', action);

    fetch('php/pecas_crud.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
            closeModal();
            loadPieces();
        } else {
            alert('Erro: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao salvar peça');
    });
}

// Editar peça
function editPiece(pieceId) {
    fetch(`php/pecas_crud.php?action=get&id=${pieceId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                openPieceModal(data.piece);
            } else {
                alert('Erro ao carregar dados da peça: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro ao carregar dados da peça');
        });
}

// Excluir peça
function deletePiece(pieceId) {
    if (confirm('Tem certeza que deseja excluir esta peça?')) {
        const formData = new FormData();
        formData.append('action', 'delete');
        formData.append('id', pieceId);

        fetch('php/pecas_crud.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
                loadPieces();
            } else {
                alert('Erro: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro ao excluir peça');
        });
    }
}

// Ver equipamentos que usam a peça
function viewPieceEquipments(pieceId, pieceName) {
    const modal = document.getElementById('equipmentModal');
    const modalTitle = document.getElementById('equipmentModalTitle');
    const equipmentList = document.getElementById('equipmentList');

    modalTitle.textContent = `Equipamentos que usam: ${pieceName}`;
    equipmentList.innerHTML = '<p>Carregando equipamentos...</p>';

    fetch(`php/pecas_crud.php?action=equipments&piece_id=${pieceId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayPieceEquipments(data.equipments);
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

// Exibir equipamentos que usam a peça
function displayPieceEquipments(equipments) {
    const equipmentList = document.getElementById('equipmentList');
    
    if (equipments.length === 0) {
        equipmentList.innerHTML = '<div class="no-equipment">Nenhum equipamento utiliza esta peça.</div>';
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
                        <strong>Cliente:</strong> ${equipment.cliente_nome}<br>
                        <strong>Técnico:</strong> ${equipment.tecnico_nome}
                    </div>
                </div>
            </div>
        `;
    });
    
    equipmentList.innerHTML = html;
}

