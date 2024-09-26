import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model";
export const verifyJWT = () =>
  asyncHandler(async (req, _, next) => {
    //Since no need for res so _
    try {
      const token =
        req.cookie?.accessToken ||
        req.header("Authorization")?.repalce("Bearer", "");
      if (!token) {
        throw new ApiError(401, "Unauthorized Request");
      }
      const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(decodedToken?._id).select(
        "-password -refreshToken"
      );
      if (!user) {
        throw new ApiError(401, "Invalid Access Token");
      }
      req.user = user;
      next();
    } catch (error) {
      throw new ApiError(401, error?.message || "Invalid Access TOken");
    }
  });
