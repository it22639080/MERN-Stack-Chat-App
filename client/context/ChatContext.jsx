import { createContext ,useState ,useContext , useEffect} from "react";
import { AuthContext } from "./AuthContext";


export const ChatContext = createContext();

export const ChatProvider =({ children }) => {
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [unseenMessages, setUnseenMessages] = useState({});

    const {socket,axios} = useContext(AuthContext);

    // function to get all users
    const getUsers = async () => {
        try {
           const {data} =  await axios.get('/api/messages/users');
              if(data.success) {
                setUsers(data.users);
                setUnseenMessages(data.unseenMessages)
              } else {
                toast.error(data.message);
              }
        } catch (error) {
            toast.error(error.message);
        }
    }

    // function to get messages
    const getMessages = async (userId) => {
        try {
            const {data} = await axios.get(`/api/messages/${userId}`);
            if(data.success) {
                setMessages(data.messages);
                
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    const sendMessage = async (messageData) => {
        try {
            const {data} = await axios.post(`/api/messages/send/${selectedUser._id}`, messageData);
            if(data.success) {
                setMessages((prev) => [...prev, data.message]);
                
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    // function to subscribe to messages for selected USer
    const subscribeToMessages = () => {
        if (!socket) return;
        socket.on('newMessage', (newMessage) => {
           if (selectedUser && newMessage.sender._id === selectedUser._id) {
                newMessage.seen = true;
                setMessages((prev) => [...prev, newMessage]);
                axios.put(`/api/messages/mark/${newMessage._id}`);

            }else{
                setUnseenMessages((prev) => ({
                    ...prev,
                    [newMessage.senderId]: prev[newMessage.senderId] ? prev [newMessage.senderId] + 1 :
                    1
                }));
            }
        });
    }

    //function to unsubscribe from messages

    const unsubscribeFromMessages =()=>{
        if(socket) socket.off("newMessage");
    }
    useEffect(()=>{
        subscribeToMessages();
        return ()=> unsubscribeFromMessages();
    },[socket,selectedUser])

    const value = {
        messages, users , selectedUser , getUsers  
        , sendMessage , setSelectedUser , unseenMessages , setUnseenMessages , getMessages

    }
  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}