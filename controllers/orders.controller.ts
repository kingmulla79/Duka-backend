import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/Errorhandler";
import { CatchAsyncError } from "../middleware/CatchAsyncErrors";
import { pool } from "../utils/Database";
import { CreateNotificationQuery } from "./notifications.controller";

export const NewOrder = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user_id = req.user?.id;
      const { total_order_price, products, payment_info } = req.body;
      const product_JSON = JSON.stringify(products);
      const payment_JSON = JSON.stringify(payment_info);
      const title = "New Order Created Successfully";
      const notification_message =
        "Thank you for your purchase. Please see the information about your order in the profile section";

      pool.query(
        `INSERT INTO orders (order_status, user_id, total_order_price, products, payment_info) VALUES ('paid','${user_id}', '${total_order_price}', '${product_JSON}', '${payment_JSON}')`,
        async (err: any, results: any) => {
          if (err) {
            return next(new ErrorHandler(err.message, 500));
          }

          await CreateNotificationQuery(title, notification_message, user_id);
          res.status(201).json({
            success: true,
            message: `Order created successfully`,
          });
        }
      );
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500));
    }
  }
);

export const FetchOrdersByAUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user_id = req.user?.id;
      pool.query(
        `SELECT * FROM orders WHERE user_id = ?`,
        [user_id],
        (err: any, results: Array<any>) => {
          if (err) {
            return next(new ErrorHandler(err.message, 500));
          }
          res.status(200).json({
            success: true,
            message: `Orders successfully fetched`,
            orders: results,
          });
        }
      );
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500));
    }
  }
);

export const FetchAllUserOrders = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      pool.query(`SELECT * FROM orders`, (err: any, results: Array<any>) => {
        if (err) {
          return next(new ErrorHandler(err.message, 500));
        }
        res.status(200).json({
          success: true,
          message: `Orders successfully fetched`,
          orders: results,
        });
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500));
    }
  }
);

export const GetOrderAnalytics = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      pool.query(
        `WITH months AS ( SELECT DATE_FORMAT(NOW() - INTERVAL n MONTH, '%Y-%m') AS month_year, DATE_FORMAT(NOW() - INTERVAL n MONTH, '%M') AS month_name FROM ( SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 ) AS numbers)
        SELECT
            m.month_year,
            m.month_name,
        COALESCE(COUNT(orders.id), 0) AS record_count
        FROM months m
        LEFT JOIN orders
            ON DATE_FORMAT(orders.timestamp, '%Y-%m') = m.month_year
            GROUP BY m.month_year, m.month_name
            ORDER BY m.month_year`,
        (err, results: Array<any>) => {
          if (err) {
            return next(new ErrorHandler(err.message, 500));
          }

          res.status(201).json({
            success: true,
            message: "orders analytics data successfully fetched",
            data: results,
          });
        }
      );
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const SortOrdersByPrice = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user_id = req.user?.id;
      const { sort_pattern } = req.body;
      pool.query(
        `SELECT * FROM orders WHERE user_id = ? ORDER BY total_order_price ${sort_pattern}`,
        [user_id],
        (err: any, results: Array<any>) => {
          if (err) {
            return next(new ErrorHandler(err.message, 500));
          }
          res.status(200).json({
            success: true,
            message: `Orders successfully fetched`,
            orders: results,
          });
        }
      );
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500));
    }
  }
);

export const EditOrderDetails = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { order_id } = req.params;
      const { order_status } = req.body;
      pool.query(
        `UPDATE orders SET order_status = ? WHERE id = ?`,
        [order_status, order_id],
        (err: any, results: Array<any>) => {
          if (err) {
            return next(new ErrorHandler(err.message, 500));
          }
          res.status(200).json({
            success: true,
            message: `Order details successfully updated`,
          });
        }
      );
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500));
    }
  }
);

export const DeleteOrder = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { order_id } = req.params;
      pool.query(
        `DELETE FROM orders WHERE id = ?`,
        [order_id],
        (err: any, results: Array<any>) => {
          if (err) {
            return next(new ErrorHandler(err.message, 500));
          }
          res.status(200).json({
            success: true,
            message: `Order details successfully deleted`,
          });
        }
      );
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500));
    }
  }
);
