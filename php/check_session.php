<?php
session_start();

header('Content-Type: application/json');

if (isset($_SESSION["loggedin"]) && $_SESSION["loggedin"] === TRUE) {
    echo json_encode([
        "loggedin" => true,
        "username" => $_SESSION["username"],
        "id" => $_SESSION["id"]
    ]);
} else {
    echo json_encode([
        "loggedin" => false
    ]);
}
?>

