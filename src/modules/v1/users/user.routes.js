const express = require("express");
const controller = require("./user.controller");
const router = express.Router();
router.route("/register").post(controller.register);
router.route("/login").post(controller.login);
router.route("/refresh-token").get(controller.refreshToken);
router.route("/update-password").post(controller.updatePassword);
router.route("/forget-password").post(controller.forgetPassword);
router.route("/reset-password").get(controller.resetPassword);

module.exports = router;
