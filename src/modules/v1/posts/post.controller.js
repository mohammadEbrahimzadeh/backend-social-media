const { errorResponse } = require("../../../utils/response");
const { createPostValidator } = require("./createPostValidator");

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
      errorResponse(res, 201, "media is required");
    }
    errorResponse(res, 200, "sssss");
  } catch (error) {
    errorResponse(res, 409, error.errors);
  }
};
