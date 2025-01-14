import express from "express";
import { authorizedRoles, isAuthenticated } from "../middleware/Auth";
import {
  DeleteOrder,
  EditOrderDetails,
  FetchAllUserOrders,
  FetchOrdersByAUser,
  NewOrder,
  SortOrdersByPrice,
} from "../controllers/orders.controller";
import { UserUpdateAccessToken } from "../controllers/user.controller";
const OrderRouter = express.Router();

OrderRouter.post(
  "/new-order",
  UserUpdateAccessToken,
  isAuthenticated,
  NewOrder
);
OrderRouter.get(
  "/get-user-orders",
  UserUpdateAccessToken,
  isAuthenticated,
  FetchOrdersByAUser
);
OrderRouter.get(
  "/get-all-orders",
  UserUpdateAccessToken,
  isAuthenticated,
  authorizedRoles("admin"),
  FetchAllUserOrders
);
OrderRouter.get(
  "/sort-user-orders",
  UserUpdateAccessToken,
  isAuthenticated,
  SortOrdersByPrice
);

OrderRouter.put(
  "/edit-order-details/:order_id",
  UserUpdateAccessToken,
  isAuthenticated,
  EditOrderDetails
);
OrderRouter.delete(
  "/delete-order/:order_id",
  UserUpdateAccessToken,
  isAuthenticated,
  authorizedRoles("admin"),
  DeleteOrder
);

export default OrderRouter;
