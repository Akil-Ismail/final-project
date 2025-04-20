<?php
require_once('../db/connection.php');

$result = [];

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    $result['error'] = 'incorrect request method';
    $result['success'] = false;
    http_response_code(405);
    die(json_encode($result));
}
$get = $_GET;
isset($get['quiz_id']) && $quiz_id = $get['quiz_id'];
try {
    $sql = "SELECT question,answer FROM questions inner join answers where quiz_id=? and answers.question_id=questions.id";
    $statement = $pdo->prepare($sql);
    $statement->execute([$quiz_id]);
    $questions = $statement->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    $result["success"] = true;
    $result["data"] = $questions;
    echo json_encode($result);
    die();
} catch (PDOException) {
    $result["success"] = false;
    $result['error'] = 'Error getting questions';
    http_response_code(404);
    echo json_encode($result);
    exit();
}


$pdo = null;
