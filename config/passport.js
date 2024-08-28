const passport=require("passport")
const GoogleStrategy=require("passport-google-oauth20").Strategy;
const User=require("../models/User");
require("dotenv").config()

passport.use(new GoogleStrategy({
    clientID:process.env.GOOGLE_CLIENT_ID,
    clientSecret:process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:"/auth/google/callback"

},
async (accessToken,refreshToken,profile,done) => {
    try {
        let user=await User.findOne({email:profile.emails[0].value})
        if(user){
           return done(null,user)
        }
        else{
            user={
                username:profile.displayName,
                email:profile.emails[0].value,
                googleId:profile.id
            }
            await User.create(user);
            return done(null,user)
        }
        
    } catch (err) {
        return done(err,null)
        
    }
    
}

))

passport.serializeUser((user,done)=>{
    
    done(null,user._id)

})
passport.deserializeUser((id,done)=>{
    User.findById(id)
    .then((user)=>{
        done(null,user)
    })
    .catch(err=>{
        done(err,null)
    })

})
module.exports=passport