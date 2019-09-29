const crypto = require("crypto");
const bcrypt = require("bcrypt");

const extraSalt = ",~]wP&HeU2Hva]3J";
const saltLength = 64;
const rounds = 10;

module.exports.checkPassword = function(plain, hashed, withSalt)
{
    return bcrypt.compareSync(plain + extraSalt + withSalt, hashed);
}

module.exports.hashPasswordWithRandomSalt = function(plain)
{
    const passwordSalt = crypto.randomBytes(saltLength / 2).toString('hex'); // Get a salt of 64 chars (in hex notation)
    return {
        hashed: bcrypt.hashSync(plain + extraSalt + passwordSalt, rounds),
        withSalt: passwordSalt
    };
}