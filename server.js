const express = require("express");
const expressSession = require("express-session");
const path = require("path");
const util = require("util");
const passport = require("passport");
const cmd = require("node-cmd");

const authorizer = require("./authorizer");
authorizer.setupPassport(passport);

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
    req.renderOptions = {}
    req.renderOptions.persist = {}

    if (req.body)
        req.renderOptions.persist = req.body;

    next();
});

// Actual pages with views in './views'
const indexPage = require("./routes/index.js");
app.use("/", indexPage);
app.use("/home", indexPage);
app.use("/index", indexPage);
app.get("/register", (req, res, next) => {
    res.render("register", req.renderOptions);
});
app.get("/login", (req, res, next) => {
    res.render("login", req.renderOptions);
});
app.get("/contact", (req, res, next) => {
    res.render("contact", req.renderOptions);
});
app.get("/map", (req, res, next) => {
    res.render("map", null);
});
app.get("/account", (req, res, next) => {
    res.render("account", null);
});
app.get("/friends", (req, res, next) => {
    res.render("friends", null);
});
app.get("/development/createError", (req, res, next) => {
    next(new Error(req.query.message));
});
app.post("/development/gitupdate", (req, res, next) => {
    console.log("[GitHub] Received git change. Pulling...");
    cmd.get("git pull", (err, data, stderr) => console.log(data));
});

// Internal pages, these do not have a view
app.use("/api/user", require("./routes/user")); // Contains register, login, me, logout
app.post("/api/contact", (req, res, next) => {

    console.log("Contact form submitted: " + util.inspect(req.body));
    res.render("contact", req.renderOptions);
});

// On next fallthrough, aka errors
app.use((err, req, res, next) => {

    var message = err.message;
    var title = "Error!";

    var i = message.indexOf(":");
    if (i >= 0)
    {
        title = message.substring(0, i);
        message = message.substring(i + 1);
    }
    message = message || "No description";

    console.log(util.format("[Error/%s] %s", title, message));
    
    req.renderOptions.errorMessage = message;
    req.renderOptions.errorMessageTitle = title;

    res.render(req.errorPage, req.renderOptions);
});


app.listen(80);
console.log("App is running on port 80");
