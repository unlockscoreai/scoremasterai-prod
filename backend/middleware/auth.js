const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer TOKEN"

  if (token == null) {
    // If there's no token, return unauthorized
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      // If token is invalid, return forbidden
      return res.sendStatus(403);
    }

    // Attach user information from the token payload to the request object
    req.user = user;

    // Pass control to the next middleware or route handler
    next();
  });
};

module.exports = {
  verifyToken,
};
