import jwt from 'jsonwebtoken';
import User from "../models/User.js";

//generate token for a user

export const generateToken = (userId) => {
    const token = jwt.sign({userId}, process.env.JWT_SECRET); 
    return token;
}