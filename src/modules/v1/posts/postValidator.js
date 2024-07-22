const mongoose = require("mongoose");
const postModel = require("../../../models/v1/post");

const yup = require("yup");
const createPostValidator = yup.object({
  title: yup
    .string()
    .max(2200, "title cannot be more than 2200 chars long !!")
    .required("title is required"),
  description: yup
    .string()
    .max(2200, "description cannot be more than 2200 chars long !!")
    .required("Description is required"),
  hashtags: yup.string().required("hashtags is required "),
});
const deletePostValidator = yup.object({
  postid: yup.string().required("postId is required"),
});
const createPostAccess = async (req, res) => {
  const { title, description, hashtags } = req.body;
  await createPostValidator.validate(
    { title, description, hashtags },
    { abortEarly: false }
  );
  if (!req.file) {
    throw new Error("media is required");
  }
};
const searchPostsAccess = (req, res) => {
  const query = req.query.query;
  if (!query) {
    throw new Error("please enter  query in your path");
  }
};
const deletePostsAccess = async (req, res) => {
  const user = req.user;
  const { postid } = req.body;
  await deletePostValidator.validate({
    postid,
  });
  const isValidObjectId = mongoose.Types.ObjectId.isValid(postid);

  if (!isValidObjectId) {
    throw new Error("post id is not valid");
  }
  const post = await postModel.findOne({ _id: postid });
  if (!post) {
    throw new Error("post  is not found");
  }
  const isUserCreator = user._id.toString() == post.user.toString();

  return isUserCreator;
};
const updatePostsAccess = async (req, res) => {
  const { title, description, hashtags, postid } = req.body;
  const user = req.user;

  if (!req.file) {
    throw new Error("enter file is required");
  }
  await createPostValidator.validate(
    {
      title,
      description,
      hashtags,
    },
    { abortEarly: false }
  );
  await deletePostValidator.validate({ postid });
  const isValidObjectId = mongoose.Types.ObjectId.isValid(postid);
  if (!isValidObjectId) {
    throw new Error("post id is not valid");
  }

  const post = await postModel.findOne({ _id: postid });
  if (!post) {
    throw new Error("post is not found");
  }
  const userId = user._id.toString();
  const postCreatorId = post.user.toString();
  if (postCreatorId !== userId) {
    throw new Error("user is not create this post");
  }
};
module.exports = {
  createPostValidator,
  deletePostValidator,
  createPostAccess,
  searchPostsAccess,
  deletePostsAccess,
  updatePostsAccess,
};
