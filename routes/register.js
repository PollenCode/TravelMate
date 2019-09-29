const express = require("express");
const router = express.Router();
const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const salter = require("../salter");



router.post("/", (req, res, next) => {

    
    /*const passwordSalt = crypto.randomBytes(32).toString('hex'); 
    const passwordExtraSalt = ",~]wP&HeU2Hva]3J";
    const passwordHash = bcrypt.hashSync(password + passwordExtraSalt + passwordSalt, 10);*/

    

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