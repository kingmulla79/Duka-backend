import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/Errorhandler";
import { CatchAsyncError } from "../middleware/CatchAsyncErrors";
import { pool } from "../utils/Database";
import IComments from "../models/comments.model";

const CommentQuery = (user_id: number, product_id: number) => {
  return new Promise((resolve, reject) => {
    pool.query(
      `SELECT * FROM comments WHERE user_id = ?`,
      [user_id],
      (err: any, results: Array<any>) => {
        if (err) {
          return reject(new ErrorHandler(err.message, 500));
        }

        results.forEach((result) => {
          console.log(result);
          if (result.product_id.toString() === product_id.toString()) {
            return reject(
              new ErrorHandler(
                `The user already has a comment for this product`,
                422
              )
            );
          }
        });
        resolve(results);
      }
    );
  });
};

export const NewComment = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { comments, rating, product_id }: IComments = req.body;
      const user_id = req.user?.id;

      await CommentQuery(user_id, product_id);

      pool.query(
        `INSERT INTO comments (comments, rating, product_id, user_id) VALUES (?, ?, ?, ?)`,
        [comments, rating, product_id, user_id],
        (err: any, results: any) => {
          if (err) {
            return next(new ErrorHandler(err.message, 500));
          }
          if (results) {
            res.status(201).json({
              success: true,
              message: "Comment successfully created",
            });
          }
        }
      );
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500));
    }
  }
);

export const EditComment = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { comment_id } = req.params;
      let { comments, rating } = req.body;
      pool.query(
        `SELECT * FROM comments WHERE comment_id = ?`,
        [comment_id],
        (err: any, results: Array<any>) => {
          if (err) {
            return next(new ErrorHandler(err.message, 500));
          }
          comments = comments || results[0].comments;
          rating = rating || results[0].rating;
          pool.query(
            `UPDATE comments SET comments = ?, rating = ? WHERE comment_id = ?`,
            [comments, rating, comment_id],
            (err: any, results: any) => {
              if (err) {
                return next(new ErrorHandler(err.message, 500));
              }
              if (results) {
                res.status(201).json({
                  success: true,
                  message: `Comment update successful`,
                });
              }
            }
          );
        }
      );
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500));
    }
  }
);

export const FetchCommentsForASingleProduct = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { product_id } = req.params;
      pool.query(
        `SELECT * FROM comments WHERE product_id = ?`,
        [product_id],
        (err: any, results: Array<any>) => {
          if (err) {
            return next(new ErrorHandler(err.message, 500));
          }
          if (results.length > 0) {
            res.status(201).json({
              success: true,
              message: `Comments successfully fetched`,
              comments: results,
            });
          }
        }
      );
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500));
    }
  }
);

export const FetchCommentsByAUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user_id } = req.params;
      pool.query(
        `SELECT * FROM comments WHERE user_id = ?`,
        [user_id],
        (err: any, results: Array<any>) => {
          if (err) {
            return next(new ErrorHandler(err.message, 500));
          }
          if (results.length > 0) {
            res.status(201).json({
              success: true,
              message: `Comments successfully fetched`,
              comments: results,
            });
          }
        }
      );
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500));
    }
  }
);

export const DeleteComment = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { comment_id } = req.params;

      pool.query(
        `DELETE FROM comments WHERE comment_id = ?`,
        [comment_id],
        (err: any, results: any) => {
          if (err) {
            return next(new ErrorHandler(err.message, 500));
          }
          res.status(202).json({
            success: true,
            message: `Comment deleted successfully`,
          });
        }
      );
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500));
    }
  }
);
