const jwtStrategy = require("passport-jwt").Strategy;
const extractJwt = require("passport-jwt").ExtractJwt;
var User = require("../Models/User");
module.exports = function (passport) {
  var opts = {};
  opts.jwtFromRequest = extractJwt.fromAuthHeaderAsBearerToken();

  opts.secretOrKey = process.env.JWT_SECRET;

  passport.use(
    new jwtStrategy(opts, function (_payload, done) {
      if (_payload.user) {
        var uid = _payload.user._id;
      } else {
        if (_payload._doc._id) {
          var uid = _payload._doc._id;
        }
      }
      User.findOne({ _id: uid }, function (err, user) {
        if (err) {
          return done(err, false);
        } else {
          if (!user) {
            done(null, false);
          } else {
            done(null, user);
          }
        }
      });
    })
  );
};
