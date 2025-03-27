import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/Errorhandler";
import { CatchAsyncError } from "../middleware/CatchAsyncErrors";
import { pool } from "../utils/Database";

export const NewFAQ = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { answer, question } = req.body;
      const user_id = req.user?.id;

      pool.query(
        `INSERT INTO faq (question, answer, user_id) VALUES (?, ?, ?)`,
        [question, answer, user_id],
        (err: any, results: any) => {
          if (err) {
            return next(new ErrorHandler(err.message, 500));
          }
          if (results) {
            res.status(201).json({
              success: true,
              message: "FAQ successfully created",
            });
          }
        }
      );
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500));
    }
  }
);

export const EditFAQ = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { faq_id } = req.params;
      let { answer, question } = req.body;
      pool.query(
        `SELECT * FROM faq WHERE id = ?`,
        [faq_id],
        (err: any, results: Array<any>) => {
          if (err) {
            return next(new ErrorHandler(err.message, 500));
          }
          answer = answer || results[0].answer;
          question = question || results[0].question;
          pool.query(
            `UPDATE faq SET question = ?, answer = ? WHERE id = ?`,
            [question, answer, faq_id],
            (err: any, results: any) => {
              if (err) {
                return next(new ErrorHandler(err.message, 500));
              }
              if (results) {
                res.status(201).json({
                  success: true,
                  message: `FAQ update successful`,
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

export const FetchFAQs = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      pool.query(`SELECT * FROM faq`, (err: any, results: Array<any>) => {
        if (err) {
          return next(new ErrorHandler(err.message, 500));
        }
        if (results.length > 0) {
          res.status(200).json({
            success: true,
            message: `FAQs successfully fetched`,
            FAQs: results,
          });
        }
        if (results.length === 0) {
          res.status(200).json({
            success: true,
            message: `No FAQs fetched posted yet`,
          });
        }
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500));
    }
  }
);

export const DeleteFAQ = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { faq_id } = req.params;

      pool.query(
        `DELETE FROM faq WHERE id = ?`,
        [faq_id],
        (err: any, results: any) => {
          if (err) {
            return next(new ErrorHandler(err.message, 500));
          }
          res.status(202).json({
            success: true,
            message: `FAQ deleted successfully`,
          });
        }
      );
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500));
    }
  }
);
