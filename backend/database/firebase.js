const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    // or use service account json
  });
}

const db = admin.firestore();

module.exports = db;
