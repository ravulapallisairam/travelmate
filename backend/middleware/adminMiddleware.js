export const isAdmin = (req, res, next) => {
     if (req.user && req.user.email === process.env.ADMIN_EMAIL) {
       next();
     } else {
       res.status(403).json({ message: "Admin access only" });
     }
   };