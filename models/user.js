var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    require: true
  },
  password: String,
  avatar: {
    type: String,
    default: "https://s3.amazonaws.com/FringeBucket/default-user.png"
  },
  firstName: String,
  lastName: String,
  email: {
    type: String,
    unique: true,
    require: true
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  isAdmin: {
    type: Boolean,
    default: false
  }
});

UserSchema.plugin(passportLocalMongoose)

module.exports = mongoose.model("User", UserSchema);