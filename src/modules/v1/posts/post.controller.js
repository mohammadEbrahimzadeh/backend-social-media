const { errorResponse, successResponse } = require("../../../utils/response");
const { createPostValidator } = require("./createPostValidator");
const postModel = require("../../../models/v1/post");
exports.createPost = async (req, res, next) => {
  try {
    const { description, hashtags } = req.body;
    await createPostValidator.validate(
      { description, hashtags },
      { abortEarly: false }
    );
    const user = req.user;
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
      description: description,
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
