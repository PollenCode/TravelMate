const express = require("express");
const router = express.Router();
const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");

const salter = require("../salter");

router.post("/", (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    userModel.findOne({ email: email }, (err, user) => {
        if (err)
            return next(err);  
        if (user == null)
            return next(new Error("User not found."));
        if (!salter.checkPassword(password, user.passwordHash, user.passwordSalt))
            return next(new Error("Incorrect password."));
        /*if (!bcrypt.compareSync(password + passwordExtraSalt + users[0].passwordSalt, users[0].passwordHash))
            return next(new Error("Incorrect password."));*/

        res.json({
            status: "ok",
            user: user
        });
    });
});

module.exports = router;