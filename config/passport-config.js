const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { comparePassword } = require('../utils/authUtils'); 
const User = require('../models/User');

passport.use('local-with-bcrypt', new LocalStrategy(
  async function (username, password, done) {
    try {
      const user = await User.findOne({ username });
      if (!user) return done(null, false, { message: 'Username not found.' });

      const passwordMatch = await comparePassword(password, user.password);
      if (!passwordMatch) return done(null, false, { message: 'Incorrect password.' });

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

passport.serializeUser(function(user, done) {
  console.log("serializeUser")

  done(null, user.id);
});

passport.deserializeUser(async function (id, done) {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
