const user = require("../Models/User");
const books = require("../Models/Book");
const jwt = require("jsonwebtoken");
var nodemailer = require("nodemailer");
var cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const multer = require("multer");
const htmlPdf = require("html-pdf");

var fs = require("fs");
var path = require("path");
var ejs = require("ejs");

exports.imageUpload = async function (req, res, next) {
  const file = req.file;
  if (!file) {
    const error = new Error("Please choose a file...!!!");
    error.httpStatusCode = 400;
    return next(error);
  } else {
    var images = [];
    images.push(path.join(file.destination, file.filename));
    console.log("image path", images);

    fs.readFile(
      path.resolve(`./views/template.ejs`),
      "utf-8",
      (error, content) => {
        if (error) {
          console.log(error);
        } else {
          const html = ejs.render(content, {
            images,
          });

          htmlPdf.create(html).toStream(function (err, stream) {
            stream.pipe(res);
          });
        }
      }
    );
  }
};

exports.registerUser = function (req, res) {
  if (!req.body.email) {
    return res
      .status(400)
      .send({ succcess: false, message: "Email is required...!!!" });
  }
  if (!req.body.password) {
    return res
      .status(400)
      .send({ success: false, message: "password is required...!!!" });
  }
  if (!req.body.name) {
    return res
      .status(400)
      .send({ success: false, message: "name is required...!!!" });
  }
  if (!req.body.address) {
    return res
      .status(400)
      .send({ success: false, message: "address is required...!!!" });
  }
  if (!req.body.userRole) {
    return res.status(400).send({
      success: false,
      message: "User Role is required either is Admin or User",
    });
  }

  var otp = Math.floor(100000 + Math.random() * 9000);
  console.log(otp);

  const user2 = user
    .create({
      email: req.body.email,
      password: req.body.password,
      name: req.body.name,
      address: req.body.address,
      accountType: req.body.accountType,
      userRole: req.body.userRole,
      varificationCode: otp,
    })

    .then((user2) => {
      console.log(user2);
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.FROM_EMAIL,
          pass: process.env.MAIL_PASS, // naturally, replace both with your real credentials or an application-specific password
        },
      });

      const mailOptions = {
        from: process.env.FROM_EMAIL,
        to: req.body.email,
        subject: "verify ur email",
        text: `your otp code is ${otp}`,
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          res.status(200).send({
            success: true,
            user: user2,
            message: "User Created Successfully...!!!",
          });
        }
      });
    })
    .catch((err) => {
      console.log("Error is", err);
      res.status(400).send({ success: false, err: err.message });
    });
};

exports.loginUser = (req, res) => {
  if (!req.body.email || !req.body.password) {
    return res.status(400).send({
      success: false,
      message:
        "You have entered Invalid Input, Email and Password field must required...!!!",
    });
  }

  user
    .findOne({ email: req.body.email })
    .select("+password") //find query with comparison of name and password from req.body......!!!
    .exec((error, user2) => {
      if (user.verified == false) {
        console.log("asdfghjk");
        return res.status(400).send({
          success: false,
          message: "User is not verified...!!!",
        });
      }
      if (error) {
        res.status(500).send({
          success: false,
          message: "Internal server error...!!!",
          error: error,
        });
      } else if (user2) {
        console.log(user2);
        user2.comparePassword(req.body.password, function (err, isMatch) {
          if (isMatch && !err) {
            // create token query
            const token = jwt.sign({ user: user2 }, process.env.JWT_SECRET, {
              expiresIn: 10000000000,
            });
            res.status(200).send({ success: true, user: user2, token: token });
          } else {
            res.status(400).send({
              success: false,
              message: "Your Password is incorrect...!!!",
            });
          }
        });
      } else {
        res
          .status(400)
          .send({ success: false, message: "User not found...!!!" });
      }
    });
};

//-----------verification of User email
exports.verifyEmail = function (req, res) {
  user
    .findOne({ email: req.body.email })
    .then((user2) => {
      if (parseInt(req.body.varificationCode) == user2.varificationCode) {
        (user2.verified = true), (user2.varificationCode = null);
        return user2
          .save()
          .then((approvedUser) => {
            res.status(200).send({
              message: "Email is verified...!!!",
              user: approvedUser,
            });
          })
          .catch((err) => {
            res.status(400).send({
              success: false,
              message: "Email is not varified...!!!",
              error: err,
            });
          });
      } else {
        res.status(400).send({
          success: false,
          message: "OTP is incorrect...!!!",
        });
      }
    })
    .catch((err) => {
      res.status(400).send({
        success: false,
        message: "email is not varified...!!!",
        error: err,
      });
    });
};

