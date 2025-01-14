require("dotenv").config();
import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/Errorhandler";
import { CatchAsyncError } from "../middleware/CatchAsyncErrors";
import ejs from "ejs";
import path from "path";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import sendMail from "../utils/sendMail";
import bcrypt from "bcryptjs";
import {
  accessTokenOptions,
  GenerateJWTToken,
  refreshTokenOptions,
  sendToken,
} from "../utils/jwt";
import { redis } from "../utils/Redis";
import { v2 as cloudinary } from "cloudinary";
import { pool } from "../utils/Database";
import IUser from "../models/user.model";
import { CreateNotificationQuery } from "./notifications.controller";

interface IRegistrationBody {
  username: string;
  email: string;
  password: string;
  phone?: string;
  avatar_public_id?: string;
  avatar_url?: string;
}

const EmailQuery = (email: string) => {
  return new Promise((resolve, reject) => {
    pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email],
      (err, result: Array<any>) => {
        if (result.length > 0) {
          return reject(
            new ErrorHandler(
              "The email is already in use. Please choose another one",
              409
            )
          );
        }
        if (err) {
          return reject(new ErrorHandler(err, 400));
        }

        resolve(result);
      }
    );
  });
};

const UsernameQuery = (username: string) => {
  return new Promise((resolve, reject) => {
    pool.query(
      "SELECT * FROM users WHERE username = ?",
      [username],
      (err, result: Array<any>) => {
        if (result.length > 0) {
          return reject(
            new ErrorHandler(
              "The username is already in use. Please choose another one",
              409
            )
          );
        }
        if (err) {
          return reject(new ErrorHandler(err, 400));
        }

        resolve(result);
      }
    );
  });
};

const PhoneQuery = (phone: string) => {
  return new Promise((resolve, reject) => {
    pool.query(
      "SELECT * FROM users WHERE phone = ?",
      [phone],
      (err, result: Array<any>) => {
        if (result.length > 0) {
          return reject(
            new ErrorHandler(
              "The phone is already in use. Please choose another one",
              409
            )
          );
        }
        if (err) {
          return reject(new ErrorHandler(err, 400));
        }
        resolve(result);
      }
    );
  });
};

const ResetPasswordQuery = (email: string) => {
  return new Promise((resolve, reject) => {
    pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email],
      (err, result: Array<any>) => {
        if (err) {
          return reject(new ErrorHandler(err, 400));
        }
        if (result.length === 0) {
          return reject(
            new ErrorHandler(`No user with the provided email`, 400)
          );
        }

        resolve(result);
      }
    );
  });
};

export const UserRegistration = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let { username, email, password, phone, avatar } = req.body;
      let avatar_public_id = "";
      let avatar_url = "";

      if (!username || !email! || !password) {
        return next(new ErrorHandler("Please provide all the details", 422));
      }

      await UsernameQuery(username);
      await EmailQuery(email);
      await PhoneQuery(phone);

      if (avatar) {
        const myCloud = await cloudinary.uploader.upload(avatar, {
          folder: "avatars",
        });
        avatar_public_id = myCloud.public_id;
        avatar_url = myCloud.secure_url;
      }

      //password policy
      const passwordPattern: RegExp =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%]).{8,24}$/;
      const password_test = passwordPattern.test(password);

      if (!password_test) {
        return next(
          new ErrorHandler(
            "The password must be 8 to 24 characters long with at least one uppercase letter, on lower case letter, one special character i.e [!@#$%] and one number",
            400
          )
        );
      }

      const user: IRegistrationBody = {
        username,
        email,
        password,
        phone,
        avatar_public_id,
        avatar_url,
      };

      const activationToken = createActivationToken(user);
      const activationCode = activationToken.activationCode;
      const data = { user: { username: user.username }, activationCode };
      const html = ejs.renderFile(
        path.join(__dirname, "../mails/Activation-mails.ejs"),
        data
      );

      try {
        await sendMail(
          {
            email: email,
            subject: "Ecommerce Activation",
            template: "Activation-mails.ejs",
            data,
          },
          next
        )
          .then(() => {
            res.status(200).json({
              success: true,
              message: `Account creation successful. Check the email: ${user.email} for an activation code to complete the setup process`,
              activationToken: activationToken.token,
            });
          })
          .catch((error) => {
            return next(
              new ErrorHandler(
                `Error while sending activation mail. ${error}`,
                500
              )
            );
          });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

interface IActivationToken {
  token: string;
  activationCode: string;
}

export const createActivationToken = (
  user: IRegistrationBody
): IActivationToken => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
  const token = jwt.sign(
    { user, activationCode },
    process.env.ACTIVATION_SECRET as Secret,
    { expiresIn: process.env.EXPIRE_DURATION }
  );
  return { token, activationCode };
};

