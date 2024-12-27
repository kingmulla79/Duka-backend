import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/Errorhandler";
import { CatchAsyncError } from "../middleware/CatchAsyncErrors";
import { pool } from "../utils/Database";
import cron from "node-cron";

export const CreateNotificationQuery = (
  title: string,
  message: string,
  user_id: number
) => {
  return new Promise((resolve, reject) => {
    pool.query(
      `INSERT INTO notifications (title, message, user_id) VALUES (?, ?, ?)`,
      [title, message, user_id],
      (err: any, results: any) => {
        if (err) {
          return reject(new ErrorHandler(err.message, 500));
        }

        console.log(`Notification created successfully`);
        resolve(results);
      }
    );
  });
};

export const EditNotification = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const status = "read";
      pool.query(
        `UPDATE notifications SET not_status = ? WHERE id = ?`,
        [status, id],
        (err: any, results: any) => {
          if (err) {
            return next(new ErrorHandler(err.message, 500));
          }
          res.status(200).json({
            success: true,
            message: `Notification status updated successfully`,
          });
        }
      );
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500));
    }
  }
);

export const GetNotificationByUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.user?.id;

      pool.query(
        `SELECT * FROM notifications WHERE user_id = ?`,
        [id],
        (err: any, results: any) => {
          if (err) {
            return next(new ErrorHandler(err.message, 500));
          }
          res.status(200).json({
            success: true,
            message: `User notifications successfully fetched`,
            notifications: results,
          });
        }
      );
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500));
    }
  }
);

export const GetAllNotifications = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      pool.query(`SELECT * FROM notifications`, (err: any, results: any) => {
        if (err) {
          return next(new ErrorHandler(err.message, 500));
        }
        res.status(200).json({
          success: true,
          message: `All notifications successfully fetched`,
          notifications: results,
        });
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500));
    }
  }
);

export const DeleteNotifications = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      pool.query(
        `DELETE FROM notifications WHERE id = ?`,
        [id],
        (err: any, results: Array<any>) => {
          if (err) {
            return next(new ErrorHandler(err.message, 500));
          }
          res.status(200).json({
            success: true,
            message: `Notification successfully deleted`,
          });
        }
      );
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500));
    }
  }
);
cron.schedule("0 * * * *", async () => {
  pool.query(
    "DELETE * FROM notifications WHERE not_status = read AND `date` <= (NOW() - INTERVAL 30 DAY)",
    (err: any, results: any) => {
      if (err) {
        console.log(err.message);
      }
      console.log("_____________");
      console.log("running cron: deleting read notification");
    }
  );
});
