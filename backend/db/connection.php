<?php
require_once('../db/config.php');

try {
    $pdo = new PDO(DBCONNSTRING, DBUSER, DBPASS);
} catch (PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}