interface IActivationRequest {
  activation_token: string;
  activation_code: string;
}

export const UserActivation = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { activation_token, activation_code } =
        req.body as IActivationRequest;
      if (!activation_token || !activation_code) {
        return next(
          new ErrorHandler(
            "The activation code and token must be provided",
            422
          )
        );
      }
      const newUser: { user: IUser; activationCode: string } = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET as string
      ) as { user: IUser; activationCode: string };
      if (newUser.activationCode !== activation_code) {
        return next(new ErrorHandler("Invalid activation code used", 400));
      }
      const { email, username, password, phone, avatar_public_id, avatar_url } =
        newUser.user;

      //password hashing
      const hashed_password = await bcrypt.hash(password, 10);

      pool.query(
        `INSERT INTO users (email, username, password, phone, avatar_public_id, avatar_url, verified) VALUES ("${email}", "${username}", "${hashed_password}", "${phone}", "${avatar_public_id}", "${avatar_url}", "1")`,
        async (err: any, result: any) => {
          if (err) {
            return next(new ErrorHandler(err, 500));
          } else {
            // test the code
            const title = "Account Creation Successful";
            const notification_message =
              "Thank you for signing up with our platform. Start shopping at affordable rates for high quality products guarantee to surpass your expectations!";
            const user_id = result.insertId;

            await CreateNotificationQuery(title, notification_message, user_id);
            res.status(201).json({
              success: true,
              message: `Your account has been successfully verified`,
            });
          }
        }
      );
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

interface ILoginRequest {
  email: string;
  password: string;
}

