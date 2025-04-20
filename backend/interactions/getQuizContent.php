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
    $sql = "SELECT questions.id AS question_id, questions.content, answers.id AS answer_id, answers.answer FROM questions INNER JOIN answers ON answers.question_id = questions.id WHERE quiz_id=?";
    $statement = $pdo->prepare($sql);
    $statement->execute([$quiz_id]);
    $rows = $statement->fetchAll(PDO::FETCH_ASSOC);
    $structured = [];

    foreach ($rows as $row) {
        $q_id = $row['question_id'];
        if (!isset($structured[$q_id])) {
            $structured[$q_id] = [
                'question_id' => $q_id,
                'content' => $row['content'],
                'answers' => []
            ];
        }

        $structured[$q_id]['answers'][] = [
            'answer_id' => $row['answer_id'],
            'answer' => $row['answer']
        ];
    }

    http_response_code(200);
    $result["success"] = true;
    $result["data"] = array_values($structured);
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
