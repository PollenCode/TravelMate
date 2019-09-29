const express = require("express");
const router = express.Router();

router.get("/", (req, res, next) => {
    var displayName = req.user == null ? null : req.user.email;

    res.render("index", {
        displayName: displayName
    });
});

module.exports = router;