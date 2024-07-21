const mongoose = require("mongoose");
const { errorResponse, successResponse } = require("../../../utils/response");
const postValidator = require("./postValidator");
const postModel = require("../../../models/v1/post");
exports.createPost = async (req, res, next) => {
  try {
    const user = req.user;
    if (user.role !== "ADMIN") {
      errorResponse(res, 401, "user is not admin");
      return;
    }
    const { title, description, hashtags } = req.body;
    await postValidator.createPostValidator.validate(
      { title, description, hashtags },
      { abortEarly: false }
    );

    const tags = hashtags.split(",");
    if (!req.file) {
      errorResponse(res, 401, "media is required");
      return;
    }
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
    errorResponse(res, 409, error.errors);
  }
};
exports.getAllPosts = async (req, res) => {
  try {
    const allPosts = await postModel.find({}, { _id: 0, __v: 0 }).lean();
    successResponse(res, 200, { allPosts });
  } catch (error) {
    errorResponse(res, 409, error.errors);
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
    errorResponse(res, 409, error.errors);
  }
};
exports.searchPosts = async (req, res) => {
  try {
    const query = req.query.query;
    if (!query) {
      errorResponse(res, 409, "please enter  query in your path");
      return;
    }
    const regex = new RegExp(query, "i");
    const resultSearch = await postModel.find({ title: { $regex: regex } });
    successResponse(res, 200, { resultSearch });
  } catch (error) {
    console.log(error);
    errorResponse(res, 409, error.errors);
  }
};
exports.deletePost = async (req, res) => {
  try {
    const user = req.user;
    const { postid } = req.body;
    await postValidator.deletePostValidator.validate({
      postid,
    });
    const isValidObjectId = mongoose.Types.ObjectId.isValid(postid);

    if (!isValidObjectId) {
      return errorResponse(res, 401, "post id is not valid");
    }
    const post = await postModel.findOne({ _id: postid });
    if (!post) {
      return errorResponse(res, 404, "post  is not found");
    }
    const userId = user._id.toString();
    const postCreatorId = post.user.toString();

    if (postCreatorId !== userId || user.role !== "ADMIN") {
      return errorResponse(
        res,
        401,
        "user is not create this post or is not admin"
      );
    }
    const resultPostDelete = await postModel.deleteOne({ _id: postid });
    if (resultPostDelete.deletedCount < 1) {
      return errorResponse(res, 404, "post  is not found");
    }
    successResponse(res, 201, "post deleted");
  } catch (error) {
    console.log(error);
    errorResponse(res, 409, error.errors);
  }
};
