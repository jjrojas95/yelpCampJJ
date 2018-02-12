var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware");
var geocoder = require('geocoder');
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function(req, file, cb) {
  // accept image files only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};
var upload = multer({
  storage: storage,
  fileFilter: imageFilter
})

var cloudinary = require('cloudinary');
cloudinary.config({
  cloud_name: 'img-up',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

//INDEX - show all campgrounds
router.get("/", function(req, res) {
  // Get all campgrounds from DB
  Campground.find({}, function(err, allCampgrounds) {
    if (err) {
      console.log(err);
    } else {
      res.render("campgrounds/index", {
        campgrounds: allCampgrounds,
        page: 'campgrounds'
      });
    }
  });
});

//CREATE - add new campground to DB
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res) {
  // get data from form and add to campgrounds array

  geocoder.geocode(req.body.location, function(err, data) {
    var lat = data.results[0].geometry.location.lat;
    var lng = data.results[0].geometry.location.lng;
    var location = data.results[0].formatted_address;
    req.body.campground.lat = lat;
    req.body.campground.lng = lng;
    req.body.campground.location = location;

    // Create a new campground and save to DB
    cloudinary.uploader.upload(req.file.path, function(result) {
      // add cloudinary url for the image to the campground object under image property
      req.body.campground.image = result.secure_url;
      // add author to campground
      req.body.campground.author = {
        id: req.user._id,
        username: req.user.username
      }
      Campground.create(req.body.campground, function(err, campground) {
        if (err) {
          req.flash('error', err.message);
          return res.redirect('back');
        }
        res.redirect('/campgrounds/' + campground.id);
      });
    });
  });

});

//NEW - show form to create new campground
router.get("/new", middleware.isLoggedIn, function(req, res) {
  res.render("campgrounds/new");
});

// SHOW - shows more info about one campground
router.get("/:id", function(req, res) {
  //find the campground with provided ID
  Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground) {
    if (err) {
      console.log(err);
    } else {
      console.log(foundCampground)
      //render show template with that campground
      res.render("campgrounds/show", {
        campground: foundCampground
      });
    }
  });
});

// EDIT CAMPGROUND ROUTE
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res) {
  Campground.findById(req.params.id, function(err, foundCampground) {
    res.render("campgrounds/edit", {
      campground: foundCampground
    });
  });
});

// UPDATE CAMPGROUND ROUTE
router.put("/:id", middleware.checkCampgroundOwnership, upload.single('image'), function(req, res) {
  // find and update the correct campground
  geocoder.geocode(req.body.campground.location, function(err, data) {
    var newData = req.body.campground;
    newData.lat = data.results[0].geometry.location.lat;
    newData.lng = data.results[0].geometry.location.lng;
    newData.location = data.results[0].formatted_address;
    if (req.file) {
      cloudinary.uploader.upload(req.file.path, function(result) {
        req.body.campground.image = result.secure_url;
        Campground.findById(req.params.id, function(err, foundCamp) {
          var splitUrlReplaceImgage = foundCamp.image.toString().split('/');
          var public_idSplit = splitUrlReplaceImgage[splitUrlReplaceImgage.length - 1].split(".") ;
          var public_id = public_idSplit[0];
          cloudinary.uploader.destroy(public_id, function(result) { console.log(result) });
          Campground.findByIdAndUpdate(req.params.id, {
            $set: newData
          }, function(err, updatedCampground) {
            if (err) {
              req.flash("error", err.message);
              res.redirect("back");
            } else {
              req.flash("success", "Successfully Updated!");
              res.redirect("/campgrounds/" + updatedCampground._id);
            }
          });

        });
      });
    } else {
      Campground.findByIdAndUpdate(req.params.id, {
            $set: newData
          }, function(err, updatedCampground) {
            if (err) {
              req.flash("error", err.message);
              res.redirect("back");
            } else {
              req.flash("success", "Successfully Updated!");
              res.redirect("/campgrounds/" + updatedCampground._id);
            }
          });

    }
    
  });
});

// DESTROY CAMPGROUND ROUTE
router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res) {
  Campground.findByIdAndRemove(req.params.id, function(err) {
    if (err) {
      res.redirect("/campgrounds");
    } else {
      res.redirect("/campgrounds");
    }
  });
});


module.exports = router;