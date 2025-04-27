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

// Get the JSON input
$input = json_decode(file_get_contents("php://input"), true);

if (!$input || !isset($input['name']) || !isset($input['questions'])) {
    $result['error'] = 'Invalid input';
    $result['success'] = false;
    http_response_code(400); // Bad Request
    die(json_encode($result));
}

$quiz_name = $input['name'];
$questions = $input['questions']; // Expecting array of questions

try {
    // Start transaction
    $pdo->beginTransaction();

    // Insert the quiz
    $quizSql = "INSERT INTO `quizez` (`id`, `name`) VALUES (NULL, ?)";
    $quizStmt = $pdo->prepare($quizSql);
    $quizStmt->execute([$quiz_name]);
    $quizId = $pdo->lastInsertId(); // Get the inserted quiz ID

    // Insert questions and answers
    foreach ($questions as $question) {
        $questionContent = $question['content'];
        $answers = $question['answers']; // Array of answers [{ answer: "", correct: true/false }, ...]


        // Insert question
        $questionSql = "INSERT INTO `questions` (`id`, `quiz_id`, `content`) VALUES (NULL, ?, ?)";
        $questionStmt = $pdo->prepare($questionSql);
        $questionStmt->execute([$quizId, $questionContent]);
        $questionId = $pdo->lastInsertId();

        // Insert answers
        foreach ($answers as $answer) {
            $answerText = $answer['answer'];
            $isCorrect = $answer['correct_answer'];

            $answerSql = "INSERT INTO `answers` (`id`, `question_id`, `answer`, `correct_answer`) VALUES (NULL, ?, ?, ?)";
            $answerStmt = $pdo->prepare($answerSql);
            $answerStmt->execute([$questionId, $answerText, $isCorrect]);
        }
    }

    // Commit transaction
    $pdo->commit();

    $result['success'] = true;
    $result['quiz_id'] = $quizId;
    echo json_encode($result);
} catch (PDOException $e) {
    $pdo->rollBack();
    $result['success'] = false;
    $result['error'] = 'Something went wrong while creating the quiz';
    http_response_code(500);
    echo json_encode($result);
}

$pdo = null;
