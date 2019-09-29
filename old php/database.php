<?php

$conn = NULL;

function db_connect()
{
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
        return false; //  die("Connection failed: " . $conn->connect_error);
    }

    return true;
}

function db_query($query)
{
    return $conn->query($query) === TRUE;
}


?>