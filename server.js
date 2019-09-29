const express = require("express");
const expressSession = require("express-session");
const path = require("path");
const mongoose = require("mongoose");
const passport = require("passport");

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

// Internal pages, these do not have a view
app.use("/api/user", require("./routes/user")); // Contains register/login

/*app.use("/api/register", require("./routes/register.js"));
app.use("/api/login", require("./routes/login.js"));*/

// On next fallthrough, aka errors
app.use((err, req, res, next) => {
    console.log("ERROR: " + err.message);
    res.render("error", { message: err.message });
});


app.listen(80);
console.log("App is running on port 80");
