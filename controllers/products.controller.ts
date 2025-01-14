import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/Errorhandler";
import { CatchAsyncError } from "../middleware/CatchAsyncErrors";
import { pool } from "../utils/Database";
import { v2 as cloudinary } from "cloudinary";
import { CreateNotificationQuery } from "./notifications.controller";

export default interface IProductsRegistration {
  name: string;
  category_id: number;
  price: number;
  prod_desc: string;
  rating?: number;
  stock?: number;
  prod_photo: string;
}

export const AddProduct = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        name,
        category_id,
        price,
        prod_desc,
        rating,
        stock,
        prod_photo,
      }: IProductsRegistration = req.body;

      if (
        !name ||
        !category_id ||
        !price ||
        !prod_desc ||
        !rating ||
        !stock ||
        !prod_photo
      ) {
        return next(
          new ErrorHandler("Please provide all the necessary information", 409)
        );
      }

      const myCloud = await cloudinary.uploader.upload(prod_photo, {
        folder: "products",
      });
      const prod_public_id = myCloud.public_id;
      const prod_url = myCloud.secure_url;
      pool.query(
        `INSERT INTO products (name, category_id, price, prod_desc, rating, stock, prod_public_id, prod_url) VALUES ("${name}", "${category_id}", "${price}", "${prod_desc}", "${rating}", "${stock}", "${prod_public_id}", "${prod_url}")`,
        async (err, result: any) => {
          if (err) {
            console.log(err);
            return next(new ErrorHandler(err, 500));
          } else {
            const title = "Product Creation Successful";
            const notification_message = `User ${req.user?.id} added a new product ${result.insertId}`;

            await CreateNotificationQuery(
              title,
              notification_message,
              Number(req.user?.id)
            );
            res.status(201).json({
              success: true,
              message: `Product added successfully`,
            });
          }
        }
      );
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const EditProduct = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      pool.query(
        `SELECT * FROM products WHERE id = ?`,
        [id],
        async (err, result: Array<any>) => {
          if (err) {
            return next(new ErrorHandler(err.message, 500));
          }
          if (result.length <= 0) {
            return next(
              new ErrorHandler(`No product with the provided id`, 401)
            );
          }
          let {
            name,
            category_id,
            price,
            prod_desc,
            rating,
            stock,
            prod_photo,
          }: IProductsRegistration = req.body;
          let prod_public_id = "";
          let prod_url = "";

          if (prod_photo) {
            await cloudinary.uploader.destroy(result[0].prod_public_id);
            const myCloud = await cloudinary.uploader.upload(prod_photo, {
              folder: "products",
            });
            prod_public_id = myCloud.public_id;
            prod_url = myCloud.secure_url;
          }
          name = name || result[0].name;
          category_id = category_id || result[0].category_id;
          price = price || result[0].price;
          prod_desc = prod_desc || result[0].prod_desc;
          rating = rating || result[0].rating;
          stock = stock || result[0].stock;
          prod_public_id = prod_public_id || result[0].prod_public_id;
          prod_url = prod_url || result[0].prod_url;

          pool.query(
            `UPDATE products SET name = ?, category_id = ?, price = ?, prod_desc = ?, rating = ?, stock = ?, prod_public_id = ?, prod_url = ? WHERE id = ?`,
            [
              name,
              category_id,
              price,
              prod_desc,
              rating,
              stock,
              prod_public_id,
              prod_url,
              id,
            ],
            (err, result) => {
              if (err) {
                return next(new ErrorHandler(err.message, 500));
              }
              res.status(201).json({
                success: true,
                message: `Information updated`,
              });
            }
          );
        }
      );
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const GetAllProduct = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      pool.query(`SELECT * FROM products`, (err, results: Array<any>) => {
        if (err) {
          return next(new ErrorHandler(err.message, 500));
        }
        res.status(201).json({
          success: true,
          message: "Product data successfully fetched",
          products: results,
        });
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const GetProductById = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      pool.query(
        `SELECT * FROM products WHERE id = ?`,
        [id],
        (err, results: Array<any>) => {
          if (err) {
            return next(new ErrorHandler(err.message, 500));
          }
          if (results.length <= 0) {
            return next(new ErrorHandler(`No record with the id: ${id}`, 422));
          }
          res.status(201).json({
            success: true,
            message: `Product data successfully fetched`,
            product: results[0],
          });
        }
      );
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const DeleteProduct = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      pool.query(
        `SELECT * FROM products WHERE id = ?`,
        [id],
        async (err: any, result: Array<any>) => {
          if (err) {
            return next(new ErrorHandler(err.message, 500));
          }
          if (result.length === 0) {
            return next(
              new ErrorHandler(`No product with the specified record`, 422)
            );
          }

          await cloudinary.uploader.destroy(result[0].prod_public_id);
          pool.query(
            `DELETE FROM products WHERE id = ?`,
            [id],
            async (err: any, result: any) => {
              if (err) {
                return next(new ErrorHandler(err.message, 500));
              }
              const title = "Product Deletion Successful";
              const notification_message = `User ${req.user?.id} deleted a product ${id}`;

              await CreateNotificationQuery(
                title,
                notification_message,
                Number(req.user?.id)
              );
              if (result) {
                res.status(201).json({
                  success: true,
                  message: "Product successfully deleted",
                });
              }
            }
          );
        }
      );
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

function capitalizeFirstLetter(val: string) {
  return (
    String(val).charAt(0).toUpperCase() + String(val).slice(1).toLowerCase()
  );
}

export const AddNewProductCategory = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { category_name } = req.body;

      capitalizeFirstLetter(category_name);
      pool.query(
        `INSERT INTO prod_category (category_name) VALUES ("${category_name}")`,
        (err: any, result: any) => {
          if (err) {
            return next(new ErrorHandler(err.message, 500));
          }

          res.status(201).json({
            success: true,
            message: `Product category successfully added`,
          });
        }
      );
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
export const GetAllProductCategories = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      pool.query(`SELECT * FROM prod_category`, (err, results: Array<any>) => {
        if (err) {
          return next(new ErrorHandler(err.message, 500));
        }
        res.status(201).json({
          success: true,
          message: "Product category data successfully fetched",
          product_categories: results,
        });
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const UpdateProductCategory = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { category_name } = req.body;
      const { category_id } = req.params;
      capitalizeFirstLetter(category_name);
      pool.query(
        `UPDATE prod_category SET category_name = ? WHERE category_id = ?`,
        [category_name, category_id],
        (err: any, result: any) => {
          if (err) {
            return next(new ErrorHandler(err.message, 500));
          }
          if (result) {
            res.status(201).json({
              success: true,
              message: `Product category successfully added`,
            });
          }
        }
      );
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const DeleteProductCategory = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { category_id } = req.params;

      pool.query(
        `DELETE FROM prod_category WHERE category_id = ?`,
        [category_id],
        (err: any, result) => {
          if (err) {
            return next(new ErrorHandler(err.message, 500));
          }
          if (result) {
            res.status(201).json({
              success: true,
              message: "Product category successfully deleted",
            });
          }
        }
      );
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
