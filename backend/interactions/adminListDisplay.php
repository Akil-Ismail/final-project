<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

require_once('../db/connection.php');

try {
    $sql = "
        SELECT
            u.username,
            q.name AS quiz_name,
            ua.quiz_id,
            COUNT(ua.answer_id) AS total_answers,
            SUM(CASE WHEN a.correct_answer = 1 THEN 1 ELSE 0 END) AS correct_answers
        FROM user_answers ua
        JOIN users u ON ua.user_id = u.user_id
        JOIN answers a ON ua.answer_id = a.id
        JOIN quizez q ON ua.quiz_id = q.id
        GROUP BY ua.user_id, ua.quiz_id
        ORDER BY u.username, q.name;
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $results = [];

    foreach ($rows as $row) {
        $total = $row['total_answers'];
        $correct = $row['correct_answers'];
        $score = $total > 0 ? round(($correct / $total) * 100, 2) : 0;

        $results[] = [
            "username" => $row['username'],
            "quiz_name" => $row['quiz_name'],
            "score" => $score
        ];
    }

    echo json_encode([
        "success" => true,
        "results" => $results
    ]);
} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ]);
}
