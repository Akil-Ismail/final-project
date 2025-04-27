<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
require_once('../db/connection.php');

$result = [];

// Handle only POST method (you could switch to DELETE if preferred)
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    $result['error'] = 'Incorrect request method';
    $result['success'] = false;
    http_response_code(405);
    die(json_encode($result));
}

// Read the raw POST data (JSON)
$data = json_decode(file_get_contents("php://input"), true);

// Extract the question ID from the data
$question_id = $data['question_id'] ?? null;

if (!$question_id) {
    $result["success"] = false;
    $result["error"] = "Missing question ID.";
    http_response_code(400);
    echo json_encode($result);
    exit();
}

try {
    // Prepare and execute the SQL to delete the question from the questions table
    $deleteQuestionSql = "DELETE FROM `questions` WHERE `id` = ?";
    $stmt = $pdo->prepare($deleteQuestionSql);
    $stmt->execute([$question_id]);

    // Check if a row was affected (meaning the question was actually deleted)
    if ($stmt->rowCount() > 0) {
        // Optionally, delete the related answers too
        $deleteAnswersSql = "DELETE FROM `answers` WHERE `question_id` = ?";
        $stmt = $pdo->prepare($deleteAnswersSql);
        $stmt->execute([$question_id]);

        $result["success"] = true;
        echo json_encode($result);
    } else {
        $result["success"] = false;
        $result["error"] = "Question not found or already deleted.";
        http_response_code(404);
        echo json_encode($result);
    }
} catch (PDOException $e) {
    $result["success"] = false;
    $result['error'] = 'Something went wrong when deleting the question';
    http_response_code(500);
    echo json_encode($result);
}

$pdo = null;
