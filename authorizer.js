const LocalStrategy = require("passport-local").Strategy;
const userModel = require("./models/userModel");
const salter = require("./salter");

module.exports.setupLocalLogin = function(passport) {

    passport.serializeUser((user, next) => {
        console.log("user: " + user);
        next(null, user);
    });
    passport.deserializeUser((id, next) => {
        userModel.findById(id, (err, user) => {
            next(err, user);
        });
    });

    const localLogin = new LocalStrategy({
        usernameField: "email",
        passwordField: "password",
        passReqToCallback: true
    }, (req, email, password, next) => {

        userModel.findOne({ email: email }, (err, user) => {
            if (err)
                return next(err);  
            if (user == null)
                return next(new Error("User not found."));
            if (!salter.checkPassword(password, user.passwordHash, user.passwordSalt))
                return next(new Error("Incorrect password."));
    
            return next(null, user);
        });
    });

    passport.use("local", localLogin);
};