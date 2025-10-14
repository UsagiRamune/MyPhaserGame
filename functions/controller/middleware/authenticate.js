const { getAuth } = require("firebase-admin/auth");

const authenticate = async (req, res, next) => {
  const auth = getAuth(); // <-- ย้ายมาไว้ข้างในนี้!
  
  if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
    return res.status(403).send({ error: 'Unauthorized: No token provided.' });
  }
  const idToken = req.headers.authorization.split('Bearer ')[1];
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("🔥 Error verifying token:", error);
    return res.status(403).send({ error: 'Unauthorized: Invalid token.' });
  }
};

module.exports = {
  authenticate
};