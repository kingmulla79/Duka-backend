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
        `INSERT INTO orders (user_id, total_order_price, products, payment_info) VALUES ('${user_id}', '${total_order_price}', '${product_JSON}', '${payment_JSON}')`,
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

// const CreateOrderQuery = (user_id: number, total_order_price: number) => {
//   return new Promise((resolve, reject) => {
//     pool.query(
//       `INSERT INTO orders (user_id, total_order_price) VALUES (?, ?)`,
//       [user_id, total_order_price],
//       (err: any, results: any) => {
//         if (err) {
//           return reject(new ErrorHandler(err.message, 500));
//         }

//         console.log(`Order created successfully`);
//         resolve(results);
//       }
//     );
//   });
// };

// export const NewOrder = CatchAsyncError(
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       let insertId: number;
//       const user_id = req.user?.id;
//       const { total_order_price, products } = req.body;

//       const results: any = await CreateOrderQuery(user_id, total_order_price);

//       insertId = results.insertId;

//       await products.forEach((product: any) => {
//         pool.query(
//           `INSERT INTO order_product (order_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)`,
//           [
//             insertId,
//             product.product_id,
//             product.quantity,
//             product.unit_price,
//             product.total_price,
//           ],
//           (err: any, results: any) => {
//             if (err) {
//               return next(new ErrorHandler(err.message, 500));
//             }
//             console.log(`Order product inserted successfully`);
//           }
//         );
//       });
//       res.status(201).json({
//         success: true,
//         message: `Order created successfully`,
//       });
//     } catch (err: any) {
//       return next(new ErrorHandler(err.message, 500));
//     }
//   }
// );
