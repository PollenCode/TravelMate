const express = require("express");
const router = express.Router();
const salter = require("../salter");
const passport = require("passport");
const util = require("util");
const moment = require("moment");

var mysql = require("mysql");
var connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "8vyD3SR=_uGa5!s*jcXTbFzaV",
  database: "travelmate"
});
 
router.post("/register", (req, res, next) => {
    req.errorPage = "register";

    console.log("req.body:" + util.inspect(req.body));

    var errorMessages = [];
    var problems = [];

    if (!req.body.firstName)
    {
        problems.push("firstName");
        errorMessages.push("Please fill in your first name.");
    }
    if (!req.body.lastName)
    {
        problems.push("lastName");
        errorMessages.push("Please fill in your last name.");
    }
    if (!req.body.password || req.body.password != req.body.passwordCheck)
    {
        problems.push("password");
        problems.push("passwordCheck");
        errorMessages.push("The password check does not match your original password.");
    }
    if (!req.body.dateOfBirth || !moment(req.body).isValid() || moment(req.body).isAfter(moment())) 
    {
        problems.push("dateOfBirth");
        errorMessages.push("The date of birth is not valid.");
    }
    if (!req.body.email || !req.body.email.match(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/igm))
    {
        problems.push("email");
        errorMessages.push("Please enter a valid email address.");
    }
    if (problems.length > 0 || errorMessages.length > 0)
    {
        req.renderOptions.problems = problems;
        var allMessages = " - " + errorMessages.join("<br> - ");
        return next(new Error(allMessages));
    }

    passport.authenticate("localRegister", {
        successRedirect: "/map"
    })(req, res, next);
});

router.post("/login", (req, res, next) => {
    req.errorPage = "login";
    passport.authenticate("localLogin", {
        successRedirect: "/map"
    })(req, res, next);
});

router.get("/me", (req, res, next) => {
    if (req.user == null)
    {
        res.json({
            status: "failed",
            message: "User is not logged in."
        });
    }
    else
    {
        res.json({
            status: "ok",
            user: req.user
        });
    }
});

router.get("/logout", (req, res, next) => {
    req.logout();
    res.json({
        status: "ok",
        message: "User is now logged out."
    });
});

module.exports = router;