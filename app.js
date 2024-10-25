require('dotenv').config();
const express=require("express")
const path=require("path")
const app=express();
const nocache=require("nocache")
const session=require("express-session")
const DB=require("./config/db")
const flash = require('connect-flash');
const methodOverride = require('method-override')
const userRoutes=require("./routes/userRoutes")
const adminRoutes=require("./routes/adminRoutes")
const passport=require("./config/passport")
const { cartMiddleware, wishlistMiddleware } = require('./middleware/cartMiddleware');

const port= process.env.PORT;
app.use("/public",express.static(path.join(__dirname, 'public')));

app.set("view engine","ejs")

app.use(methodOverride('_method'));
app.use(nocache())
app.use(express.json())
app.use(express.urlencoded({extended:false}))
app.use(session({
    secret:"secret",
     resave:false,
     saveUninitialized:true
 }))
DB()
app.use(flash());

app.use((req, res, next) => {
    res.locals.message = req.flash();
    next();
  });
app.use(passport.initialize())
app.use(passport.session())
app.use("/",cartMiddleware,wishlistMiddleware,userRoutes)
app.use("/admin",adminRoutes)


app.use((req, res) => {
  res.status(404).render("404", { message: "Page Not Found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render("500", { message: "Something went wrong, please try again later" });
});


app.listen(port,()=>console.log(`http://localhost:${port}/`))