<?php

$required_fields = array('name', 'firstname', 'password', 'email', 'dateOfBirth');
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
$password_hash = password_hash($_POST["password"], PASSWORD_DEFAULT);

echo "hash: " . $password_hash . "<br> salt: " . $password_salt . "<br>";

$db_servername = "stijnrogiest.ikdoeict.be:3306";
$db_username = "stijn.rogiest";
$db_password = "8qYr~0k4";
$db_name = "stijn_rogiest_";

$conn = new mysqli($db_servername, $db_username, $db_password, $db_name);
if ($conn->connect_error)
{
    die("Connection failed: " . $conn->connect_error);
}

$sql = "INSERT INTO Users (Name, FirstName, Password, PasswordSalt, DateOfBirth, Email)
VALUES ('" . $_POST["name"] . "', '" . $_POST["firstname"] . "', '" . $password_hash . "', '" . $password_salt . "', '" . $_POST["dateOfBirth"] . "' , '" . $_POST["email"] .  "')";

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

header("Location: " . "/index.html");
die();

?>