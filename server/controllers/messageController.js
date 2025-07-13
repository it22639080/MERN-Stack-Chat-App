import User from "../models/User.js";
import Message from "../models/Message.js";
import cloudinary from '../lib/cloudnary.js';
import {io, userSocketMap} from '../server.js';

export const getUsersForSidebar = async (req, res) => {
    try {
        const userId = req.user._id; // Get the logged-in user's ID from the request
        const filteredUser = await User.find({_id:{$ne: userId}}).select("-password"); // Exclude password and __v field
        //count number of unseen messages
        const unseenMessages ={}
        const promises = filteredUser.map(async (user) => {
            const messages = await Message.find({ senderId: user._id, receiverId: userId, seen: false })

            if (messages.length > 0) {
                unseenMessages[user._id] = messages.length; // Store the count of unseen messages
            }
        })
        await Promise.all(promises);
        res.json({
            success: true,
            users: filteredUser,
            unseenMessages // Include the unseen messages count in the response
        });
    } catch (error) {
        console.error("Error fetching users for sidebar:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

// get all messages for selected user
export const getMessages = async (req, res) => {
    try {
        const { id : selectedUserId } = req.params; // Get the userId from the request parameters
        const myId = req.user._id; // Get the logged-in user's ID from the request

        // Find messages between the logged-in user and the selected user
        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: selectedUserId },
                { senderId: selectedUserId, receiverId: myId }
            ]})
        // }).sort({ createdAt: 1 }); // Sort messages by creation time
            await Message.updateMany(
                {
                    senderId: selectedUserId,
                    receiverId: myId},
                    {seen: true}
            );
        res.json({
            success: true,
            messages
        });
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

// api to mark messages as seen
export const markMessagesAsSeen = async (req, res) => {
    try {
        const { id} = req.params; // Get the userId from the request parameters
       
        await Message.findByIdAndUpdate(id, { seen: true });
        res.json({
            success: true,
            
        });
    } catch (error) {
        console.error("Error marking messages as seen:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

// send message to selected user

export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body;
        const receiverId = req.params.id;
        const senderId = req.user._id;

        let imageUrl;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = await Message.create({
            senderId,
            receiverId,
            text,
            image: imageUrl,
        });

        // Emit the new message to the receiver's socket
        const receiverSocketId = userSocketMap[receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        // ✅ Only this response should be sent
        return res.json({
            success: true,
            message: "Message sent successfully",
            newMessage,
        });

    } catch (error) {
        console.error("Error sending message:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
