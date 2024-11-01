import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "./CatchAsyncErrors";
import jwt, { JwtPayload } from "jsonwebtoken";
import ErrorHandler from "../utils/Errorhandler";
import { redis } from "../utils/Redis";

export const isAuthenticated = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const access_token = req.cookies.access_token; //req.headers.authorization;
    if (!access_token) {
      return next(
        new ErrorHandler("Please login before accessing the resource", 401)
      );
    }
    // const token = access_token.split(" ")[1];
    const decoded = jwt.verify(
      access_token, //token
      process.env.ACCESS_TOKEN as string
    ) as JwtPayload;
    if (!decoded) {
      return next(new ErrorHandler("Invalid access token", 401));
    }
    const user = await redis.get(decoded.id);

    if (!user) {
      return next(new ErrorHandler("User not found. Please login", 401));
    }
    req.user = JSON.parse(user);
    next();
  }
);

export const authorizedRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.user_role || "")) {
      return next(
        new ErrorHandler(
          `Role ${req.user?.user_role} is not allowed to access this route`,
          403
        )
      );
    }
    next();
  };
};
