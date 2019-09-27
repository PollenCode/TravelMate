<?php

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
$passowrd_pepper = bin2hex(random_bytes(1)); // Not implemented
$password_hash = password_hash($_POST["password"] . $password_salt_extra . $password_salt, PASSWORD_DEFAULT);

echo "hash: " . $password_hash . "<br> salt: " . $password_salt . "<br> salt_extra: " . $password_salt_extra . "<br> pepper: " . $passowrd_pepper . "<br>";

/*$db_servername = "stijnrogiest.ikdoeict.be:3306";
$db_username = "stijn.rogiest";
$db_password = "8qYr~0k4";
$db_name = "stijn_rogiest_";*/
$db_servername = "localhost";
$db_username = "root";
$db_password = "Kp6MHLc7ueEtk40c";
$db_name = "travelmate";

$conn = new mysqli($db_servername, $db_username, $db_password, $db_name);
if ($conn->connect_error)
{
    die("Connection failed: " . $conn->connect_error);
}

$sql = "INSERT INTO users (FirstName, LastName, Email, DateOfBirth, PasswordHash, PasswordSalt) VALUES ('" . $_POST["firstname"] . "', '" . $_POST["lastname"] . "', '" . $_POST["email"] . "' , '" . $_POST["dateOfBirth"] . "', '" . $password_hash . "', '" . $password_salt .  "')";

if ($conn->query($sql) === TRUE)
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