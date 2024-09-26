import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
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
  const user = await User.findOne({ $or: ["email", "username"] });
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
  // const loggedInUser = await User.findById(user._id).select(
  //   "-password -refreshToken"
  // ); // Because the user we initially got from the database will not have the token we again get the user
  // const options = { httpOnly: true, secure: true };
  // return res
  //   .status(200)
  //   .cookie("accessToken", accessToken, options)
  //   .cookie("refrshToken", refreshToken, options)
  //   .json(ApiResponse(200, ));
});
export { registerUser, loginUser };
