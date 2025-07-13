// signup new user
import { generateToken } from '../lib/utils.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import cloudinary from '../lib/cloudnary.js';

export const signupUser = async (req, res) => {
    const { email, fullName, password, bio } = req.body;

    try {
        // Check if user already exists
       
        if (!fullName || !email || !password || !bio) {
            return res.status(400).json({ success:false, message: "Missing detais" });
        }
        const user = await User.findOne({ email });
        if (user) { 
            return res.status(400).json({ success:false, message: "User already exists" });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = await User.create({
            email,
            fullName,
            password: hashedPassword,
            //profilePic: profilePic || "https://default-avatar.com/avatar.png",
            bio
        });
        const token = generateToken(newUser._id)

        res.json({
            success: true, userData : newUser, token , 
            message: "Account created successfully"
           })

        // Save user to database

    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ success:false, message: "Internal server error" });
    }
}

// login user 
export const loginUser = async (req, res) => {
    
    try {
        const { email, password } = req.body;
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success:false, message: "User does not exist" });
        }

        // Check password
       
         const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(400).json({ success:false, message: "Invalid credentials" });
        }

        // Generate token
        const token = generateToken(user._id);

        res.json({
    success: true,
    userData: user,
    token,
    message: "Login successful"
});

    } catch (error) {
        console.error("Error logging in user:", error);
        res.status(500).json({ success:false, message: "Internal server error" });
    }
}
 export const checkAuth = (req, res) => {
    if (req.user) {
        return res.json({ success: true, user: req.user });
    } else {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
}

// update user profile
export const updateProfile = async (req, res) => {
    

    try {

        const {profilePic, fullName, bio } = req.body;
        // Validate input
       const userId = req.user._id;
       let updatedUser;

       if(!profilePic){
        await User.findByIdAndUpdate(userId, {
            fullName,
            bio
        }, { new: true });
       }else{
        const upload = await cloudinary.uploader.upload(profilePic);
        
        updatedUser = await User.findByIdAndUpdate(userId, {
            profilePic: upload.secure_url, 
            bio,fullName
        }, { new: true });         
       }
       res.json({
            success: true,
            userData: updatedUser,
            message: "Profile updated successfully"
        });

    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}