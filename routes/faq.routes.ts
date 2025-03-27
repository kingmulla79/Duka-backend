import express from "express";
import { authorizedRoles, isAuthenticated } from "../middleware/Auth";
import { UserUpdateAccessToken } from "../controllers/user.controller";
import {
  DeleteFAQ,
  EditFAQ,
  FetchFAQs,
  NewFAQ,
} from "../controllers/faq.controller";
const FAQRouter = express.Router();

FAQRouter.post(
  "/new-faq",
  UserUpdateAccessToken,
  isAuthenticated,
  authorizedRoles("admin"),
  NewFAQ
);
FAQRouter.put(
  "/edit-faq/:faq_id",
  UserUpdateAccessToken,
  isAuthenticated,
  authorizedRoles("admin"),
  EditFAQ
);
FAQRouter.get("/get-faqs", FetchFAQs);

FAQRouter.delete(
  "/delete-faq/:faq_id",
  UserUpdateAccessToken,
  isAuthenticated,
  authorizedRoles("admin"),
  DeleteFAQ
);

export default FAQRouter;
