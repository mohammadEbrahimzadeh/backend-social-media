//* Helper function to format success response
const successResponse = (res, statusCode = 200, data) => {
  return res.status(statusCode).json({
    status: statusCode,
    success: true,
    data,
  });
};
//* Helper function to format error response

const errorResponse = (res, statusCode, msg, data) => {
  //console.log({ message, data }); // Log error details ...

  return res
    .status(statusCode)
    .json({ status: statusCode, success: false, error: msg, data });
};
module.exports = { successResponse, errorResponse };
