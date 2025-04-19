<?php
require_once('../db/connection.php');

$result = [];

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    $result['error'] = 'incorrect request method';
    $result['success'] = false;
    http_response_code(405);
    die(json_encode($result));
}
try {
    $sql = "SELECT name,id  FROM quizez";
    $statement = $pdo->prepare($sql);
    $statement->execute();
    $quizes = $statement->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    $result["success"] = true;
    $result["data"] = $quizes;
    echo json_encode($result);
    die();
} catch (PDOException) {
    $result["success"] = false;
    $result['error'] = 'Error getting specialities';
    http_response_code(404);
    echo json_encode($result);
    exit();
}


$pdo = null;
