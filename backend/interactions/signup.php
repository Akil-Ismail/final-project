<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
require_once('../db/connection.php');

$result = [];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    $result['error'] = 'Incorrect request method';
    $result['success'] = false;
    http_response_code(405);
    die(json_encode($result));
}

$username = $_POST['username'];
$email = $_POST['email'];
$password = $_POST['password'];

try {
    // Check for existing username or email
    $checkSql = "SELECT * FROM `users` WHERE `username` = ? OR `email` = ?";
    $checkStmt = $pdo->prepare($checkSql);
    $checkStmt->execute([$username, $email]);
    $existingUser = $checkStmt->fetch();

    if ($existingUser) {
        $result["success"] = false;
        if ($existingUser['username'] === $username) {
            $result["error"] = "Username is already taken";
        } elseif ($existingUser['email'] === $email) {
            $result["error"] = "Email is already registered";
        } else {
            $result["error"] = "Username or email already exists";
        }
        http_response_code(409); // Conflict
        echo json_encode($result);
        exit();
    }

    // Insert new user
    $sql = "INSERT INTO `users` (`user_id`, `username`, `email`, `password`) VALUES (NULL, ?, ?, ?)";
    $statement = $pdo->prepare($sql);
    $statement->bindValue(1, $username);
    $statement->bindValue(2, $email);
    $statement->bindValue(3, password_hash($password, PASSWORD_DEFAULT));
    $statement->execute();

    $result["success"] = true;
    echo json_encode($result);
} catch (PDOException $e) {
    $result["success"] = false;
    $result['error'] = 'Something went wrong during registration';
    http_response_code(500);  // Internal Server Error
    echo json_encode($result);
}

$pdo = null;
