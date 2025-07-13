import express from 'express';
import { checkAuth, loginUser, signupUser, updateProfile } from '../controllers/userController.js';

import { protectRoute } from '../middleware/auth.js';

const userRouter = express.Router();

userRouter.post("/signup",signupUser)
userRouter.post("/login",loginUser)
userRouter.put("/update-profile",protectRoute, updateProfile)
userRouter.get("/check",protectRoute, checkAuth)

export default userRouter;