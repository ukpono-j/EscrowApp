import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Buffer } from "buffer";
import "./SetAvatar.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loader from "../assets/loaderOne.gif";
const BASE_URL = import.meta.env.VITE_BASE_URL;

const SetAvatar = () => {
  const api = "https://api.multiavatar.com/45678945";
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAvatars, setSelectedAvatars] = useState(undefined);
  const [userData, setUserData] = useState(null);
  const [token, setToken] = useState(null); // State to store the token
  const [imagePreview, setImagePreview] = useState(null);
  const toastOptions = {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
  };

  useEffect(() => {
    // Retrieve the token from localStorage when the component is mounted
    const storedToken = localStorage.getItem("auth-token");
    if (storedToken) {
      setToken(storedToken);
    } else {
      // Redirect to login page if token is not present
      navigate("/login");
    }

    // Simulate loading completion after 2 seconds (adjust the timeout duration as needed)
    const loaderTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    // Cleanup the timeout to prevent memory leaks when the component unmounts
    return () => {
      clearTimeout(loaderTimeout);
    };
  }, [navigate]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("auth-token");
        if (token) {
          axios.defaults.headers.common["auth-token"] = token;
        }
        console.log("Token from localStorage:", token);
        const response = await axios.get(`${BASE_URL}/user-details`, {
          headers: {
            "auth-token": token,
          },
        });
        console.log(response.data);
      } catch (error) {
        console.error("Error fetching user data:", error);
        // Handle the error accordingly, e.g., redirect to login page
        throw error;
      }
    };
    fetchUserData();
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    setSelectedAvatars(file);

    // Read and display the image preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    if (file) {
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const setProfilePicture = async () => {
    try {
      const formData = new FormData();
      formData.append("image", selectedAvatars);

      const response = await axios.post(`${BASE_URL}/setAvatar`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        console.log("Avatar successfully uploaded:", response.data.user);
        toast.success("Profile picture updated successfully!", toastOptions);
        navigate("/messages");
      } else {
        console.log(
          "Error setting avatar. Server response:",
          response.data.error
        );
        toast.error("Error setting profile picture. Please try again.", toastOptions);
      }
    } catch (error) {
      console.error("Error setting avatar:", error);
    }
  };
  return (
    <>
      {isLoading ? (
        <div className="flex items-center justify-center bg-[#000] min-h-[100vh] w-[100vw]">
          <img src={Loader} alt="loader" />
        </div>
      ) : (
        <div className="font-[Poppins] flex items-center justify-center flex-col w-[100vw] min-h-[100vh]  bg-[#131324]">
          <div className="title_container">
            <h1 className="text-[#fff] mb-3">
              Pick a Picture  has a profile picture...
            </h1>
          </div>
          {imagePreview && (
            <div className="image-preview mt-3 border w-[270px] rounded-full  h-[270px]">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-[100%] h-[100%] rounded-full object-cover object-center"
              />
            </div>
          )}
          <div className="avatars mt-3  gap-1  flex">
            <input type="file" accept="image/*" onChange={handleAvatarChange} />
          </div>

          <button
            className="submit-btn  text-[#fff] hover:bg-[#4e0eff] bg-[#997af0] pt-[8px] pb-[8px] pl-[27px] pr-[27px] mt-5  rounded-xl"
            onClick={setProfilePicture}
          >
            Set as profile picture
          </button>
          <ToastContainer />
        </div>
      )}
    </>
  );
};

export default SetAvatar;
