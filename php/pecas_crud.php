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
        listPieces($conn);
        break;
    case 'get':
        getPiece($conn);
        break;
    case 'create':
        createPiece($conn);
        break;
    case 'update':
        updatePiece($conn);
        break;
    case 'delete':
        deletePiece($conn);
        break;
    case 'equipments':
        getPieceEquipments($conn);
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'Ação não especificada']);
}

$conn->close();

function listPieces($conn) {
    $sql = "SELECT tp.id_peca, tp.nome, 
                   COUNT(ep.id_equipamento) as equipment_count
            FROM tipo_pecas tp 
            LEFT JOIN equipamento_peca ep ON tp.id_peca = ep.id_peca 
            GROUP BY tp.id_peca, tp.nome 
            ORDER BY tp.nome";
    
    $result = $conn->query($sql);
    
    if ($result) {
        $pieces = [];
        while ($row = $result->fetch_assoc()) {
            $pieces[] = $row;
        }
        echo json_encode(['success' => true, 'pieces' => $pieces]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Erro ao buscar peças: ' . $conn->error]);
    }
}

function getPiece($conn) {
    $id = $_GET['id'] ?? 0;
    
    if (!$id) {
        echo json_encode(['success' => false, 'message' => 'ID da peça não fornecido']);
        return;
    }
    
    $sql = "SELECT id_peca, nome FROM tipo_pecas WHERE id_peca = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result && $row = $result->fetch_assoc()) {
        echo json_encode(['success' => true, 'piece' => $row]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Peça não encontrada']);
    }
    
    $stmt->close();
}

function createPiece($conn) {
    $nome = $_POST['nome'] ?? '';
    
    if (empty($nome)) {
        echo json_encode(['success' => false, 'message' => 'Nome da peça é obrigatório']);
        return;
    }
    
    // Verificar se já existe uma peça com o mesmo nome
    $checkSql = "SELECT COUNT(*) as count FROM tipo_pecas WHERE nome = ?";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bind_param("s", $nome);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    $checkRow = $checkResult->fetch_assoc();
    
    if ($checkRow['count'] > 0) {
        echo json_encode(['success' => false, 'message' => 'Já existe uma peça com este nome']);
        $checkStmt->close();
        return;
    }
    
    $checkStmt->close();
    
    $sql = "INSERT INTO tipo_pecas (nome) VALUES (?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $nome);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Peça criada com sucesso']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Erro ao criar peça: ' . $conn->error]);
    }
    
    $stmt->close();
}

function updatePiece($conn) {
    $id = $_POST['id'] ?? 0;
    $nome = $_POST['nome'] ?? '';
    
    if (!$id || empty($nome)) {
        echo json_encode(['success' => false, 'message' => 'ID e nome são obrigatórios']);
        return;
    }
    
    // Verificar se já existe outra peça com o mesmo nome
    $checkSql = "SELECT COUNT(*) as count FROM tipo_pecas WHERE nome = ? AND id_peca != ?";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bind_param("si", $nome, $id);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    $checkRow = $checkResult->fetch_assoc();
    
    if ($checkRow['count'] > 0) {
        echo json_encode(['success' => false, 'message' => 'Já existe uma peça com este nome']);
        $checkStmt->close();
        return;
    }
    
    $checkStmt->close();
    
    $sql = "UPDATE tipo_pecas SET nome = ? WHERE id_peca = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("si", $nome, $id);
    
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            echo json_encode(['success' => true, 'message' => 'Peça atualizada com sucesso']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Nenhuma alteração foi feita ou peça não encontrada']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Erro ao atualizar peça: ' . $conn->error]);
    }
    
    $stmt->close();
}

function deletePiece($conn) {
    $id = $_POST['id'] ?? 0;
    
    if (!$id) {
        echo json_encode(['success' => false, 'message' => 'ID da peça não fornecido']);
        return;
    }
    
    // Verificar se a peça está sendo usada em equipamentos
    $checkSql = "SELECT COUNT(*) as count FROM equipamento_peca WHERE id_peca = ?";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bind_param("i", $id);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    $checkRow = $checkResult->fetch_assoc();
    
    if ($checkRow['count'] > 0) {
        echo json_encode(['success' => false, 'message' => 'Não é possível excluir peça que está sendo usada em equipamentos']);
        $checkStmt->close();
        return;
    }
    
    $checkStmt->close();
    
    $sql = "DELETE FROM tipo_pecas WHERE id_peca = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $id);
    
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            echo json_encode(['success' => true, 'message' => 'Peça excluída com sucesso']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Peça não encontrada']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Erro ao excluir peça: ' . $conn->error]);
    }
    
    $stmt->close();
}

function getPieceEquipments($conn) {
    $pieceId = $_GET['piece_id'] ?? 0;
    
    if (!$pieceId) {
        echo json_encode(['success' => false, 'message' => 'ID da peça não fornecido']);
        return;
    }
    
    $sql = "SELECT e.id_equipamento, e.nome, e.tipo, e.serial, e.imagem, 
                   c.nome as cliente_nome, t.nome as tecnico_nome 
            FROM equipamento e 
            INNER JOIN equipamento_peca ep ON e.id_equipamento = ep.id_equipamento 
            LEFT JOIN cliente c ON e.id_cliente = c.id_cliente 
            LEFT JOIN tecnico t ON e.id_tecnico = t.id_tecnico 
            WHERE ep.id_peca = ? 
            ORDER BY e.nome";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $pieceId);
    $stmt->execute();
    $result = $stmt->get_result();
    
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
    
    $stmt->close();
}
?>

