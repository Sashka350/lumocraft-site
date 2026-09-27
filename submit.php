<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed'], JSON_UNESCAPED_UNICODE);
    exit;
}

$configPath = dirname(__DIR__, 2) . '/lumocraft-config.php';
if (!is_file($configPath)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Server configuration is missing'], JSON_UNESCAPED_UNICODE);
    exit;
}

$config = require $configPath;
$fields = [
    'Имя', 'Почта', 'Телефон', 'Telegram', 'Тип клиента', 'Задача', 'Описание',
    'Проект', 'Срок', 'О проекте', 'Цель сайта', 'Стиль', 'Цвета', 'Объём', 'Референсы',
];

// This field is intentionally invisible in the forms and catches basic bots.
if (trim((string)($_POST['website'] ?? '')) !== '') {
    echo json_encode(['ok' => true], JSON_UNESCAPED_UNICODE);
    exit;
}

$values = [];
foreach ($fields as $field) {
    $rawValue = $_POST[$field] ?? '';
    $value = is_array($rawValue) ? implode(', ', array_map('strval', $rawValue)) : (string)$rawValue;
    $value = trim($value);
    if ($value !== '') {
        $values[$field] = function_exists('mb_substr') ? mb_substr($value, 0, 2000) : substr($value, 0, 6000);
    }
}

$email = $values['Почта'] ?? '';
$phone = $values['Телефон'] ?? '';
$telegram = $values['Telegram'] ?? '';
$lang = strtolower(substr((string)($_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? ''), 0, 2)) === 'en' ? 'en' : 'ru';
$errors = [
    'name' => ['ru' => 'Заполните имя', 'en' => 'Please fill in your name'],
    'contact' => ['ru' => 'Укажите хотя бы один способ связи: телефон, email или Telegram', 'en' => 'Provide at least one way to reach you: phone, email or Telegram'],
    'email' => ['ru' => 'Проверьте email', 'en' => 'Please check your email'],
];
if (($values['Имя'] ?? '') === '') {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => $errors['name'][$lang]], JSON_UNESCAPED_UNICODE);
    exit;
}
if (!$email && !$phone && !$telegram) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => $errors['contact'][$lang]], JSON_UNESCAPED_UNICODE);
    exit;
}
if ($email && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => $errors['email'][$lang]], JSON_UNESCAPED_UNICODE);
    exit;
}

$formName = trim((string)($_POST['form_name'] ?? 'Заявка'));
$lines = ["<b>Новая заявка: " . htmlspecialchars($formName, ENT_QUOTES, 'UTF-8') . '</b>'];
$plainLines = ["Новая заявка: {$formName}"];
foreach ($values as $key => $value) {
    $safeKey = htmlspecialchars($key, ENT_QUOTES, 'UTF-8');
    $safeValue = htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
    $lines[] = "<b>{$safeKey}:</b> {$safeValue}";
    $plainLines[] = "{$key}: {$value}";
}
$telegramText = function_exists('mb_substr')
    ? mb_substr(implode("\n", $lines), 0, 3900)
    : substr(implode("\n", $lines), 0, 12000);
$emailBody = implode("\n", $plainLines);

$ch = curl_init('https://api.telegram.org/bot' . rawurlencode((string)$config['telegram_token']) . '/sendMessage');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => http_build_query([
        'chat_id' => (string)$config['telegram_chat_id'],
        'text' => $telegramText,
        'parse_mode' => 'HTML',
    ]),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 8,
    CURLOPT_TIMEOUT => 15,
]);
$telegramResponse = curl_exec($ch);
$telegramStatus = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
$telegramData = json_decode((string)$telegramResponse, true);

$mailSubject = '=?UTF-8?B?' . base64_encode($formName . ' · lumocraft') . '?=';
$mailHeaders = "MIME-Version: 1.0\r\nFrom: lumocraft <contact@lumocraft.ru>\r\nContent-Type: text/plain; charset=UTF-8\r\n";
if ($email) {
    $mailHeaders .= "Reply-To: {$email}\r\n";
}
$mailSent = mail((string)$config['mail_to'], $mailSubject, $emailBody, $mailHeaders);

$telegramOk = $telegramStatus >= 200 && $telegramStatus < 300 && is_array($telegramData) && !empty($telegramData['ok']);

if (!$telegramOk && !$mailSent) {
    http_response_code(502);
    $sendError = $lang === 'en'
        ? 'Could not send your request. Please try again or write to us directly.'
        : 'Не удалось отправить заявку. Попробуйте ещё раз или напишите напрямую.';
    echo json_encode(['ok' => false, 'error' => $sendError], JSON_UNESCAPED_UNICODE);
    exit;
}

echo json_encode(['ok' => true, 'telegram' => $telegramOk, 'mail_sent' => $mailSent], JSON_UNESCAPED_UNICODE);
