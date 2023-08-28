import React,{createContext,useState,useEffect} from "react";
import jwt_decode from "jwt-decode";
import { useNavigate } from "react-router-dom";


export const userContext = createContext();

export const AuthProvider = ({ children })=>{
    const history = useNavigate();
    const [authToken,setAuthToken] = useState(()=> localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null)
    const [user,setUser] = useState(()=> localStorage.getItem('authTokens') ? jwt_decode(localStorage.getItem('authTokens')) : null)
    const [message,setMessage] = useState('')


    const loginUser = async(e)=>{
        e.preventDefault();

        const response = await fetch('http://127.0.0.1:8000/api/token/',{
            method: 'POST',
            headers:{
                'Content-Type': 'application/json'
            },
            body : JSON.stringify({ 'username': e.target.username.value, 'password': e.target.password.value})
        })
        let data = await response.json();
        if(response.status === 200){
            setAuthToken(data)
            setUser(jwt_decode(data.access))
            localStorage.setItem('authTokens', JSON.stringify(data))
            history('/profile')
        }else if(response.status === 401){
            setMessage('User does not exist')
        }
        else{
            alert('Something went wrong')
        }
    }

    const logoutUser = ()=>{
        setAuthToken(null)
        setUser(null)
        localStorage.removeItem('authTokens')
        history('/login')
    }

    const refreshToken = async()=>{
        const response = await fetch('http://127.0.0.1:8000/api/token/refresh/',{
            method: 'POST',
            headers:{
                'Content-Type' : 'application/json'
            },
            body: JSON.stringify({ 'refresh': authToken.refresh})
        })
        let data = await response.json();
        if(response.status === 200){
            setAuthToken(data)
            setUser(jwt_decode(data.access))
            localStorage.setItem('authToken', JSON.stringify(data))
        }else{
            logoutUser();
        }
    }

    // USING HARD CODED VALUES
    useEffect(() =>{
        let fourMinutes = 1000 * 6 * 4;
        let interval = setInterval(() =>{
            if(authToken){
                refreshToken();
            }
        }, fourMinutes)

        return ()=> clearInterval(interval)
    },[authToken])


    // USING EXPIRATION TIME FROM THE REFRESH TOKEN
    // useEffect(() => {
    //     const refreshInterval = () => {
    //         if (authToken && authToken.access) {
    //             const accessToken = jwt_decode(authToken.access);
    //             const expirationTime = accessToken.exp * 1000; // Convert to milliseconds
    //             const currentTime = new Date().getTime();
    //             const timeUntilExpiration = expirationTime - currentTime;
                
    //             // Refresh token a bit earlier than the actual expiration time
    //             const refreshThreshold = 1000 * 60 * 5; // 5 minutes in milliseconds
                
    //             // Schedule refresh based on the time remaining until expiration
    //             const interval = setInterval(() => {
    //                 refreshToken();
    //             }, Math.max(timeUntilExpiration - refreshThreshold, 0));
    
    //             return () => clearInterval(interval);
    //         }
    //     };
    
    //     const interval = refreshInterval();
    //     return () => interval && interval();
    // }, [authToken]);



    let contextData = {
        loginUser:loginUser,
        logoutUser:logoutUser,
        user : user,
        authToken: authToken,
        message: message
    }

    return (
        <userContext.Provider value={contextData}>
            { children }
        </userContext.Provider>
    )
}

