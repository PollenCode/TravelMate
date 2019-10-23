const LocalStrategy = require("passport-local").Strategy;
const salter = require("./salter");
const util = require("util");

var mysql = require("mysql");
var connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "8vyD3SR=_uGa5!s*jcXTbFzaV",
  database: "travelmate"
});

function createUserFromRow(sqlResults)
{
    var userObject = {};
    for(var v in sqlResults[0])
        userObject[v] = sqlResults[0][v];
    return userObject;
}

module.exports.setupPassport = function(passport) {

    passport.serializeUser((user, next) => {
        next(null, user.id);
    });
    passport.deserializeUser((id, next) => {
        if (connection.query("SELECT * FROM users WHERE id = ?", [id], (error, results, fields) => {
            return next(null, createUserFromRow(results));
        }));
    });

    const localLogin = new LocalStrategy({
        usernameField: "email",
        passwordField: "password",
        passReqToCallback: true
    }, (req, email, password, next) => {

        if (connection.query("SELECT * FROM users WHERE email = ?", [email], (error, results, fields) => {

            if (error)
                return next(error, null);
            if (results.length != 1)
                return next(new Error("User not found."));
            if (!salter.checkPassword(password, results[0].passwordHash, results[0].passwordSalt))
                return next(new Error("Incorrect password."));

            return next(null, createUserFromRow(results));
        }));
    });

    /*const localFastLogin = new LocalStrategy({
        usernameField: "email",
        passwordField: "pinHash",
        passReqToCallback: true
    }, (req, email, pinHash, next) => {
        TODO log in with passcode
    });*/

    const localRegister = new LocalStrategy({
        usernameField: "email",
        passwordField: "password",
        passReqToCallback: true
    }, (req, email, password, next) => {

        if (connection.query("SELECT * FROM users WHERE email = ?", [email], (error, results, fields) => {

            if (error)
                return next(error);
            if (results.length != 0)
                return next(new Error("A user with this email already exists."));
    
            const hashedPassword = salter.hashPasswordWithRandomSalt(password);
            var userRecord = [req.body.email, hashedPassword.hashed, hashedPassword.withSalt, req.body.firstName, req.body.lastName];
    
            if (connection.query("INSERT INTO users(email,passwordHash,passwordSalt,firstName,lastName) VALUES(?,?,?,?,?)", userRecord, (error, results, fields) => {

                if (error)
                    return next(error);
    
                if (connection.query("SELECT * FROM users WHERE id = ?", [results.insertId], (error, results, fields) => {

                    if (error)
                        return next(error);
                    if (results.length != 1)
                        return new Error("Could not gather user information.");

                    return next(null, createUserFromRow(results));
                }));
            }));
        }));
    });

    passport.use("localLogin", localLogin);
    passport.use("localRegister", localRegister);
};