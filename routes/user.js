const express = require("express");
const router = express.Router();
const userModel = require("../models/userModel");
const salter = require("../salter");
const passport = require("passport");

router.post("/register", (req, res, next) => {
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

router.post("/login", passport.authenticate("local", {
    successRedirect: "/api/user/me"
}))

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

// Old methon without passport lib
/*router.post("/login", (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    userModel.findOne({ email: email }, (err, user) => {
        if (err)
            return next(err);  
        if (user == null)
            return next(new Error("User not found."));
        if (!salter.checkPassword(password, user.passwordHash, user.passwordSalt))
            return next(new Error("Incorrect password."));

        res.json({
            status: "ok",
            user: user
        });
    });
});*/

module.exports = router;