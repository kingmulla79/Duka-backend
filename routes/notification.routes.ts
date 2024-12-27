import express from "express";
import { authorizedRoles, isAuthenticated } from "../middleware/Auth";
import {
  DeleteNotifications,
  EditNotification,
  GetAllNotifications,
  GetNotificationByUser,
} from "../controllers/notifications.controller";
import { UserUpdateAccessToken } from "../controllers/user.controller";
const NotificationRouter = express.Router();

NotificationRouter.put(
  "/edit-notification/:id",
  UserUpdateAccessToken,
  isAuthenticated,
  EditNotification
);

NotificationRouter.get(
  "/get-user-notifications",
  UserUpdateAccessToken,
  isAuthenticated,
  GetNotificationByUser
);
NotificationRouter.get(
  "/get-all-notifications",
  UserUpdateAccessToken,
  isAuthenticated,
  GetAllNotifications
);
NotificationRouter.delete(
  "/delete-notification/:id",
  UserUpdateAccessToken,
  isAuthenticated,
  DeleteNotifications
);

export default NotificationRouter;
