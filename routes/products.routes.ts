import express from "express";
import { authorizedRoles, isAuthenticated } from "../middleware/Auth";
import {
  AddNewProductCategory,
  AddProduct,
  DeleteProduct,
  DeleteProductCategory,
  EditProduct,
  GetAllProduct,
  GetAllProductCategories,
  GetProductAnalytics,
  GetProductById,
  ProductAbstractFilter,
  ProductSearchBarFilter,
  ProductSearchResults,
  StripePayment,
  UpdateProductCategory,
} from "../controllers/products.controller";
import { UserUpdateAccessToken } from "../controllers/user.controller";
const ProductRouter = express.Router();

ProductRouter.post(
  "/add-product",
  UserUpdateAccessToken,
  isAuthenticated,
  authorizedRoles("admin"),
  AddProduct
);
ProductRouter.put(
  "/update-product/:id",
  UserUpdateAccessToken,
  isAuthenticated,
  authorizedRoles("admin"),
  EditProduct
);
ProductRouter.get(
  "/get-product-analytics",
  UserUpdateAccessToken,
  isAuthenticated,
  authorizedRoles("admin"),
  GetProductAnalytics
);
ProductRouter.get("/get-products", GetAllProduct);
ProductRouter.get("/get-product/:id", GetProductById);
ProductRouter.get("/get-product-search-name", ProductSearchBarFilter);
ProductRouter.get(
  "/get-product-search-results/:search_name",
  ProductSearchResults
);
ProductRouter.get(
  "/product-search-filter/filter_details",
  ProductAbstractFilter
);
ProductRouter.delete(
  "/delete-product/:id",
  UserUpdateAccessToken,
  isAuthenticated,
  authorizedRoles("admin"),
  DeleteProduct
);

ProductRouter.post(
  "/add-product-category",
  UserUpdateAccessToken,
  isAuthenticated,
  authorizedRoles("admin"),
  AddNewProductCategory
);

ProductRouter.put(
  "/update-product-category/:category_id",
  UserUpdateAccessToken,
  isAuthenticated,
  authorizedRoles("admin"),
  UpdateProductCategory
);

ProductRouter.delete(
  "/delete-product-category/:category_id",
  UserUpdateAccessToken,
  isAuthenticated,
  authorizedRoles("admin"),
  DeleteProductCategory
);
ProductRouter.get("/get-product-categories", GetAllProductCategories);

ProductRouter.post(
  "/payment-intent",
  UserUpdateAccessToken,
  isAuthenticated,
  StripePayment
);

export default ProductRouter;
