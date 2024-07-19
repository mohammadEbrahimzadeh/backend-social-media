const yup = require("yup");
exports.createPostValidator = yup.object({
  description: yup
    .string()
    .max(2200, "description cannot be more than 2200 chars long !!")
    .required("Description is required"),
  hashtags: yup.string().required("hashtags is required "),
});
