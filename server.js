const express = require("express");
const path = require("path");
const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost/travelmate", (err, data) => {
    if (err)
    {
        console.log("Database connection failed!");
    }
    else
    {
        console.log("Database connection succeed!");
    }
});

const app = express();
app.set("views", path.join(__dirname, 'views'));
app.set("view engine", "twig");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const homePage = require("./routes/home.js");
const registerPage = require("./routes/register.js");
const loginPage = require("./routes/login.js");

app.use("/", homePage);
app.use("/home", homePage);
app.use("/register", registerPage);
app.use("/login", loginPage);
app.use((err, req, res, next) => {
    res.render("error", {message: err.message, test: ["mooi","123","oke"]});
});


app.listen(80);
console.log("App is running on port 80");
