const mongoose = require("mongoose");
const schema = mongoose.Schema(
  {
    postid: {
      type: mongoose.Types.ObjectId,
      ref: "user",
      required: true,
    },
    userid: {
      type: mongoose.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  { timestamps: true }
);
const model = mongoose.model("likeToggle", schema);
module.exports = model;
