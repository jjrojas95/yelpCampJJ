var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  avatar: {type: Sting, default:"https://s3.amazonaws.com/FringeBucket/default-user.png"},
  firstName: String,
  lastName: String,
  email: String,
  isAdmin: {
    type: Boolean,
    default: false
  }
});

UserSchema.plugin(passportLocalMongoose)

module.exports = mongoose.model("User", UserSchema);