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
  .post(auth, upload.single("media"), controller.createPost);
router.route("/get-all-posts").get(auth, controller.getAllPosts);
router.route("/my-posts").get(auth, controller.myPosts);
router.route("/search-posts/").get(auth, controller.searchPosts);
module.exports = router;
