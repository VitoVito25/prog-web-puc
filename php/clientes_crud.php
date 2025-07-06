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
        listClients($conn);
        break;
    case 'get':
        getClient($conn);
        break;
    case 'create':
        createClient($conn);
        break;
    case 'update':
        updateClient($conn);
        break;
    case 'delete':
        deleteClient($conn);
        break;
    case 'equipments':
        getClientEquipments($conn);
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'Ação não especificada']);
}

$conn->close();

function listClients($conn) {
    $sql = "SELECT id_cliente, nome, telefone FROM cliente ORDER BY nome";
    $result = $conn->query($sql);
    
    if ($result) {
        $clients = [];
        while ($row = $result->fetch_assoc()) {
            $clients[] = $row;
        }
        echo json_encode(['success' => true, 'clients' => $clients]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Erro ao buscar clientes: ' . $conn->error]);
    }
}

function getClient($conn) {
    $id = $_GET['id'] ?? 0;
    
    if (!$id) {
        echo json_encode(['success' => false, 'message' => 'ID do cliente não fornecido']);
        return;
    }
    
    $sql = "SELECT id_cliente, nome, telefone FROM cliente WHERE id_cliente = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result && $row = $result->fetch_assoc()) {
        echo json_encode(['success' => true, 'client' => $row]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Cliente não encontrado']);
    }
    
    $stmt->close();
}

function createClient($conn) {
    $nome = $_POST['nome'] ?? '';
    $telefone = $_POST['telefone'] ?? '';
    
    if (empty($nome)) {
        echo json_encode(['success' => false, 'message' => 'Nome é obrigatório']);
        return;
    }
    
    $sql = "INSERT INTO cliente (nome, telefone) VALUES (?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ss", $nome, $telefone);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Cliente criado com sucesso']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Erro ao criar cliente: ' . $conn->error]);
    }
    
    $stmt->close();
}

function updateClient($conn) {
    $id = $_POST['id'] ?? 0;
    $nome = $_POST['nome'] ?? '';
    $telefone = $_POST['telefone'] ?? '';
    
    if (!$id || empty($nome)) {
        echo json_encode(['success' => false, 'message' => 'ID e nome são obrigatórios']);
        return;
    }
    
    $sql = "UPDATE cliente SET nome = ?, telefone = ? WHERE id_cliente = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ssi", $nome, $telefone, $id);
    
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            echo json_encode(['success' => true, 'message' => 'Cliente atualizado com sucesso']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Nenhuma alteração foi feita ou cliente não encontrado']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Erro ao atualizar cliente: ' . $conn->error]);
    }
    
    $stmt->close();
}

function deleteClient($conn) {
    $id = $_POST['id'] ?? 0;
    
    if (!$id) {
        echo json_encode(['success' => false, 'message' => 'ID do cliente não fornecido']);
        return;
    }
    
    // Verificar se o cliente tem equipamentos associados
    $checkSql = "SELECT COUNT(*) as count FROM equipamento WHERE id_cliente = ?";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bind_param("i", $id);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    $checkRow = $checkResult->fetch_assoc();
    
    if ($checkRow['count'] > 0) {
        echo json_encode(['success' => false, 'message' => 'Não é possível excluir cliente que possui equipamentos associados']);
        $checkStmt->close();
        return;
    }
    
    $checkStmt->close();
    
    $sql = "DELETE FROM cliente WHERE id_cliente = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $id);
    
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            echo json_encode(['success' => true, 'message' => 'Cliente excluído com sucesso']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Cliente não encontrado']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Erro ao excluir cliente: ' . $conn->error]);
    }
    
    $stmt->close();
}

function getClientEquipments($conn) {
    $clientId = $_GET['client_id'] ?? 0;
    
    if (!$clientId) {
        echo json_encode(['success' => false, 'message' => 'ID do cliente não fornecido']);
        return;
    }
    
    $sql = "SELECT e.id_equipamento, e.nome, e.tipo, e.serial, e.imagem, t.nome as tecnico_nome 
            FROM equipamento e 
            LEFT JOIN tecnico t ON e.id_tecnico = t.id_tecnico 
            WHERE e.id_cliente = ? 
            ORDER BY e.nome";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $clientId);
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

