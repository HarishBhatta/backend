import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
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

export { registerUser };
