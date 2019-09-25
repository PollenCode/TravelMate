<?php

// Required field names
$required = array('name', 'fullname', 'password', 'age', 'email');

// Loop over field names, make sure each one exists and is not empty
$error = false;
foreach($required as $field) {
  if (empty($_POST[$field])) {
    $error = true;
  }
}

if ($error) {
  echo "Error.";
} else {
  echo "Proceed...";
}

?>