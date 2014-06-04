<?php
    // requires php5
define('UPLOAD_DIR', '../images/');
$inputJSON = file_get_contents('php://input');
$input = json_decode( $inputJSON, TRUE ); //convert JSON into array
$img = $input['base64'];
$name = $input['name'];
$type = 'image/jpeg';
$img = str_replace('data:'.$type.';base64,', '', $img);
$img = str_replace(' ', '+', $img);
$data = base64_decode($img);
$file = UPLOAD_DIR . $name . '.jpeg';
$success = file_put_contents($file, $data);
print $success ? $file : 'Could Not Create File';
?>
