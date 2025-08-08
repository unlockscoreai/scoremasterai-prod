const express = require('express');
const {
  register,
  verifyOtp,
  login,
  refreshToken,
  forgetPassword,
  verifyOtpAndResetPassword,
} = require('../controllers/auth');

const router = express.Router();

router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgetPassword);
router.post('/reset-password', verifyOtpAndResetPassword);

module.exports = router;
