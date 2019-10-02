const express = require("express");
const router = express.Router();
const userModel = require("../models/userModel");
const salter = require("../salter");
const passport = require("passport");
const util = require("util");

router.post("/register", (req, res, next) => {
    req.errorPage = "register";

    console.log(util.inspect(req.body));

    if (!res.body.email ||
        !res.body.password)
    {
        return next(new Error("Please enter all required fields"));
    }

    if (!res.body.email.match(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/igm))
    {
        return next(new Error("Please enter a valid email"));
    }
       

    console.log("Finding user...");
    userModel.findOne({ email: req.body.email }, (err, user) =>
    {
        if (err)
            return next(err);
        if (user != null)
            return next(new Error("A user with that email already exists."));
        
        const hashedPassword = salter.hashPasswordWithRandomSalt(req.body.password);

        userModel.create({
            email: req.body.email,
            passwordHash: hashedPassword.hashed,
            passwordSalt: hashedPassword.withSalt
        }, (err, data) => {
            if (err)
                return next(err);

            res.json({
                status: "ok",
                user: data
            });
        });
    });
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