<?php
require_once('../db/connection.php');

$result = [];

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    $result['error'] = 'Incorrect request method';
    $result['success'] = false;
    http_response_code(405);
    die(json_encode($result));
}

$get = $_GET;
if (!isset($get['quiz_id']) || !isset($get['user_id'])) {
    $result['error'] = 'quiz_id or user_id not provided';
    $result['success'] = false;
    http_response_code(400);
    die(json_encode($result));
}

$quiz_id = $get['quiz_id'];
$user_id = $get['user_id'];

try {
    // Check if user has already answered
    $checkSql = "SELECT COUNT(*) FROM user_answers WHERE user_id = ? AND quiz_id = ?";
    $checkStmt = $pdo->prepare($checkSql);
    $checkStmt->execute([$user_id, $quiz_id]);
    $alreadyAnswered = $checkStmt->fetchColumn();

    if ($alreadyAnswered > 0) {
        // Fetch all questions and answers
        $sql = "SELECT q.id AS question_id, q.content AS question_content,
                       a.id AS answer_id, a.answer,
                       ua.answer_id AS chosen_answer_id,
                       a.correct_answer
                FROM questions q
                INNER JOIN answers a ON a.question_id = q.id
                LEFT JOIN user_answers ua ON ua.question_id = q.id AND ua.user_id = ? AND ua.quiz_id = ?
                WHERE q.quiz_id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$user_id, $quiz_id, $quiz_id]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $structured = [];
        $correct = 0;
        $total = 0;

        foreach ($rows as $row) {
            $q_id = $row['question_id'];
            if (!isset($structured[$q_id])) {
                $structured[$q_id] = [
                    'question_id' => $q_id,
                    'question_content' => $row['question_content'],
                    'question_answers' => []
                ];
            }

            $isChosen = $row['answer_id'] == $row['chosen_answer_id'];
            $structured[$q_id]['question_answers'][] = [
                'answer_id' => $row['answer_id'],
                'answer' => $row['answer'],
                'chosen' => $isChosen
            ];

            if ($isChosen && $row['correct_answer']) {
                $correct++;
            }

            if ($row['correct_answer']) {
                $total++;
            }
        }

        // Get user's name
        $userStmt = $pdo->prepare("SELECT username FROM users WHERE user_id = ?");
        $userStmt->execute([$user_id]);
        $userRow = $userStmt->fetch();

        $result = [
            'success' => true,
            'already_answered' => true,
            'score' => $total > 0 ? round(($correct / $total) * 100) : 0,
            'user_id' => (int)$user_id,
            'user_name' => $userRow ? $userRow['username'] : "Unknown",
            'quiz_id' => (int)$quiz_id,
            'user_answers' => array_values($structured)
        ];

        echo json_encode($result);
        exit();
    }

    // User has not answered — return just the quiz structure
    $sql = "SELECT questions.id AS question_id, questions.content, answers.id AS answer_id, answers.answer 
            FROM questions 
            INNER JOIN answers ON answers.question_id = questions.id 
            WHERE quiz_id = ?";
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

    $result = [
        'success' => true,
        'already_answered' => false,
        'data' => array_values($structured)
    ];

    echo json_encode($result);
    exit();
} catch (PDOException $e) {
    $result["success"] = false;
    $result['error'] = $e;
    http_response_code(500);
    echo json_encode($result);
    exit();
}

$pdo = null;
