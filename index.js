if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Post = require("./models/post");
const ejs = require("ejs");
let port = 8080;
const path = require("path");
const ejsmate = require("ejs-mate");
const methodOverride = require("method-override");
const multer = require("multer");
const cloudinaryStorage = require("multer-storage-cloudinary");
const { postImageStorage, userPicStorage } = require("./cloudConfig.js");
const Booking = require("./models/booking");
const User = require("./models/user.js");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const session = require("express-session");
const { isLoggedIn ,redirectUrl} = require("./middleware.js");
const Contact = require("./models/contact.js");

const sessionOptions = {
  secret: "secretcode",
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.engine("ejs", ejsmate);
app.use(methodOverride("_method"));
app.use(session(sessionOptions));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

app.get("/", (req, res) => {
  res.send("Connection success");
});

// Posts route
app.get("/posts", async (req, res) => {
  let allPosts = await Post.find({});
  res.render("post/index.ejs", { allPosts });
});

// Show route
app.get("/posts/:id", async (req, res) => {
  let id = req.params.id;
  let post = await Post.findById(id).populate("ownedBy");
  res.render("post/show.ejs", { post });
});

// Edit post route
app.get("/posts/:id/edit", async (req, res) => {
  let id = req.params.id;
  let data = await Post.findById(id);
  res.render("post/edit.ejs", { data });
});

app.patch("/posts/:id/edit",  multer({ storage: postImageStorage }).single("image"),async (req, res) => {
  try {
    let id = req.params.id;
    let editedpost = { ...req.body };
    if(req.file){
        editedpost.image.url=req.file.path;
        editedpost.image.filename=req.file.fieldname;
    }
    await Post.findByIdAndUpdate(id,editedpost, {  new: true });
    res.redirect(`/posts/${id}`);
  } catch (error) {
    console.error("Error editing post:", error);
    res.status(500).send("Internal Server Error");
  }
});

// New post route
app.get("/newpost", isLoggedIn, (req, res) => {
  res.render("post/new.ejs");
});

app.post(
  "/newpost",
  multer({ storage: postImageStorage }).single("image"),
  async (req, res) => {
    let { path, filename } = req.file;
    let newpost = new Post(req.body);
    newpost.image.url = path;
    newpost.image.filename = filename;
    newpost.ownedBy=req.user;
    await newpost.save();
    res.redirect("/posts");
  }
);

// Delete route
app.delete("/delete/:id", async (req, res) => {
  let id = req.params.id;
  await Post.findByIdAndDelete(id);
  console.log("Post deleted");
  res.redirect("/posts");
});

// Home route
app.get("/home", (req, res) => {
  res.render("post/home.ejs");
});


// Contactus route
app.get("/contactus",(req,res)=>{
  res.render("post/contactus.ejs");
});

app.post("/contactus",(req,res)=>{
  let message=new Contact(req.body);
  message.save();
  res.redirect("/posts");
  console.log(`Thank you ${message.name} for your response, we will get back to you at the earliest`);
})

// Booking Routes
app.get("/booking/:id", isLoggedIn, async (req, res) => {
  let id = req.params.id;
  let room = await Post.findById(id);
  res.render("booking/book.ejs", { room });
});

app.post("/booking/:id", async (req, res) => {
  try {
    let id = req.params.id;
    let booking = new Booking(req.body);

    // if checkout date is before checkin date
    if (booking.checkOutDate < booking.checkInDate) {
      return res
        .status(400)
        .send("Checkout date cannot be before check-in date");
    }

    // booking already exists for the given room and date range
    const existingBooking = await Booking.findOne({
      roomId: booking.roomId,
      $or: [
        {
          checkInDate: { $lte: booking.checkOutDate },
          checkOutDate: { $gte: booking.checkInDate },
        },
        {
          checkInDate: {
            $gte: booking.checkInDate,
            $lte: booking.checkOutDate,
          },
        },
      ],
    });

    if (existingBooking) {
      return res.status(400).send("Room is already booked for these dates");
    } else {
      booking.roomStatus = "Booked"; 
      await booking.save();
      return res.send("Room Booked");
    }
  } catch (error) {
    console.error("Error creating booking:", error);
    return res.status(500).send("Internal Server Error");
  }
});

// User Routes
app.get("/register", (req, res) => {
  res.render("user/register.ejs");
});

app.post(
  "/register",
  multer({ storage: userPicStorage }).single("pic"),
  async (req, res) => {
    let user = new User(req.body);
    let url = req.file.path;
    let filename = req.file.filename;
    user.profilePic = { url, filename };
    let password = req.body.password;
    let registeredUser = await User.register(user, password);
    console.log("Regitratoin siudsud");
    res.redirect("/posts");
  }
);

// Login route
app.get("/login", (req, res) => {
  res.render("user/login.ejs");
});

app.post(
  "/login",redirectUrl,
  passport.authenticate("local", { failureRedirect: "/login" }),
  async (req, res) => {
    let url = res.locals.redirectUrl || "/home"; // Corrected line
    res.redirect(url);
  }
);

// Logout route
app.get("/logout", async (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/home");
  });
});

// Location search route
app.post("/rooms/:location", async (req, res) => {
  let location = req.params.location;
  let rooms = await Post.find({ location: location });
  res.send(rooms);
});

// Dasboard
app.get("/dashboard", isLoggedIn, async (req, res) => {
  let user = req.user;
  res.render("user/dashboard.ejs", { user });
});

app.get("/dashboard/edit", isLoggedIn, (req, res) => {
  res.render("user/editDashboard.ejs");
});

app.put(
  "/dashboard/edit",
  multer({ storage: userPicStorage }).single("pic"),
  async (req, res) => {
    try{
        let id = req.user.id;
    let editedUser = { ...req.body };
    if (!editedUser.profilePic) {
        editedUser.profilePic = {};
      }
    if (req.file) {
      editedUser.profilePic.url = req.file.path;
      editedUser.profilePic.filename = req.file.filename;
    }
    await User.findByIdAndUpdate(id, editedUser, { new: true });
    res.redirect("/dashboard");
    }catch(e){
    console.log(e);
    }
  }
);

// About us
app.get("/aboutus", (req, res) => {
  res.render("post/aboutus.ejs");
});

// Mongoose Connection
async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/airbnb");
}

main()
  .then(() => {
    console.log("Connection Established");
  })
  .catch((err) => {
    console.log("Some error in DataBase");
  });

app.listen(port, () => {
  console.log(`App is running at port ${port}`);
});
