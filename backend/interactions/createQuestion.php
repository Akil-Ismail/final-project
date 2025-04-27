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

$quiz_id = $_POST['quiz_id'] ?? null;
$question_content = $_POST['question_content'] ?? null;

if (!$quiz_id || !$question_content) {
    $result["success"] = false;
    $result["error"] = "Missing quiz ID or question content.";
    http_response_code(400);
    echo json_encode($result);
    exit();
}

try {
    // Insert the question
    $insertQuestionSql = "INSERT INTO `questions` (`id`, `quiz_id`, `content`) VALUES (NULL, ?, ?)";
    $stmt = $pdo->prepare($insertQuestionSql);
    $stmt->execute([$quiz_id, $question_content]);
    $question_id = $pdo->lastInsertId();

    // Insert the answers
    foreach ($_POST['answers'] as $answer) {
        $answer_content = $answer['content'];
        $is_correct = $answer['is_correct'] ? 1 : 0;

        $insertAnswerSql = "INSERT INTO `answers` (`id`, `question_id`, `answer`, `correct_answer`) VALUES (NULL, ?, ?, ?)";
        $answerStmt = $pdo->prepare($insertAnswerSql);
        $answerStmt->execute([$question_id, $answer_content, $is_correct]);
    }

    $result["success"] = true;
    $result['quiz_id'] = $quiz_id;
    echo json_encode($result);
} catch (PDOException $e) {
    $result["success"] = false;
    $result['error'] = 'Something went wrong when creating the question';
    http_response_code(500);
    echo json_encode($result);
}

$pdo = null;
