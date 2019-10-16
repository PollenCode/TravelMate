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
 

module.exports.setupLocalLogin = function(passport) {

    passport.serializeUser((user, next) => {
        next(null, user.id);
    });
    passport.deserializeUser((id, next) => {
        if (connection.query("SELECT * FROM users WHERE id = ?", [id], (error, results, fields) => {
            
            if (error)
                return next(error);
            if (results.length != 1)
                return next(new Error("Cannot deserialize user: there was none."));

            return next(null, fields);
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

            console.log("login: " + util.inspect(results[0]));

            var userObject = {
                password: password
            };
            for(var v in results[0])
                userObject[v] = results[0][v];

            console.log("userObject: " + util.inspect(userObject));

            return next(null, userObject);
        }));
    });

    passport.use("local", localLogin);
};