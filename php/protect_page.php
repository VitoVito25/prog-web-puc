<?php
session_start();

if (!isset($_SESSION["loggedin"]) || $_SESSION["loggedin"] !== TRUE) {
    header("Location: login.html");
    exit;
}
?>

