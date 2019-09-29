const express = require("express");
const expressSession = require("express-session");
const path = require("path");
const util = require("util");
const mongoose = require("mongoose");
const passport = require("passport");

const authorizer = require("./authorizer");
authorizer.setupLocalLogin(passport);

mongoose.connect("mongodb://localhost/travelmate", (err, data) => {
    if (err)
        console.log("Database connection failed!");
    else
        console.log("Database connection succeed!");
});

global.appRoot = path.resolve(__dirname);

const app = express();
app.set("views", path.join(__dirname, 'views'));
app.set("view engine", "twig");
app.use(expressSession({
    secret: "r!?N&Q6$8%Xg5J3s",
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize()); // Initialize passport library
app.use(passport.session()); // And tell it to use sessions
app.use(express.static(path.join(__dirname, "public"))); // Set the static resource location to the public directory
app.use(express.json()); // Enable json serializer
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
    req.errorPage = "error"; // Set a default error page view for every request following 
    next();
});
// Actual pages with views in './views'
const indexPage = require("./routes/index.js");
app.use("/", indexPage);
app.use("/home", indexPage);
app.use("/index", indexPage);
app.use("/register", (req, res, next) => {
    res.render("register", null);
});
app.use("/login", (req, res, next) => {
    res.render("login", null);
});
app.use("/contact", (req, res, next) => {
    res.render("contact", null);
});
app.use("/createError", (req, res, next) => {
    next(new Error(req.query.message));
});

// Internal pages, these do not have a view
app.use("/api/user", require("./routes/user")); // Contains register, login, me, logout

// On next fallthrough, aka errors
app.use((err, req, res, next) => {

    var message = err.message;
    var title = "Error!"

    var i = message.indexOf(":");
    if (i >= 0)
    {
        title = message.substring(0, i);
        message = message.substring(i + 1);
    }
    message = message || "No description"

    console.log(util.format("[Error/%s] %s", title, message));

    res.render(req.errorPage, { 
        errorMessage: message, 
        errorMessageTitle: title 
    });
});


app.listen(80);
console.log("App is running on port 80");
