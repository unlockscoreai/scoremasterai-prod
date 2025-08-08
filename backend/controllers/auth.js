const db = require('../database/firebase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // Import jsonwebtoken
const { v4: uuidv4 } = require('uuid'); // Import uuid for generating OTPs
const { getFirestore, doc, setDoc, collection, query, where, getDocs } = require('firebase/firestore'); // Import Firestore functions
const nodemailer = require('nodemailer');

// Environment variables (ensure you have a .env file and load it, e.g., using dotenv)
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '15m';
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

// Nodemailer transporter setup (replace with your actual email service config)
const transporter = nodemailer.createTransport({
  service: 'gmail', // e.g., 'gmail'
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

const sendEmail = async (to, subject, text, html) => {
  try {
    await transporter.sendMail({
      from: `"UnlockScore AI" <${EMAIL_USER}>`, // sender address
      to: to, // list of receivers
      subject: subject, // Subject line
      text: text, // plain text body
      html: html, // html body
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
    throw new Error('Failed to send verification email.');
  }
};

exports.register = async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;

  if (!firstName || !lastName || !email || !password || !role) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    // Check if user already exists
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP (simple 6-digit number or a UUID for stronger security)
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); 

    // Save user data to Firestore
    const newUserRef = doc(collection(db, 'users'));
    await setDoc(newUserRef, {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      otp,
      isVerified: false,
      createdAt: new Date(),
    });

    // Send OTP email
    await sendEmail(email, 'Verify Your UnlockScore AI Account', `Your OTP is: ${otp}`, `<p>Your OTP is: <strong>${otp}</strong></p>`);

    res.status(201).json({ message: 'User registered successfully. Please verify your email with the OTP.', userId: newUserRef.id });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'An error occurred during registration.' });
  }
};

exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required.' });
  }

  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    if (userData.isVerified) {
      return res.status(400).json({ message: 'Email already verified.' });
    }

    if (userData.otp === otp) {
      // Mark user as verified
      await setDoc(userDoc.ref, { isVerified: true, otp: null }, { merge: true }); // Set otp to null after verification

      res.status(200).json({ message: 'Email verified successfully.' });
    } else {
      res.status(400).json({ message: 'Invalid OTP.' });
    }
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'An error occurred during OTP verification.' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    // Find the user by email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, userData.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Check if user is verified
    if (!userData.isVerified) {
      return res.status(403).json({ message: 'Email not verified. Please verify your email using the OTP.' });
    }

    // Generate JWT tokens
    const accessToken = jwt.sign({ userId: userDoc.id, role: userData.role }, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
    const refreshToken = jwt.sign({ userId: userDoc.id }, REFRESH_TOKEN_SECRET, { expiresIn: '7d' }); // Refresh token typically has a longer expiry

    // Store refresh token in Firestore (or a separate refresh token collection for better management)
    // For simplicity, we'll store it on the user document for now. In a real app, consider a dedicated collection.
    await setDoc(userDoc.ref, { refreshToken: refreshToken }, { merge: true });

    // Send refresh token as an HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      sameSite: 'strict', // Adjust as needed
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Send access token in the response
    res.status(200).json({ accessToken });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'An error occurred during login.' });
  }
};

exports.refreshToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token not provided.' });
  }

  try {
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);

    // Find the user associated with the refresh token
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('refreshToken', '==', refreshToken));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return res.status(403).json({ message: 'Invalid refresh token.' });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    // Generate a new access token
    const newAccessToken = jwt.sign({ userId: userDoc.id, role: userData.role }, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });

    // Send the new access token in the response
    res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(403).json({ message: 'Invalid or expired refresh token.' });
  }
};
 
exports.forgetPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  try {
    // Find the user by email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // Return a generic success message to avoid revealing if an email is registered
      return res.status(200).json({ message: 'If a user with this email exists, a password reset OTP has been sent.' });
    }

    const userDoc = snapshot.docs[0];

    // Generate a new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save the new OTP to the user's document
    await setDoc(userDoc.ref, { otp: otp }, { merge: true });

    // Send OTP email for password reset
    await sendEmail(email, 'UnlockScore AI Password Reset OTP', `Your password reset OTP is: ${otp}`, `<p>Your password reset OTP is: <strong>${otp}</strong></p>`);

    res.status(200).json({ message: 'If a user with this email exists, a password reset OTP has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'An error occurred during the forgot password process.' });
  }
};

exports.verifyOtpAndResetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ message: 'Email, OTP, and new password are required.' });
  }

  try {
    // Find the user by email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    // Check if the provided OTP matches the stored OTP
    if (userData.otp !== otp) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password and clear the OTP
    await setDoc(userDoc.ref, {
      password: hashedNewPassword,
      otp: null, // Clear the OTP after successful reset
    }, { merge: true });

    res.status(200).json({ message: 'Password reset successfully.' });
  } catch (error) {
    console.error('Verify OTP and reset password error:', error);
    res.status(500).json({ message: 'An error occurred during password reset.' });
  }
};

// Note: You might want to add a timestamp to the OTP and check for its expiry
// in both verifyOtp and verifyOtpAndResetPassword functions for better security.
// Also, consider rate limiting for OTP verification attempts.

// Example of adding timestamp and checking expiry:
// When generating OTP:
// const otpTimestamp = new Date();
// Save otp and otpTimestamp to user document
//
// When verifying OTP:
// Check if current time is within OTP_EXPIRY_TIME from otpTimestamp
// if expired, treat as invalid OTP.

