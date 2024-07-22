const fs = require("fs");

const { errorResponse, successResponse } = require("../../../utils/response");
const {
  createPostAccess,
  searchPostsAccess,
  deletePostsAccess,
  updatePostsAccess,
  likeTogglePostsAccess,
} = require("./postValidator");
const postModel = require("../../../models/v1/post");
const likeToggleModel = require("../../../models/v1/likeToggle");

// ------------------->
exports.createPost = async (req, res) => {
  try {
    const user = req.user;
    const { title, description, hashtags } = req.body;
    await createPostAccess(req, res);
    const tags = hashtags.split(",");
    const mediaUrlPath = `images/posts/${req.file.filename}`;
    const post = new postModel({
      media: {
        path: mediaUrlPath,
        filename: req.file.filename,
      },
      title,
      description,
      hashtags: tags,
      user: user._id,
    });
    await post.save();
    successResponse(res, 201, { msg: "post created", post });
  } catch (error) {
    console.log(error);
    return errorResponse(res, 409, error.message);
  }
};
exports.getAllPosts = async (req, res) => {
  try {
    const allPosts = await postModel.find({}, { _id: 0, __v: 0 }).lean();
    successResponse(res, 200, { allPosts });
  } catch (error) {
    errorResponse(res, 409, error.message);
  }
};
exports.myPosts = async (req, res) => {
  try {
    const user = req.user;
    const allPosts = await postModel
      .find({ user: user._id }, { _id: 0, __v: 0, user: 0 })
      .lean();
    successResponse(res, 200, { allPosts });
  } catch (error) {
    errorResponse(res, 409, error.message);
  }
};
exports.searchPosts = async (req, res) => {
  try {
    const query = req.query.query;
    searchPostsAccess(req, res);
    const regex = new RegExp(query, "i");
    const resultSearch = await postModel.find({ title: { $regex: regex } });
    successResponse(res, 200, { resultSearch });
  } catch (error) {
    console.log(error);
    errorResponse(res, 409, error.message);
  }
};
exports.deletePost = async (req, res) => {
  try {
    const user = req.user;
    const { postid } = req.body;
    const isUserCreator = await deletePostsAccess(req, res);
    if (isUserCreator || user.role == "ADMIN") {
      const resultPostDelete = await postModel.deleteOne({ _id: postid });
      if (resultPostDelete.deletedCount < 1) {
        return errorResponse(res, 404, "post  is not found");
      }
      successResponse(res, 201, "post deleted");
    } else {
      errorResponse(res, 401, "user is not create this post or is not admin");
    }
  } catch (error) {
    console.log(error);
    errorResponse(res, 409, error.message);
  }
};
exports.updatePost = async (req, res) => {
  try {
    const { title, description, hashtags } = req.body;
    const user = req.user;
    await updatePostsAccess(req, res);
    const mediaUrlPath = `images/posts/${req.file.filename}`;
    const tags = hashtags.split(",");

    await postModel.findOneAndUpdate(
      { _id: req.body.postid },
      {
        media: {
          path: mediaUrlPath,
          filename: req.file.filename,
        },
        title,
        description,
        hashtags: tags,
        user: user._id,
      }
    );
    successResponse(res, 201, "post updated");
  } catch (error) {
    const mediaUrlPath = `public/images/posts/${req.file.filename}`;
    fs.unlink(mediaUrlPath, (err) => {
      if (err) {
        console.error(err);
        return;
      }
    });

    errorResponse(res, 409, error.message);
  }
};
exports.likeToggle = async (req, res) => {
  try {
    const user = req.user;
    const { postid } = req.body;
    await likeTogglePostsAccess(req, res);
    const likeToggleRecord = await likeToggleModel.findOne({
      userid: user._id,
      postid,
    });
    // ----------
    if (likeToggleRecord) {
      await likeToggleModel.deleteOne({
        userid: user._id,
        postid,
      });

      successResponse(res, 201, "post is disLiked");
    } else {
      const record = new likeToggleModel({
        userid: user._id,
        postid,
      });
      await record.save();
      successResponse(res, 201, "post is liked");
    }
  } catch (error) {
    errorResponse(res, 409, error.message);
  }
};
