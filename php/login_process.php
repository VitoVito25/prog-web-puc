
<?php
session_start();
require_once '../conectaBD.php';

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $login = $_POST["login"];
    $senha = $_POST["senha"];

    $stmt = $conn->prepare("SELECT id_tecnico, nome, senha FROM tecnico WHERE login = ?");
    $stmt->bind_param("s", $login);
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows > 0) {
        $stmt->bind_result($id_tecnico, $nome, $hashed_password);
        $stmt->fetch();

        if (password_verify($senha, $hashed_password)) {
            $_SESSION["loggedin"] = TRUE;
            $_SESSION["id"] = $id_tecnico;
            $_SESSION["username"] = $nome;
            echo "Login bem-sucedido!";
        } else {
            echo "Senha incorreta.";
        }
    } else {
        echo "Usuário não encontrado.";
    }

    $stmt->close();
}

$conn->close();
?>

