<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Testing page</title>
</head>
<body>
    <form method="GET" action="/test.php">
        Enter value: <input type="text" name="value">
        <input type="submit" value="Submit">
    </form>

    <?php

    if (empty($_GET["value"]))
    {
        die("No testing data was given");
    }

    $value = htmlspecialchars($_GET["value"]);

    echo "Entered value: " . $value . "<br>"

    ?>


</body>
</html>




