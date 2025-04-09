# Duka – Backend Service

Duka is the backend service powering a modern eCommerce platform. Built with Node.js, Express, and TypeScript, it handles everything from user authentication and email notifications to payment processing and cloud-based media management.

---

## 🚀 Features

- JWT-based Authentication
- Email notifications with Nodemailer
- Background job scheduling via node-cron
- Cloud media management using Cloudinary
- Payment processing with Stripe
- MySQL database support with Sequelize or mysql2
- Redis integration with ioredis
- Secure environment config via dotenv
- View rendering with EJS

---

## 🛠 Tech Stack

- **Language:** TypeScript
- **Runtime:** Node.js
- **Framework:** Express
- **Database:** MySQL
- **Templating Engine:** EJS
- **Job Scheduling:** node-cron
- **Media Storage:** Cloudinary
- **Authentication:** JWT, cookie-parser
- **Payments:** Stripe
- **Email:** Nodemailer
- **Other Tools:** dotenv, Morgan, CORS

---

## 📂 Project Structure

 Duka/ ├── server.ts ├── package.json ├── .env ├── src/ │ ├── controllers/ │ ├── routes/ │ ├── models/ │ ├── services/ │ └── utils/


---

## 📦 Scripts

- `npm run dev` – Start development server with live reload (`ts-node-dev`)
- `npm test` – Placeholder for tests (customize as needed)

---

## ⚙️ Environment Variables

You will need to create a `.env` file in the root directory and populate it with the following:

```env
PORT = 5000

DB_HOST = 127.0.0.1
DB_USER = db_username
DB_PASSWORD = db_password
DB_NAME = db_name
DB_CONNECTION_LIMIT = 10

ORIGIN = ["http://localhost:3000/"] -- for local UI API tests
CLOUD_NAME = cloudinary_cloud_name
CLOUD_API_KEY = cloudinary_cloud_api_key
CLOUD_SECRET_KEY = cloudinary_cloud_secret_key
REDIS_URL = redis_url
ACTIVATION_SECRET = your_activation_secret
ACCESS_TOKEN = your_access_token
ACCESS_TOKEN_EXPIRE = your_access_token_expiry_time_in_minutes
REFRESH_TOKEN = your_refresh_token
REFRESH_TOKEN_EXPIRE = your_refresh_token_expiry_time_in_minutes
EXPIRE_DURATION = cookies_expiry_duration
STRIPE_SECRET_KEY = stripe_secret_key
SERVICE = email_service
HOST = email_host
EMAIL_PORT = email_host_port
SECURE = true
USER = email_username_address
PASS = email_password

STRIPE_SECRET_KEY=your_stripe_secret_key
```

## 📄 License
This project is licensed under the ISC License.

© Thomas Aggrey Odhiambo.
