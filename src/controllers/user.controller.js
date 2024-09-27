import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh tokens"
    );
  }
};
const registerUser = asyncHandler(async (req, res) => {
  // Get the data from the user
  //Check if the user already exists
  //Check if the values are correct
  //Check for images
  //Upload to cloudinary.
  // create user object.
  //create entry in the database
  // remove password and refresh token from response fields
  // check for user creation
  // return response
  const { fullName, email, userName, password } = req.body;
  if (
    [fullName, email, userName, password].some((field) => field?.trim === "")
  ) {
    throw new ApiError(400, "All Fields Are Required");
  } else if (!email.includes("@")) {
    throw new ApiError(400, "Please provide valid email type");
  } else if (
    await User.findOne({
      $or: [{ email }, { userName }],
    })
  ) {
    throw new ApiError(
      409,
      "User Already Exists with the provided username or email"
    );
  }
  const avatarLocalPath = req.files?.avatar[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }
  const user = await User.create({
    fullName,
    email,
    password,
    userName: userName.toLowerCase(),
    avatar: avatar.url,
    coverImage: coverImage?.url || "", //Checks if cover image is present or not
  });
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken" // Removes password and refresh token from user
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }
  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User Registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //Get user data
  //Verify user data
  //Compare user data with the data in database
  //if user doesnot exist user does not exist
  // if credential error send error
  //if credential match generate token and send it to the user

  const { email, password, userName } = req.body;
  if (!userName && !email) {
    throw new ApiError(400, "Username or email is required");
  }
  const user = await User.findOne({ $or: [{ email }, { userName }] });

  // try {
  // } catch (error) {
  //   console.log("There occurred an error when getting user", error);
  // }
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Password is not valid");
  }
  const { refreshToken, accessToken } = await generateAccessAndRefreshToken(
    user._id
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  ); // Because the user we initially got from the database will not have the token we again get the user
  const options = { httpOnly: true, secure: true };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refrshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

const logOutUser = asyncHandler(async (req, res) => {
  console.log("This is logout");
  const user = await User.findByIdAndUpdate(
    req._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    { new: true } // This causes the return value to be the one that is updated. i.e refreshToken: undefined
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized Access");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }
    if (incomingRefreshToken === user?.refreshToken) {
      throw new ApiError(
        401,
        "Refresh access token is expired or already used"
      );
    }
    const accessToken = (await generateAccessAndRefreshToken(user?._id))
      .accessToken;
    const newRefreshToken = (await generateAccessAndRefreshToken(user?._id))
      .refreshToken;
    const options = {
      httpOnly: true,
      secure: true,
    };
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, "Invalid Refresh Token");
  }
});

const changeCurrentUserPassword = asyncHandler(async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) {
      throw new ApiError(400, "Incorrect Password");
    }
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });
    return res
      .status(200)
      .json(new ApiResponse(200, "Password Changed Successfully"));
  } catch (error) {
    throw error;
  }
});

const getCurrentUser = asyncHandler(async (req, res) => {
  try {
    const user = req.user;
    return res
      .status(200)
      .json(new ApiResponse(200, user, "User fetched successfully"));
  } catch (error) {
    throw error;
  }
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  try {
    const { fullName, email } = req.body;
    if (!fullName && !email) {
      throw new ApiError(400, "All fields are required");
    }
    const user = User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          fullName,
          email,
        },
      },
      { new: true }
    ).select("-password");
    return res
      .status(200)
      .json(new ApiResponse(200, user, "User Details Updated"));
  } catch (error) {
    throw error;
  }
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");
  if (!user) {
    throw new ApiError(500, "Error occured when pushing file to the database");
  }
  return res.status(200).json(new ApiResponse(200, "User Avatar Updated"));
});
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImage = req.file?.path;
  if (!coverImage) {
    throw new ApiError(400, "Cover image is missing");
  }
  const newCoverImage = uploadOnCloudinary(coverImage);
  if (!newCoverImage) {
    throw new ApiError(
      400,
      "Error occurred while uploading file on cloudinary"
    );
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { coverImage: newCoverImage } },
    { new: true }
  );
  if (!user) {
    throw new ApiError(
      500,
      "Error occurred when pushing the file to the database"
    );
  }
  return res
    .status(200)
    .json(new ApiResponse(200, "Cover image uploaded successfully"));
});
export {
  registerUser,
  loginUser,
  logOutUser,
  refreshAccessToken,
  changeCurrentUserPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
};
