<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
require_once('../db/connection.php');

$result = [];

// Check for POST method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    $result['error'] = 'Incorrect request method';
    $result['success'] = false;
    http_response_code(405);
    die(json_encode($result));
}

// Read the raw POST data (JSON)
$data = json_decode(file_get_contents("php://input"), true);

// Extract the quiz_id from the data
$quiz_id = $data['quiz_id'] ?? null;

if (!$quiz_id) {
    $result["success"] = false;
    $result["error"] = "Missing quiz ID.";
    http_response_code(400);
    echo json_encode($result);
    exit();
}

try {
    // Prepare and execute the SQL to delete the quiz from the quizzes table
    $deleteQuizSql = "DELETE FROM `quizez` WHERE `id` = ?";
    $stmt = $pdo->prepare($deleteQuizSql);
    $stmt->execute([$quiz_id]);

    // Check if a row was affected (meaning the quiz was actually deleted)
    if ($stmt->rowCount() > 0) {

        $result["success"] = true;
        echo json_encode($result);
    } else {
        $result["success"] = false;
        $result["error"] = "Quiz not found or already deleted.";
        http_response_code(404);
        echo json_encode($result);
    }
} catch (PDOException $e) {
    $result["success"] = false;
    $result['error'] = 'Something went wrong when deleting the quiz';
    http_response_code(500);
    echo json_encode($result);
}

$pdo = null;
