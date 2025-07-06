<?php
require_once '../conectaBD.php';

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $nome = $_POST['nome'];
    $login = $_POST['login'];
    $senha = $_POST['senha'];

    $hashed_password = password_hash($senha, PASSWORD_DEFAULT);

    $stmt = $conn->prepare("INSERT INTO tecnico (nome, login, senha) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $nome, $login, $hashed_password);

    if ($stmt->execute()) {
        echo "Cadastro realizado com sucesso!";
    } else {
        echo "Erro ao cadastrar: " . $stmt->error;
    }

    $stmt->close();
}

$conn->close();
?>

