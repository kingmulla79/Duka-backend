import express from "express";
import { authorizedRoles, isAuthenticated } from "../middleware/Auth";
import {
  UserActivation,
  UserDeleteUser,
  UserForgotPassword,
  UserGetAllUsersInfo,
  UserGetUserInfo,
  UserLogin,
  UserLogout,
  UserRegistration,
  UserResetMail,
  UserSocialAuth,
  UserUpdateAccessToken,
  UserUpdateInfo,
  UserUpdatePassword,
  UserUpdateProfilePic,
  UserUpdateRole,
} from "../controllers/user.controller";
const UserRouter = express.Router();

UserRouter.post("/register", UserRegistration);
UserRouter.post("/user-activation", UserActivation);
UserRouter.post("/login", UserLogin);
UserRouter.get("/logout", UserUpdateAccessToken, isAuthenticated, UserLogout);
UserRouter.get(
  "/get-user-info",
  UserUpdateAccessToken,
  isAuthenticated,
  UserGetUserInfo
);
UserRouter.get(
  "/get-all-users-info",
  UserUpdateAccessToken,
  isAuthenticated,
  authorizedRoles("admin"),
  UserGetAllUsersInfo
);
UserRouter.post("/social-auth", UserSocialAuth);
UserRouter.put(
  "/update-info",
  UserUpdateAccessToken,
  isAuthenticated,
  UserUpdateInfo
);
UserRouter.put(
  "/update-password",
  UserUpdateAccessToken,
  isAuthenticated,
  UserUpdatePassword
);
UserRouter.put(
  "/update-profile-pic",
  UserUpdateAccessToken,
  isAuthenticated,
  UserUpdateProfilePic
);
UserRouter.put(
  "/update-user-role",
  UserUpdateAccessToken,
  isAuthenticated,
  authorizedRoles("admin"),
  UserUpdateRole
);
UserRouter.delete(
  "/delete-user/:id",
  UserUpdateAccessToken,
  isAuthenticated,
  UserDeleteUser
);
UserRouter.post("/send-reset-email", UserResetMail);
UserRouter.put("/forgot-password/:email", UserForgotPassword);

export default UserRouter;
