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

    if (!req.body.email || !req.body.password)
        return next(new Error("Please enter all required fields"));
    if (!req.body.email.match(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/igm))
        return next(new Error("Please enter a valid email"));
       
    if (connection.query("SELECT * FROM users WHERE email = ?", [req.body.email], (error, results, fields) => {

        if (error)
            return next(error);
        if (results.length != 0)
            return next(new Error("A user with this email already exists."));

        const hashedPassword = salter.hashPasswordWithRandomSalt(req.body.password);
        var userRecord = [req.body.email, hashedPassword.hashed, hashedPassword.withSalt, req.body.firstName, req.body.lastName];

        if (connection.query("INSERT INTO users(email,passwordHash,passwordSalt,firstName,lastName) VALUES(?,?,?,?,?)", userRecord, (error, results, fields) => {
            if (error)
                return next(error);

            res.json({
                status: "ok",
                user: fields
            });
            return;
        }));
    }));
});

router.post("/login", (req, res, next) => {
    req.errorPage = "login";
    passport.authenticate("local", {
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