const express = require("express");
const router = express.Router();
const userModel = require("../models/userModel");

const salter = require("../salter");

console.info("registereen");

router.post("/", (req, res, next) => {
    userModel.findOne({ email: req.body.email }, (err, user) =>
    {
        if (err)
            return next(err);
        if (user != null)
            return new Error("A user with that email already exists.");

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

module.exports = router