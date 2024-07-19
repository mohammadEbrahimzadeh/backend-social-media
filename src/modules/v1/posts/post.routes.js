const express = require("express");
const controller = require("./post.controller");
const auth = require("../../../middlewares/v1/auth");
const { multerStorage } = require("../../../middlewares/uploaderConfigs");
const upload = multerStorage(
  "public/images/posts",
  /png|jpeg|jpg|webp|mp4|mkv/
);
const router = express.Router();
router
  .route("/create-post")
  .post(
    auth,
    upload.fields([{ name: "cover", maxCount: 1 }]),
    controller.createPost
  );

module.exports = router;
