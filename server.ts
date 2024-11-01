require("dotenv").config();
import { app } from "./app";
import http from "http";
import { connectDatabase } from "./utils/Database";
const server = http.createServer(app);
import { v2 as cloudinary } from "cloudinary";

//cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_SECRET_KEY,
});

//create server
server.listen(process.env.PORT, () => {
  console.log(`Server listening on port: ${process.env.PORT}`);
  connectDatabase()
    .then(() => {
      console.log(`Database connected successfully`);
    })
    .catch((error: any) => {
      console.log(error);
    });
});
