const mongoose = require("mongoose");
const postModel = require("../../../models/v1/post");
const commentModel = require("../../../models/v1/comment");

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

const addCommentValidator = yup.object({
  postid: yup.string().required("postId is required"),
  title: yup
    .string()
    .max(2200, "title cannot be more than 2200 chars long !!")
    .required("title is required"),
  content: yup
    .string()
    .max(5000, "content cannot be more than 5000 chars long !!")
    .required("content is required"),
});
const deleteCommentValidator = yup.object({
  commentid: yup.string().required("commentid is required"),
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
  await deletePostValidator.validate(
    {
      postid,
    },
    { abortEarly: false }
  );
  const isValidObjectId = mongoose.Types.ObjectId.isValid(postid);

  if (!isValidObjectId) {
    throw new Error("post id is not valid");
  }
  const post = await postModel.findOne({ _id: postid });
  if (!post) {
    throw new Error("post  is not found");
  }
  const isUserCreator = user._id.toString() == post.user.toString();

  if (!isUserCreator) {
    throw new Error("user is not create this post or is not admin");
  }
  if (user.role !== "ADMIN" && !isUserCreator) {
    throw new Error("user is not create this post or is not admin");
  }
};
const updatePostsAccess = async (req, res) => {
  const { title, description, hashtags, postid } = req.body;
  const user = req.user;

  if (!req.file) {
    throw new Error("enter media is required");
  }
  await createPostValidator.validate(
    {
      title,
      description,
      hashtags,
    },
    { abortEarly: false }
  );
  await deletePostValidator.validate({ postid }, { abortEarly: false });
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
const likeTogglePostsAccess = async (req, res) => {
  const { postid } = req.body;

  await deletePostValidator.validate({ postid }, { abortEarly: false });
  const isValidObjectId = mongoose.Types.ObjectId.isValid(postid);
  if (!isValidObjectId) {
    throw new Error("postid is not valid");
  }
  const post = await postModel.findOne({ _id: postid });
  if (!post) {
    throw new Error("post is not found");
  }
};
const addCommentPostsAccess = async (req, res) => {
  const { postid, title, content } = req.body;
  await addCommentValidator.validate(
    { postid, title, content },
    { abortEarly: false }
  );
  const isValidObjectId = mongoose.Types.ObjectId.isValid(postid);
  if (!isValidObjectId) {
    throw new Error("postid is not valid");
  }
  const post = await postModel.findOne({ _id: postid });
  if (!post) {
    throw new Error("post is not found");
  }
};
const deleteCommentPostValidator = async (req, res) => {
  const { commentid } = req.body;
  const user = req.user;
  await deleteCommentValidator.validate({ commentid }, { abortEarly: false });
  const isValidObjectId = mongoose.Types.ObjectId.isValid(commentid);
  if (!isValidObjectId) {
    throw new Error("postid is not valid");
  }
  const comment = await commentModel.findOne({ _id: commentid });
  if (!comment) {
    throw new Error("comment is not found");
  }
  const isUserCreator = user._id.toString() == comment.userid.toString();

  if (!isUserCreator) {
    throw new Error("user is not create this post or is not admin");
  }
  if (user.role !== "ADMIN") {
    throw new Error("user is not create this post or is not admin");
  }
};
// ->>>>>>>>>>>>>>>>>
module.exports = {
  createPostValidator,
  deletePostValidator,
  createPostAccess,
  searchPostsAccess,
  deletePostsAccess,
  updatePostsAccess,
  likeTogglePostsAccess,
  addCommentPostsAccess,
  deleteCommentPostValidator,
};
