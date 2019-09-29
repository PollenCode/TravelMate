const express = require("express");
const router = express.Router();
const userModel = require("../models/userModel");
const salter = require("../salter");
const passport = require("passport");

router.post("/register", (req, res, next) => {
    req.errorPage = "register";
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