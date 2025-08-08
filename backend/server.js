const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json()); // for parsing application/json
app.use(cookieParser()); // for parsing cookies

// Import and mount authentication routes
const authRoutes = require("/home/user/studio/backend/routes/auth");

app.use("/api/auth", authRoutes);

// Define port and start server
const PORT = process.env.PORT || 5000; // Use a common backend port
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
