const express = require("express");
const router = express.Router();

router.get("/", (req, res, next) => {

    req.query.displayName = req.user == null ? null : req.user.email;
    res.render("index", req.query);
});

module.exports = router;