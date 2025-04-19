<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
require_once('../db/connection.php');

$result = [];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    $result['error'] = 'incorrect request method';
    $result['success'] = false;
    http_response_code(405);
    die(json_encode($result));
}

$username = $_POST['username'];
$email = $_POST['email'];
$password = $_POST['password'];

try {
    $sql = "INSERT INTO `users` (`user_id`, `username`, `email`, `password`) VALUES (NULL, ?, ?, ?);";
    $statement = $pdo->prepare($sql);
    $statement->bindValue(1, $username);
    $statement->bindValue(2, $email);
    $statement->bindValue(3, password_hash($password, PASSWORD_DEFAULT));
    $statement->execute();
} catch (PDOException $e) {
    $result["success"] = false;
    $result['error'] = 'Email address is already registered';
    http_response_code(409);  // Conflict status code
    echo json_encode($result);
    exit();
}
$result["success"] = true;
echo json_encode($result);
$pdo = null;