exports.publishBook = async (req, res) => {
  try {
    const userid = req.body.user_id;
    const publisher = await user.findOne({ _id: userid });
    if (publisher.userRole == "Admin") {
      const newBooks = await books.create({
        userid: publisher.user_id,
        bookTitle: req.body.bookTitle,
        bookPrice: req.body.bookPrice,
        totalBooksAmount: req.body.totalBooksAmount,
      });
      console.log(newBooks);
      console.log("userID", userid);
      return res.status(200).send({
        success: true,
        message: "Publish Book Succesffully",
        newBooks,
      });
    } else {
      res.status(400).send({
        success: false,
        message:
          "You have no authority to publish Books, Only admin can publish books",
      });
    }
  } catch (error) {
    console.log(error);
    res
      .status(400)
      .send({ success: false, message: "internel server error", error });
  }
};

//-----------Update Books
exports.updateBook = async (req, res) => {
  try {
    if (Object.keys(req.body).length < 1) {
      return res.status(400).send({
        success: false,
        message: "You have invalid input........!!!!",
      });
    }
    const userid = req.body.user_id;
    const publisher = await user.findOne({ _id: userid });
    if (publisher.userRole == "Admin") {
      const newBooks = await books.updateOne(
        {
          userid: publisher.user_id,
          _id: req.body._id,
        },
        req.body
      );
      console.log(newBooks);
      return res.status(200).send({
        success: true,
        message: "Updated information successfully",
        newBooks,
      });
    } else {
      res.status(400).send({
        success: false,
        message: "You have no authority, Only Admin can make changes ",
      });
    }
  } catch (error) {
    console.log(error);
    res
      .status(400)
      .send({ success: false, message: "internel server error", error });
  }
};

//-------Assign role to User as Admin
exports.assignRoleToUser = async (req, res) => {
  try {
    const publisherId = req.body._id;
    const userRole = req.body.userRole;
    if (userRole != "Admin") {
      return res.status(400).send({
        success: false,
        message: "You have not Allowed to make changes",
      });
    }
    const publisher = await user.findOne({ _id: publisherId });

    if (publisher.userRole == "Admin") {
      return res
        .status(400)
        .send({ success: false, mesage: "You are already Admin...!!!" });
    }
    if (!publisher) {
      return res.status(400).send({ message: "Invalid user Id" });
    } else if (publisher.userRole == "User") {
      publisher.userRole = userRole;
      publisher.save();
      res.status(200).send({
        success: true,
        message: "Successfully assign the role form user to admin",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(400).send({ message: "error" });
  }
};

exports.buyBooks = async (req, res) => {
  try {
    const booktitle = req.body.bookTitle;
    const quantity = req.body.quantity;
    const searchBook = await books.findOne({ bookTitle: booktitle });

    console.log(searchBook);
    if (!searchBook) {
      return res
        .status(400)
        .send({ success: false, message: "Book not found" });
    }
    if (searchBook.totalBooksAmount < quantity) {
      return res.status(400).send({
        success: false,
        message: `Sorry! Books are not available in such Quantity, only ${searchBook.totalBooksAmount} available in Stock`,
      });
    }
    const totalBooksAmount = searchBook.totalBooksAmount - quantity;
    await books.findByIdAndUpdate(searchBook._id, {
      totalBooksAmount: totalBooksAmount,
    });

    return res.status(200).send({
      success: true,
      message: "You have Buy books Successfully! Thankyou...",
    });
  } catch (error) {
    // console.log(error);
    res.status(500).send({ message: "Internal Server Error...!!!", error });
  }
};

// cloudinary_url = URL.parse process.env.CLOUDINARY_URL
cloudinary.config({
  Cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

exports.uploadImage = async (req, res, next) => {
  try {
    const data = req.file;
    console.log(data);

    await cloudinary.uploader
      .upload(`${data.path}`, {
        resource_type: "auto",
      })
      .then((result) => {
        res.status(200).send({
          message: "success",
          result,
        });
      })
      .catch((error) => {
        console.log(error);
        res.status(500).send({
          message: "failure",
          error,
        });
      });
  } catch (error) {
    console.log(error);
  }
};
