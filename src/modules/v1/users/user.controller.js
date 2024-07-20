const {
  registerUserVakidator,
  logInUserValidator,
  updatePasswordValidator,
  forGetPasswordValidator,
  resetPasswordValidator,
} = require("./user.validation");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const userModel = require("../../../models/v1/user");
const RefreshTokenModel = require("../../../models/v1/refreshToken");
const { successResponse, errorResponse } = require("../../../utils/response");
const {
  accessTokenCreator,
  accessTokenExpiredTimeValidator,
} = require("../../../utils/jwtCreator");
const nodeMailer = require("nodemailer");

const forgetPasswordModel = require("../../../models/v1/forgetPassword");

// ------>

exports.register = async (req, res) => {
  const { email, username, name, password, confirmPassword } = req.body;
  try {
    await registerUserVakidator.validate(
      {
        email,
        username,
        name,
        password,
        confirmPassword,
      },
      {
        abortEarly: false,
      }
    );

    const isUserExist = await userModel
      .findOne({
        $or: [{ email }, { username }],
      })
      .lean();
    if (isUserExist) {
      return errorResponse(res, 409, "email or password is exist", {
        email,
        username,
        name,
      });
      // return res.status(409).json({ msg: `email or password is exist` });
    }
    const isFirstUser = (await userModel.countDocuments()) === 0;

    // --------------
    let user = new userModel({
      email,
      username,
      name,
      password,
      role: isFirstUser ? "ADMIN" : "USER",
    });
    user = await user.save();
    const accessToken = accessTokenCreator(user, "30s");
    const refreshToken = await RefreshTokenModel.createToken(user);

    res.cookie("access-token", accessToken, {
      maxAge: 900_000,
      httpOnly: true,
    });
    res.cookie("refresh-token", refreshToken, {
      maxAge: 900_000,
      httpOnly: true,
    });
    return successResponse(res, 201, {
      message: "User created successfully :))",
      user: { ...user.toObject(), password: undefined, accessToken },
    });
  } catch (error) {
    return errorResponse(res, 409, error.errors, {
      email,
      username,
      name,
      password,
      confirmPassword,
    });
  }
};
exports.login = async (req, res) => {
  const { identity, password } = req.body;
  try {
    await logInUserValidator.validate({ identity, password });
    const user = await userModel
      .findOne({ $or: [{ email: identity }, { username: identity }] })
      .lean();
    if (!user) {
      return errorResponse(res, 404, "user not found", {
        identity,
      });
    }
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return errorResponse(res, 401, "email or password is not true", {
        identity,
      });
    }

    const accessToken = accessTokenCreator(user, "30d");

    const refreshToken = await RefreshTokenModel.createToken(user);
    res.cookie("access-token", accessToken, {
      maxAge: 900_000,
      httpOnly: true,
    });
    res.cookie("refresh-token", refreshToken, {
      maxAge: 900_000,
      httpOnly: true,
    });

    return successResponse(res, 200, {
      message: "User login successfully :))",
      data: { ...user, password: undefined, accessToken },
    });
  } catch (error) {
    console.log(error);
    return errorResponse(res, 409, error.errors, {
      identity,
      password,
    });
  }
};
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  try {
    const userId = await RefreshTokenModel.verifyToken(refreshToken);
    if (!userId) {
      return errorResponse(
        res,
        401,
        "refresh token not found or expier please login",
        { refreshToken }
      );
    }
    // delete refresh token doc in modele refresh token
    await RefreshTokenModel.findOneAndDelete({ token: refreshToken });
    const user = await userModel.findOne({ _id: userId });
    if (!user) {
      return errorResponse(res, 404, "user token not found  please login", {
        userId,
      });
    }
    const accessToken = accessTokenCreator(user, "30s");
    const newRefreshToken = await RefreshTokenModel.createToken(user);

    res.cookie("access-token", accessToken, {
      maxAge: 900_000,
      httpOnly: true,
    });
    res.cookie("refresh-token", newRefreshToken, {
      maxAge: 900_000,
      httpOnly: true,
    });
    return successResponse(res, 201, {
      message: "new access token is set",
      accessToken,
    });
  } catch (error) {
    console.log(error);
    return errorResponse(res, 409, error, { refreshToken });
  }
};
exports.updatePassword = async (req, res) => {
  const { pervPassword, newPassword, newConfrimPassword } = req.body;
  try {
    const authorizationHeader = req.headers.authorization;
    await updatePasswordValidator.validate(
      {
        pervPassword,
        newPassword,
        newConfrimPassword,
        authorizationHeader,
      },
      { abortEarly: false }
    );
    const decodedPayloadJwt =
      accessTokenExpiredTimeValidator(authorizationHeader);
    const userId = decodedPayloadJwt.userId;

    let user = await userModel.findOne({ _id: userId });
    const isPasswordMatch = await bcrypt.compare(pervPassword, user.password);
    if (!isPasswordMatch) {
      return errorResponse(res, 401, " pervPassword is not match", {
        pervPassword,
      });
    }
    user.password = newPassword;
    user = await user.save();

    return successResponse(res, 200, {
      message: "reset password is  successfully",
      user: { ...user.toObject(), password: undefined },
    });
  } catch (error) {
    console.log(error);
    return errorResponse(res, 409, error, {});
  }
};
exports.forgetPassword = async (req, res) => {
  const { email } = req.body;
  try {
    await forGetPasswordValidator.validate({ email: email });
    const user = await userModel.findOne({ email });
    if (!user) {
      return errorResponse(res, 404, "user not found", email);
    }
    const resetPassordToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpireTime = Date.now() + 60000 * 120;
    let forgetPasswordDataInDb = new forgetPasswordModel({
      user: user._id,
      token: resetPassordToken,
      tokenExpireTime: resetTokenExpireTime,
    });

    forgetPasswordDataInDb = await forgetPasswordDataInDb.save();
    const transporter = nodeMailer.createTransport({
      service: "gmail",
      auth: {
        user: "irantv70@gmail.com",
        pass: "jxrg txiu qbcf nbkd",
      },
    });
    const mailOptions = {
      from: "irantv70@gmail.com",
      to: email,
      subject: "Reset Password Link For Your Social account",
      html: `
       <h2>your link for reset password:</h2>
       <p>http://localhost:${process.env.PORT}/reset-password/?token=${resetPassordToken}</p>
       `,
    };
    transporter.sendMail(mailOptions);

    return successResponse(res, 200, {
      message: " Password reset email sent successfully",
      data: email,
    });
  } catch (error) {
    console.log(error);
    return errorResponse(res, 409, error, {});
  }
};
exports.resetPassword = async (req, res) => {
  const { token, new_password } = req.body;

  try {
    await resetPasswordValidator.validate(
      { token, new_password },
      { abortEarly: false }
    );
    const resultResetSearchTokenInDb = await forgetPasswordModel.findOne({
      token,
      tokenExpireTime: { $gt: Date.now() },
    });
    if (!resultResetSearchTokenInDb) {
      return errorResponse(res, 401, "token not valid or expierd", { token });
    }
    const user = await userModel.findOne({
      _id: resultResetSearchTokenInDb.user,
    });
    if (!user) {
      return errorResponse(res, 401, "user not found", {
        userId: resultResetSearchTokenInDb.user,
      });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);

    await userModel.findOneAndUpdate(
      { _id: user._id },
      { password: hashedPassword }
    );

    await forgetPasswordModel.findOneAndDelete({
      _id: resultResetSearchTokenInDb._id,
    });
    // -----
    return successResponse(res, 200, {
      message: "successfully",
      data: "",
    });
  } catch (error) {
    console.log(error);
    return errorResponse(res, 409, error, {});
  }
};
