<?php

require "database.php";


// https://github.com/thephpleague/oauth2-client

$required_fields = array('firstname', 'lastname', 'password', 'email', 'dateOfBirth');
$error = false;
foreach($required_fields as $field) 
{
    if (empty($_POST[$field])) 
    {


        $error = true;
    }
}

if ($error)
{
    echo "Please fill in all required fields.";
    die();
}

$password_salt = bin2hex(random_bytes(32));
$password_salt_extra = "/'3RRHsXYm(pp\-,";
$passowrd_pepper = bin2hex(random_bytes(1)); // Not implemented yet
$password_hash = password_hash($_POST["password"] . $password_salt_extra . $password_salt, PASSWORD_DEFAULT);

echo "hash: " . $password_hash . "<br> salt: " . $password_salt . "<br> salt_extra: " . $password_salt_extra . "<br> pepper: " . $passowrd_pepper . "<br>";

if (!db_connect())
{
    die("Database connection error.");
}

$sql = "INSERT INTO users (FirstName, LastName, Email, DateOfBirth, PasswordHash, PasswordSalt) VALUES ('" . $_POST["firstname"] . "', '" . $_POST["lastname"] . "', '" . $_POST["email"] . "' , '" . $_POST["dateOfBirth"] . "', '" . $password_hash . "', '" . $password_salt .  "')";

if (db_query($sql))
{
    echo "New record created successfully";
} 
else 
{
    echo "Error: " . $sql . "<br>" . $conn->error;
    die();
}

$conn->close();   

//header("Location: " . "/index.html");
die();

?>