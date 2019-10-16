const express = require("express");
const router = express.Router();
const salter = require("../salter");
const passport = require("passport");
const util = require("util");

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

    if (!req.body.email || !req.body.password || !req.body.firstName || !req.body.lastName || !req.body.password || !req.body.passwordCheck)
        return next(new Error("Please fill in all required fields"));
    if (req.body.password != req.body.passwordCheck)
        return next(new Error("The password check does not match your original password."));
    if (!req.body.email.match(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/igm))
        return next(new Error("Please enter a valid email"));
       
    req.errorPage = "register";
    passport.authenticate("localRegister", {
        successRedirect: "/index"
    })(req, res, next);
});

router.post("/login", (req, res, next) => {
    req.errorPage = "login";
    passport.authenticate("localLogin", {
        successRedirect: "/index"
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