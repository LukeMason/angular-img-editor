<?php
    // requires php5
    define('UPLOAD_DIR', '../images/');
    $img = $_POST['base64'];
    $img = str_replace('data:image/jpeg;base64,', '', $img);
    $img = str_replace(' ', '+', $img);
    $data = base64_decode($img);
    $file = UPLOAD_DIR . 'test.jpeg';
    $success = file_put_contents($file, $data);
    print $success ? $file : ;
?>