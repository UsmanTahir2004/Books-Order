const mongoose = require("mongoose");
const bcrypt = require("bcrypt-nodejs");
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const userSchema = new Schema({
  author: ObjectId,
  name: { type: String },
  password: { type: String, select: false },
  email: { type: String },
  date: Date,
  address: { type: String },
  varificationCode: { type: Number },
  isDeleted: { type: Boolean, default: false },
  userRole: {
    type: String,
    enum: ["Admin", "User"],
  },
  verified: {
    type: Boolean,
    default: false,
  },
});

userSchema.pre("save", function (next) {
  var user = this;
  if (this.isModified("password") || this.New) {
    bcrypt.genSalt(10, function (err, salt) {
      if (err) {
        return next(err);
      } else {
        bcrypt.hash(user.password, salt, null, function (err, hash) {
          if (err) {
            next(err);
          } else {
            user.password = hash;
            next();
          }
        });
      }
    });
  } else {
    return next();
  }
});

userSchema.methods.comparePassword = function (pw, cb) {
  console.log(typeof pw, typeof this.password);
  bcrypt.compare(pw, this.password, function (err, isMatch) {
    if (err) {
      console.log("error", err);
      return cb(err);
    } else {
      cb(null, isMatch);
    }
  });
};

const userModel = mongoose.model("User", userSchema);
module.exports = userModel;
