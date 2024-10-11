const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();
require("./db"); // to run db

const app = express();
app.use(cors({ origin: "http://localhost:3000", credentials: true }, ));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// Public routes 
app.use("/auth", require("./routes/auth"));

app.use("/events", verifyToken, require("./routes/event"));


// Protected routes
app.use("/registrations", verifyToken, checkAdmin, require("./routes/registration"));
app.use("/reviews", verifyToken, checkAdmin, require("./routes/review"));
app.use("/tickets", verifyToken, checkAdmin, require("./routes/ticket"));
app.use("/users", verifyToken, checkAdmin, require("./routes/user"));


const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`-> server running on http://localhost:${PORT}`)
);
