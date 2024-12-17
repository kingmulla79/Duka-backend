import express from "express";
import { authorizedRoles, isAuthenticated } from "../middleware/Auth";
import {
  DeleteComment,
  EditComment,
  FetchCommentsByAUser,
  FetchCommentsForASingleProduct,
  NewComment,
} from "../controllers/comments.controller";
import { UserUpdateAccessToken } from "../controllers/user.controller";
const CommentRouter = express.Router();

CommentRouter.post(
  "/new-comment",
  UserUpdateAccessToken,
  isAuthenticated,
  NewComment
);
CommentRouter.put(
  "/edit-comment/:comment_id",
  UserUpdateAccessToken,
  isAuthenticated,
  EditComment
);
CommentRouter.get(
  "/get-product-comments/:product_id",
  UserUpdateAccessToken,
  isAuthenticated,
  FetchCommentsForASingleProduct
);
CommentRouter.get(
  "/get-user-comments/:user_id",
  UserUpdateAccessToken,
  isAuthenticated,
  FetchCommentsByAUser
);

CommentRouter.delete(
  "/delete-comment/:comment_id",
  UserUpdateAccessToken,
  isAuthenticated,
  DeleteComment
);

export default CommentRouter;