export const UserLogin = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as ILoginRequest;

      if (!email || !password) {
        return next(
          new ErrorHandler("Please enter both the email and password", 422)
        );
      }
      pool.query(
        `SELECT * FROM users WHERE email = ?`,
        [email],
        async (err, result: any) => {
          if (err) {
            return next(new ErrorHandler(err, 500));
          }
          if (result.length <= 0) {
            return next(new ErrorHandler("Invalid email or password", 401));
          }
          const password_match = await bcrypt.compare(
            password,
            result[0].password
          );
          if (!password_match) {
            return next(new ErrorHandler("Invalid email or password", 401));
          }
          sendToken(result[0], 200, res);
        }
      );
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//logout user
export const UserLogout = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userID = req.user?.id as any;
      await redis.del(userID);
      res.cookie("access_token", "", { maxAge: 1 });
      res.cookie("refresh_token", "", { maxAge: 1 });
      // pool.end();
      res.status(200).json({
        success: true,
        message: `User succcessfully logged out`,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// update access token
export const UserUpdateAccessToken = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refresh_token = req.cookies.refresh_token as string;
      const decode = jwt.verify(
        refresh_token,
        process.env.REFRESH_TOKEN as string
      ) as JwtPayload;
      if (!decode) {
        return next(new ErrorHandler("Cannot refresh token", 401));
      }
      const session = await redis.get(decode.id as string);
      if (!session) {
        return next(
          new ErrorHandler(
            "User not logged in. Please login to access these resources",
            401
          )
        );
      }
      const user = JSON.parse(session);
      const tokens = GenerateJWTToken(user);
      const accessToken = tokens.accessToken;
      const refreshToken = tokens.refreshToken;

      req.user = user;
      res.cookie("access_token", accessToken, accessTokenOptions);
      res.cookie("refresh_token", refreshToken, refreshTokenOptions);

      await redis.set(user._id, JSON.stringify(user), "EX", 604800); //expires in seven days
      next();
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//get user by id

export const UserGetUserInfo = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userID = req.user?.id;
      const UserJSON = await redis.get(userID);
      if (UserJSON) {
        const user = JSON.parse(UserJSON);
        res.status(200).json({
          success: true,
          user,
        });
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const UserGetAllUsersInfo = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      pool.query(`SELECT * FROM users`, (err, result: any) => {
        if (err) {
          return next(new ErrorHandler(err, 500));
        }
        res.status(200).json({
          success: true,
          message: "Information successfully fetched",
          users: result,
        });
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
// social authentication
interface ISocialAuthBody {
  email: string;
  username: string;
  avatar_url: string;
}

export const UserSocialAuth = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, username, avatar_url } = req.body as ISocialAuthBody;
      pool.query(
        `SELECT * FROM users WHERE email = ?`,
        [email],
        (err, result: any) => {
          if (err) {
            return next(new ErrorHandler(err, 500));
          } else if (result.length === 0) {
            pool.query(
              `INSERT INTO users (email, username, avatar_url, verified) VALUES ("${email}","${username}","${avatar_url}","${1}")`,
              async (err, result: any) => {
                if (err) {
                  return next(new ErrorHandler(err, 500));
                }
                // test code
                const title = "Account Creation Successful";
                const notification_message =
                  "Thank you for signing up with our platform. Start shopping at affordable rates for high quality products guarantee to surpass your expectations!";
                const user_id = result.insertId;

                await CreateNotificationQuery(
                  title,
                  notification_message,
                  user_id
                );
                const user = {
                  username,
                  email,
                  avatar_url,
                  id: result?.insertId,
                };
                // use new user data
                sendToken(user, 200, res);
              }
            );
          } else {
            sendToken(result[0], 200, res);
          }
        }
      );
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

interface IUpdateUserInfo {
  username?: string;
  phone?: number;
}

export const UserUpdateInfo = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let { username, phone } = req.body as IUpdateUserInfo;
      if (!username && !phone) {
        return next(new ErrorHandler(`No information to update`, 422));
      }
      const userId: any = req.user?.id;
      const UserJSON = await redis.get(userId);
      if (UserJSON) {
        let user = JSON.parse(UserJSON);
        if (user.username === username && user.phone === phone) {
          return next(
            new ErrorHandler(
              `Updated information cannot be the same as the available one`,
              409
            )
          );
        }
        username = username || user.username;
        phone = phone || user.phone;

        pool.query(
          `UPDATE users SET username = ?, phone = ? WHERE id = ?`,
          [username, phone, userId],
          async (err, result: any) => {
            if (err) {
              return next(new ErrorHandler(err, 500));
            }
            user.username = username;
            user.phone = phone;
            await redis.set(userId, JSON.stringify(user)).then(() => {
              res.status(201).json({
                success: true,
                message: "Information successfully updated",
                // user: user,
              });
            });
          }
        );
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

//update password

interface IUpdatePassword {
  oldPassword: string;
  newPassword: string;
}

export const UserUpdatePassword = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { oldPassword, newPassword } = req.body as IUpdatePassword;
      if (!oldPassword || !newPassword) {
        return next(
          new ErrorHandler(`Please provide all the information required`, 422)
        );
      }
      if (req.user?.id) {
        pool.query(
          `SELECT * FROM users WHERE id = ?`,
          [req.user?.id],
          async (err, result: any) => {
            if (err) {
              return next(new ErrorHandler(err, 500));
            }
            if (result[0].password === undefined) {
              return next(
                new ErrorHandler(`The password can't be updated`, 409)
              );
            }
            const isPasswordMatch = await bcrypt.compare(
              oldPassword,
              result[0].password
            );
            if (!isPasswordMatch) {
              return next(new ErrorHandler("Invalid old password", 409));
            }
            if (isPasswordMatch && oldPassword === newPassword) {
              return next(
                new ErrorHandler(
                  `The old and new passwords cannot be the same`,
                  409
                )
              );
            }
            const hashed_password = await bcrypt.hash(newPassword, 10);
            pool.query(
              `UPDATE users SET password = ? WHERE id = ?`,
              [hashed_password, req.user?.id],
              async (err, result) => {
                if (err) {
                  return next(new ErrorHandler(err, 500));
                }
                const userID: any = req.user?.id;
                const UserJSON = await redis.get(userID);
                if (UserJSON) {
                  let user = JSON.parse(UserJSON);
                  user.password = hashed_password;
                  await redis.set(userID, JSON.stringify(user));
                  res.status(201).json({
                    success: true,
                    message: `Password updated successfully`,
                  });
                }
              }
            );
          }
        );
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const UserUpdateProfilePic = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { avatar } = req.body;
      if (!avatar) {
        return next(
          new ErrorHandler(
            `Please provide the avatar to update user information`,
            422
          )
        );
      }
      const userId: any = req.user?.id;
      let avatar_public_id = "";
      let avatar_url = "";
      pool.query(
        `SELECT * FROM users WHERE id = ?`,
        [userId],
        async (err, result: any) => {
          if (err) {
            return next(new ErrorHandler(err, 500));
          }
          if (result[0].avatar_public_id) {
            // delete old image first
            await cloudinary.uploader.destroy(result[0].avatar_public_id);
          }
          const myCloud = await cloudinary.uploader.upload(avatar, {
            folder: "avatars",
          });
          avatar_public_id = myCloud.public_id;
          avatar_url = myCloud.secure_url;
          pool.query(
            `UPDATE users SET avatar_public_id = ?, avatar_url = ? WHERE id = ?`,
            [avatar_public_id, avatar_url, userId],
            async (err, result: any) => {
              if (err) {
                return next(new ErrorHandler(err, 500));
              }
              const UserJSON = await redis.get(userId);
              if (UserJSON) {
                let user = JSON.parse(UserJSON);
                user.avatar_public_id = avatar_public_id;
                user.avatar_url = avatar_url;
                await redis.set(userId, JSON.stringify(user));
                res.status(201).json({
                  success: true,
                  message: "Profile picture successfully updated",
                  user,
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

//update user role to admin
export const UserUpdateRole = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, role } = req.body;
      let user: IUser;
      pool.query(
        `SELECT * FROM users WHERE email = ?`,
        [email],
        (err, result: any) => {
          if (err) {
            return next(new ErrorHandler(err, 500));
          }
          if (result.length <= 0) {
            return next(
              new ErrorHandler(
                "There is no user with the specified email address",
                422
              )
            );
          }
          if (result[0].user_role === role) {
            return next(
              new ErrorHandler(
                "The updated role is the same as the user role",
                409
              )
            );
          }
          const userID = result[0].id;
          pool.query(
            `UPDATE users SET user_role = ? WHERE id = ?`,
            [role, userID],
            async (err, result: any) => {
              if (err) {
                return next(new ErrorHandler(err, 500));
              }
              const UserJSON = await redis.get(userID);

              if (UserJSON) {
                user = JSON.parse(UserJSON);

                user.user_role = role;

                await redis.set(userID, JSON.stringify(user));
              }
              res.status(201).json({
                success: true,
                message: `The user role successfully updated`,
                user,
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

// delete user
export const UserDeleteUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      pool.query(
        `SELECT * FROM users WHERE id = ?`,
        [id],
        async (err, result: any) => {
          if (err) {
            return next(new ErrorHandler(err, 500));
          }
          if (result.length <= 0) {
            return next(new ErrorHandler("The user doesn't exist", 409));
          }
          if (result[0].avatar_public_id) {
            await cloudinary.uploader
              .destroy(result[0].avatar_public_id)
              .then((result) => {
                console.log("Image successfully deleted from cloudinary");
              });
          }
          await redis.del(id).then((result) => {
            console.log("User cache successfully cleared");
          });
          const title = "Account Deletion Successful";
          const notification_message = `User ${id} deleted their account`;

          await CreateNotificationQuery(
            title,
            notification_message,
            Number(id)
          );
          pool.query(
            `DELETE FROM users WHERE id = ?`,
            [id],
            async (err, results: any) => {
              if (err) {
                return next(new ErrorHandler(err, 500));
              }

              res.status(201).json({
                success: true,
                message: `The user successfully deleted`,
              });
            }
          );
        }
      );
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

//send reset email
export const UserResetMail = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, link } = req.body;
      if (!email || !link) {
        return next(
          new ErrorHandler("Please provide all the necessary information", 400)
        );
      }
      pool.query(
        `SELECT * FROM users WHERE email = ?`,
        [email],
        (err, results: any) => {
          if (err) {
            return next(new ErrorHandler(err.message, 500));
          }
          if (results.length === 0) {
            return next(
              new ErrorHandler("There is no user with the specified mail", 400)
            );
          }
        }
      );

      const data = { link };
      const html = ejs.renderFile(
        path.join(__dirname, "../mails/Reset-Password.ejs"),
        data
      );
      try {
        await sendMail(
          {
            email: email,
            subject: "Ecommerce Password Reset",
            template: "Reset-Password.ejs",
            data,
          },
          next
        );

        res.status(201).json({
          success: true,
          message: `Email successfully sent. Check your mail to reset your password`,
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

interface IForgotPassword {
  password: string;
  passwordConfirm: string;
}
//forgot password
export const UserForgotPassword = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const email = req.params.email;
      const { password, passwordConfirm } = req.body as IForgotPassword;
      if (!password || !passwordConfirm) {
        return next(
          new ErrorHandler(`Please provide all the information required`, 400)
        );
      }
      if (password !== passwordConfirm) {
        return next(new ErrorHandler(`Both passwords must match`, 400));
      }
      await ResetPasswordQuery(email);
      const hashed_password = await bcrypt.hash(password, 10);
      pool.query(
        `UPDATE users SET password = ? WHERE email = ?`,
        [hashed_password, email],
        (err, results: any) => {
          if (err) {
            return next(new ErrorHandler(err.message, 500));
          }
          res.status(200).json({
            success: true,
            message: `Password updated successfully`,
          });
        }
      );
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);
