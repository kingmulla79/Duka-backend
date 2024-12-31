require("dotenv").config();
import { Response } from "express";
import { redis } from "./Redis";
import jwt from "jsonwebtoken";
import IUser from "../models/user.model";

interface ITokenOptions {
  expires: Date;
  maxAge: number;
  httpOnly: boolean;
  sameSite: "lax" | "strict" | "none" | undefined;
  secure?: boolean;
}

// parse env. variables to intergrate with fallback values
const accessTokenExpire = parseInt(process.env.ACCESS_TOKEN_EXPIRE || "1200");
const refreshTokenExpire = parseInt(process.env.REFRESH_TOKEN_EXPIRE || "5000");

//cookie options

export const accessTokenOptions: ITokenOptions = {
  expires: new Date(Date.now() + accessTokenExpire * 60 * 60 * 1000),
  maxAge: accessTokenExpire * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "lax",
  // secure: true,
};
export const refreshTokenOptions: ITokenOptions = {
  expires: new Date(Date.now() + refreshTokenExpire * 60 * 60 * 1000),
  maxAge: refreshTokenExpire * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "lax",
  // secure: true,
};

//jwt functions
export const GenerateJWTToken = (user: IUser) => {
  const accessToken = jwt.sign(
    { id: user.id },
    process.env.ACCESS_TOKEN || "",
    {
      expiresIn: "2h",
    }
  );
  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.REFRESH_TOKEN || "",
    {
      expiresIn: "3d",
    }
  );
  return { accessToken, refreshToken };
};

export const sendToken = (user: any, statusCode: number, res: Response) => {
  const tokens = GenerateJWTToken(user);
  const accessToken = tokens.accessToken;
  const refreshToken = tokens.refreshToken;

  //upload session to redis
  redis.set(user.id, JSON.stringify(user) as any, "EX", 604800);

  // only set true in production
  if (process.env.NODE_ENV === "production") {
    accessTokenOptions.secure = true;
  }

  res.cookie("access_token", accessToken, accessTokenOptions);
  res.cookie("refresh_token", refreshToken, refreshTokenOptions);
  res.status(statusCode).json({
    success: true,
    user,
    accessToken,
  });
};
