require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const User = require("./Models/User");
// var cloudinary = require("cloudinary").v2;

const bodyParser = require("body-parser");

const authRoutes = require("./routes/userRoutes");
const unAuthRoutes = require("./routes/unauthenticated");

const server = express();

server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: false }));

const PORT = process.env.PORT || 3001;

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  })
  .then((response) => {
    console.log("Connected to DB...!!!");
  })
  .catch((err) => {
    console.log("Failed to Connect DB...!!!");
  });

// server.use(passport.initialize()); // passport initialization.........!!!!
// server.use(passport.session()); // passsport session.........!!!!

server.use("/api", authRoutes);
server.use("/", unAuthRoutes);
// server.use(
//   "/api",
//   passport.authenticate("jwt", { session: false }),
//   authRoutes
// );

server.all("*", (req, res) => {
  res.send("page not found");
});

server.listen(PORT, () => {
  console.log("server is listening on ", PORT);
});
