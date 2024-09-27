import { Router } from "express";
import {
  changeCurrentUserPassword,
  getCurrentUser,
  loginUser,
  logOutUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

// Secoured Routes
router.route("/logout").post(verifyJWT, logOutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").patch(verifyJWT, changeCurrentUserPassword);
router.route("/get-user").get(verifyJWT, getCurrentUser);
router.route("/update-details").patch(verifyJWT, updateAccountDetails);
router
  .route("/update-avatar")
  .patch(verifyJWT, upload.single({ name: "avatar" }), updateUserAvatar);
router
  .route("/update-coverimage")
  .patch(
    verifyJWT,
    upload.single({ name: "coverImage" }),
    updateUserCoverImage
  );
export default router;
