const mongoose = require("mongoose");

const userModel = mongoose.Schema({
    email: {type: String},
    passwordHash: {type: String},
    passwordSalt: {type: String}
});

module.exports = mongoose.model("userModel", userModel);