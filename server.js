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

global.appRoot = path.resolve(__dirname);

const app = express();
app.set("views", path.join(__dirname, 'views'));
app.set("view engine", "twig");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));



// Actual pages with views in './views'
const indexPage = require("./routes/index.js");
app.use("/", indexPage);
app.use("/home", indexPage);
app.use("/register", (req, res, next) => {
    res.sendFile(path.join(appRoot, "views", "register.html"));
});

// Internal pages, these do not have a view
app.use("/internal/register", require("./routes/register.js"));
app.use("/internal/login", require("./routes/login.js"));

// On next fallthrough, aka errors
app.use((err, req, res, next) => {
    res.render("error", {message: err.message, test: ["mooi","123","oke"]});
});


app.listen(80);
console.log("App is running on port 80");
