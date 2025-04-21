<?php
require_once('../db/connection.php');

$result = [];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    $result['error'] = 'incorrect request method';
    $result['success'] = false;
    http_response_code(405);
    die(json_encode($result));
}

$post = json_decode(file_get_contents("php://input"), true);
$user_id = $post['user_id'];
$quiz_id = $post['quiz_id'];

try {
    // Prepare the SQL insert statement
    $sql = "INSERT INTO `user_answers` (`id`, `user_id`, `quiz_id`, `question_id`, `answer_id`) VALUES (NULL, ?, ?, ?, ?);";
    $statement = $pdo->prepare($sql);

    // Loop through the list of answers and insert them one by one
    foreach ($post['answers'] as $answer) {
        // Ensure each item in the array has user_id, quiz_id, question_id, and answer_id
        if (isset($answer['question_id'], $answer['answer_id'])) {
            // Check if a matching record already exists
            $checkSql = "SELECT COUNT(*) FROM `user_answers` WHERE `user_id` = ? AND `quiz_id` = ? AND `question_id` = ?";
            $checkStatement = $pdo->prepare($checkSql);
            $checkStatement->bindValue(1, $user_id);
            $checkStatement->bindValue(2, $quiz_id);
            $checkStatement->bindValue(3, $answer['question_id']);
            $checkStatement->execute();
            $existingCount = $checkStatement->fetchColumn();

            if ($existingCount > 0) {
                // If the record already exists, you can either skip the insertion or update the existing record
                // For this example, we'll skip the insertion and continue with the next answer
                continue; // Skip this answer if already inserted
            }

            // Insert the new answer if no matching record exists
            $statement->bindValue(1, $user_id);
            $statement->bindValue(2, $quiz_id);
            $statement->bindValue(3, $answer['question_id']);
            $statement->bindValue(4, $answer['answer_id']);
            $statement->execute();
        } else {
            // If any expected field is missing, return an error
            $result['error'] = 'Missing user_id, quiz_id, question_id, or answer_id';
            $result['success'] = false;
            http_response_code(400);
            echo json_encode($result);
            exit();
        }
    }

    // Success response
    $result["success"] = true;
    echo json_encode($result);
} catch (PDOException $e) {
    $result['error'] = 'Database error: ' . $e->getMessage();
    $result['success'] = false;
    http_response_code(500);
    echo json_encode($result);
}

$pdo = null;
