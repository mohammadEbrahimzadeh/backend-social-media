const { errorResponse } = require("../../../utils/response");

exports.createPost = async (req, res, next) => {
  try {
    errorResponse(res, 200, "sssss");
  } catch (error) {
    console.log(error);
    // next(error);
    // errorResponse(res, 500, error);
  }
};
