<?php
header('Content-Type: application/json');
include '../conectaBD.php';

// Criar conexão
$conn = new mysqli($servername, $username, $password, $dbname);

// Verificar conexão
if ($conn->connect_error) {
    die(json_encode(['success' => false, 'message' => 'Falha na conexão: ' . $conn->connect_error]));
}

// Definir charset
$conn->set_charset("utf8");

$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {
    case 'list':
        listEquipments($conn);
        break;
    case 'get':
        getEquipment($conn);
        break;
    case 'create':
        createEquipment($conn);
        break;
    case 'update':
        updateEquipment($conn);
        break;
    case 'delete':
        deleteEquipment($conn);
        break;
    case 'technicians':
        getTechnicians($conn);
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'Ação não especificada']);
}

$conn->close();

function listEquipments($conn) {
    $sql = "SELECT e.id_equipamento, e.nome, e.tipo, e.serial, e.imagem, 
                   c.nome as cliente_nome, t.nome as tecnico_nome 
            FROM equipamento e 
            LEFT JOIN cliente c ON e.id_cliente = c.id_cliente 
            LEFT JOIN tecnico t ON e.id_tecnico = t.id_tecnico 
            ORDER BY e.nome";
    
    $result = $conn->query($sql);
    
    if ($result) {
        $equipments = [];
        while ($row = $result->fetch_assoc()) {
            // Converter imagem BLOB para base64 se existir
            if ($row['imagem']) {
                $row['imagem'] = base64_encode($row['imagem']);
            }
            $equipments[] = $row;
        }
        echo json_encode(['success' => true, 'equipments' => $equipments]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Erro ao buscar equipamentos: ' . $conn->error]);
    }
}

function getEquipment($conn) {
    $id = $_GET['id'] ?? 0;
    
    if (!$id) {
        echo json_encode(['success' => false, 'message' => 'ID do equipamento não fornecido']);
        return;
    }
    
    $sql = "SELECT e.id_equipamento, e.nome, e.tipo, e.serial, e.imagem, e.id_cliente, e.id_tecnico,
                   c.nome as cliente_nome, t.nome as tecnico_nome 
            FROM equipamento e 
            LEFT JOIN cliente c ON e.id_cliente = c.id_cliente 
            LEFT JOIN tecnico t ON e.id_tecnico = t.id_tecnico 
            WHERE e.id_equipamento = ?";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result && $row = $result->fetch_assoc()) {
        // Converter imagem BLOB para base64 se existir
        if ($row['imagem']) {
            $row['imagem'] = base64_encode($row['imagem']);
        }
        
        // Buscar peças do equipamento
        $piecesSql = "SELECT ep.id_peca, tp.nome 
                      FROM equipamento_peca ep 
                      INNER JOIN tipo_pecas tp ON ep.id_peca = tp.id_peca 
                      WHERE ep.id_equipamento = ?";
        
        $piecesStmt = $conn->prepare($piecesSql);
        $piecesStmt->bind_param("i", $id);
        $piecesStmt->execute();
        $piecesResult = $piecesStmt->get_result();
        
        $pieces = [];
        $pieces_names = [];
        while ($pieceRow = $piecesResult->fetch_assoc()) {
            $pieces[] = $pieceRow['id_peca'];
            $pieces_names[] = $pieceRow['nome'];
        }
        
        $row['pieces'] = $pieces;
        $row['pieces_names'] = $pieces_names;
        
        $piecesStmt->close();
        
        echo json_encode(['success' => true, 'equipment' => $row]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Equipamento não encontrado']);
    }
    
    $stmt->close();
}

function createEquipment($conn) {
    $nome = $_POST['nome'] ?? '';
    $tipo = $_POST['tipo'] ?? '';
    $serial = $_POST['serial'] ?? '';
    $id_cliente = $_POST['id_cliente'] ?? 0;
    $id_tecnico = $_POST['id_tecnico'] ?? 0;
    $selected_pieces = json_decode($_POST['selected_pieces'] ?? '[]', true);
    
    if (empty($nome) || empty($tipo) || empty($serial) || !$id_cliente || !$id_tecnico) {
        echo json_encode(['success' => false, 'message' => 'Todos os campos obrigatórios devem ser preenchidos']);
        return;
    }
    
    // Verificar se o serial já existe
    $checkSql = "SELECT COUNT(*) as count FROM equipamento WHERE serial = ?";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bind_param("s", $serial);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    $checkRow = $checkResult->fetch_assoc();
    
    if ($checkRow['count'] > 0) {
        echo json_encode(['success' => false, 'message' => 'Já existe um equipamento com este serial']);
        $checkStmt->close();
        return;
    }
    
    $checkStmt->close();
    
    // Processar imagem se enviada
    $imagem = null;
    if (isset($_FILES['imagem']) && $_FILES['imagem']['error'] === UPLOAD_ERR_OK) {
        $imagem = file_get_contents($_FILES['imagem']['tmp_name']);
    }
    
    // Iniciar transação
    $conn->begin_transaction();
    
    try {
        // Inserir equipamento
        $sql = "INSERT INTO equipamento (nome, tipo, serial, id_tecnico, id_cliente, imagem) VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sssiis", $nome, $tipo, $serial, $id_tecnico, $id_cliente, $imagem);
        
        if (!$stmt->execute()) {
            throw new Exception('Erro ao criar equipamento: ' . $conn->error);
        }
        
        $equipmentId = $conn->insert_id;
        $stmt->close();
        
        // Inserir peças do equipamento
        if (!empty($selected_pieces)) {
            $piecesSql = "INSERT INTO equipamento_peca (id_equipamento, id_peca) VALUES (?, ?)";
            $piecesStmt = $conn->prepare($piecesSql);
            
            foreach ($selected_pieces as $pieceId) {
                $piecesStmt->bind_param("ii", $equipmentId, $pieceId);
                if (!$piecesStmt->execute()) {
                    throw new Exception('Erro ao associar peças: ' . $conn->error);
                }
            }
            
            $piecesStmt->close();
        }
        
        $conn->commit();
        echo json_encode(['success' => true, 'message' => 'Equipamento criado com sucesso']);
        
    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

function updateEquipment($conn) {
    $id = $_POST['id'] ?? 0;
    $nome = $_POST['nome'] ?? '';
    $tipo = $_POST['tipo'] ?? '';
    $serial = $_POST['serial'] ?? '';
    $id_cliente = $_POST['id_cliente'] ?? 0;
    $id_tecnico = $_POST['id_tecnico'] ?? 0;
    $selected_pieces = json_decode($_POST['selected_pieces'] ?? '[]', true);
    
    if (!$id || empty($nome) || empty($tipo) || empty($serial) || !$id_cliente || !$id_tecnico) {
        echo json_encode(['success' => false, 'message' => 'Todos os campos obrigatórios devem ser preenchidos']);
        return;
    }
    
    // Verificar se o serial já existe em outro equipamento
    $checkSql = "SELECT COUNT(*) as count FROM equipamento WHERE serial = ? AND id_equipamento != ?";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bind_param("si", $serial, $id);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    $checkRow = $checkResult->fetch_assoc();
    
    if ($checkRow['count'] > 0) {
        echo json_encode(['success' => false, 'message' => 'Já existe outro equipamento com este serial']);
        $checkStmt->close();
        return;
    }
    
    $checkStmt->close();
    
    // Iniciar transação
    $conn->begin_transaction();
    
    try {
        // Atualizar equipamento
        if (isset($_FILES['imagem']) && $_FILES['imagem']['error'] === UPLOAD_ERR_OK) {
            // Nova imagem enviada
            $imagem = file_get_contents($_FILES['imagem']['tmp_name']);
            $sql = "UPDATE equipamento SET nome = ?, tipo = ?, serial = ?, id_tecnico = ?, id_cliente = ?, imagem = ? WHERE id_equipamento = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("sssiisi", $nome, $tipo, $serial, $id_tecnico, $id_cliente, $imagem, $id);
        } else {
            // Manter imagem atual
            $sql = "UPDATE equipamento SET nome = ?, tipo = ?, serial = ?, id_tecnico = ?, id_cliente = ? WHERE id_equipamento = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("sssiii", $nome, $tipo, $serial, $id_tecnico, $id_cliente, $id);
        }
        
        if (!$stmt->execute()) {
            throw new Exception('Erro ao atualizar equipamento: ' . $conn->error);
        }
        
        $stmt->close();
        
        // Remover peças antigas
        $deletePiecesSql = "DELETE FROM equipamento_peca WHERE id_equipamento = ?";
        $deletePiecesStmt = $conn->prepare($deletePiecesSql);
        $deletePiecesStmt->bind_param("i", $id);
        $deletePiecesStmt->execute();
        $deletePiecesStmt->close();
        
        // Inserir novas peças
        if (!empty($selected_pieces)) {
            $piecesSql = "INSERT INTO equipamento_peca (id_equipamento, id_peca) VALUES (?, ?)";
            $piecesStmt = $conn->prepare($piecesSql);
            
            foreach ($selected_pieces as $pieceId) {
                $piecesStmt->bind_param("ii", $id, $pieceId);
                if (!$piecesStmt->execute()) {
                    throw new Exception('Erro ao associar peças: ' . $conn->error);
                }
            }
            
            $piecesStmt->close();
        }
        
        $conn->commit();
        echo json_encode(['success' => true, 'message' => 'Equipamento atualizado com sucesso']);
        
    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

function deleteEquipment($conn) {
    $id = $_POST['id'] ?? 0;
    
    if (!$id) {
        echo json_encode(['success' => false, 'message' => 'ID do equipamento não fornecido']);
        return;
    }
    
    // Iniciar transação
    $conn->begin_transaction();
    
    try {
        // Remover peças associadas
        $deletePiecesSql = "DELETE FROM equipamento_peca WHERE id_equipamento = ?";
        $deletePiecesStmt = $conn->prepare($deletePiecesSql);
        $deletePiecesStmt->bind_param("i", $id);
        $deletePiecesStmt->execute();
        $deletePiecesStmt->close();
        
        // Remover equipamento
        $sql = "DELETE FROM equipamento WHERE id_equipamento = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        
        if (!$stmt->execute()) {
            throw new Exception('Erro ao excluir equipamento: ' . $conn->error);
        }
        
        if ($stmt->affected_rows === 0) {
            throw new Exception('Equipamento não encontrado');
        }
        
        $stmt->close();
        
        $conn->commit();
        echo json_encode(['success' => true, 'message' => 'Equipamento excluído com sucesso']);
        
    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

function getTechnicians($conn) {
    $sql = "SELECT id_tecnico, nome FROM tecnico ORDER BY nome";
    $result = $conn->query($sql);
    
    if ($result) {
        $technicians = [];
        while ($row = $result->fetch_assoc()) {
            $technicians[] = $row;
        }
        echo json_encode(['success' => true, 'technicians' => $technicians]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Erro ao buscar técnicos: ' . $conn->error]);
    }
}
?>

