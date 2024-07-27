import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaEdit, FaUpload } from "react-icons/fa";
import UserProfile from "../../assets/profile_icon.png";
const BASE_URL = import.meta.env.VITE_BASE_URL;



const Profile = () => {
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [editedUserDetails, setEditedUserDetails] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    bank: "",
    accountNumber: "",
  });
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("auth-token");
    if (token) {
      axios.defaults.headers.common["auth-token"] = token;
    }

    axios
      .get(`${BASE_URL}/api/users/user-details`, {
        headers: {
          "auth-token": token,
        },
      })
      .then((response) => {
        setUserDetails(response.data);
        setEditedUserDetails({
          firstName: response.data.firstName,
          lastName: response.data.lastName,
          dateOfBirth: response.data.dateOfBirth,
          bank: response.data.bank,
          accountNumber: response.data.accountNumber,
        });
      })
      .catch((error) => {
        console.error("Error fetching user details:", error);
      });
  }, []);

  useEffect(() => {
    if (selectedImageFile) {
      const filePreview = URL.createObjectURL(selectedImageFile);
      setPreview(filePreview);
    } else {
      setPreview(null);
    }
  }, [selectedImageFile]);

  const handleUpdateDetails = () => {
    setLoading(true);
    axios
      .put(
        `${BASE_URL}/api/users/update-user-details`,
        { ...editedUserDetails },
        {
          headers: {
            "auth-token": localStorage.getItem("auth-token"),
          },
        }
      )
      .then((response) => {
        setUserDetails(response.data);
        setEditMode(false);
        console.log("User details updated successfully.");
      })
      .catch((error) => {
        console.error("Error updating user details:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleImageUpload = () => {
    setLoading(true);
    const formData = new FormData();
    formData.append("image", selectedImageFile);

    axios
      .post(`${BASE_URL}/api/users/setAvatar`, formData, {
        headers: {
          "auth-token": localStorage.getItem("auth-token"),
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => {
        setUserDetails(response.data.user);
        setSelectedImageFile(null);
        console.log("Avatar updated successfully.");
      })
      .catch((error) => {
        console.error("Error updating avatar:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="font-[Poppins] pt-7 bg-[#1A1E21] md:pr-14 pr-5 pl-5 mt-0 md:pl-14 pb-10">
      <h1 className="text-[33px] font-bold">My Profile</h1>
      {userDetails && (
        <div className="flex flex-col md:flex-row items-center mt-6">
          <div className="relative">
            {/* <img
              src={preview || (userDetails.avatarImage ? `${BASE_URL}/${userDetails.avatarImage}` : UserProfile)}
              alt="Profile"
              className="w-32 h-32 rounded-full bg-cover"
            /> */}
            <div className="w-32 h-32 rounded-full overflow-hidden">
              <img
                src={preview || `${BASE_URL}/${userDetails.avatarImage}`}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null; // Prevents infinite loop if fallback image fails
                  e.target.src = UserProfile; // Fallback image
                }}
              />
            </div>
            <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-[#318AE6] p-2 rounded-full cursor-pointer">
              <FaUpload className="text-white" />
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedImageFile(e.target.files[0])}
              className="hidden"
            />
            {selectedImageFile && (
              <button
                onClick={handleImageUpload}
                className="absolute bottom-0 left-0 bg-[#318AE6] text-white p-2 rounded-md mt-2"
              >
                {loading ? "Uploading..." : "Upload Avatar"}
              </button>
            )}
          </div>

          <div className="ml-0 md:ml-10 mt-4 md:mt-0">
            <div className="flex justify-end">
              <button
                onClick={() => setEditMode(!editMode)}
                className="flex items-center cursor-pointer bg-[#031420] border-[1px] border-[#318AE6] rounded-md"
              >
                <FaEdit color="#318AE6" className="text-[15px] ml-2" />
                <span className="text-[#318AE6] text-[12px] p-1 pr-2">
                  {editMode ? "Cancel Edit" : "Edit Profile"}
                </span>
              </button>
            </div>

            <div className="flex md:flex-row flex-col mt-4">
              <div className="mt-2">
                <h3 className="text-[12px] text-[#B0B0B0]">First Name</h3>
                {editMode ? (
                  <input
                    type="text"
                    value={editedUserDetails.firstName}
                    onChange={(e) => setEditedUserDetails({ ...editedUserDetails, firstName: e.target.value })}
                    className="w-[100%] rounded-md p-2 bg-[#1A1E21] border-[1px] border-[#318AE6]"
                  />
                ) : (
                  <p className="text-[13px] text-[#fff]">{userDetails.firstName}</p>
                )}
              </div>

              <div className="md:ml-4 mt-2">
                <h3 className="text-[12px] text-[#B0B0B0]">Last Name</h3>
                {editMode ? (
                  <input
                    type="text"
                    value={editedUserDetails.lastName}
                    onChange={(e) => setEditedUserDetails({ ...editedUserDetails, lastName: e.target.value })}
                    className="w-[100%] rounded-md p-2 bg-[#1A1E21] border-[1px] border-[#318AE6]"
                  />
                ) : (
                  <p className="text-[13px] text-[#fff]">{userDetails.lastName}</p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-[12px] text-[#B0B0B0]">Email Address</h3>
              <p className="text-[13px] text-[#fff]">{userDetails.email}</p>
            </div>

            <div className="mt-4">
              <h3 className="text-[12px] text-[#B0B0B0]">Date of Birth</h3>
              {editMode ? (
                <input
                  type="date"
                  value={editedUserDetails.dateOfBirth}
                  onChange={(e) => setEditedUserDetails({ ...editedUserDetails, dateOfBirth: e.target.value })}
                  className="w-[100%] rounded-md p-2 bg-[#1A1E21] border-[1px] border-[#318AE6]"
                />
              ) : (
                <p className="text-[13px] text-[#fff]">{userDetails.dateOfBirth || "Not Provided"}</p>
              )}
            </div>

            <div className="mt-4">
              <h3 className="text-[12px] text-[#B0B0B0]">Bank</h3>
              {editMode ? (
                <input
                  type="text"
                  value={editedUserDetails.bank}
                  onChange={(e) => setEditedUserDetails({ ...editedUserDetails, bank: e.target.value })}
                  className="w-[100%] rounded-md p-2 bg-[#1A1E21] border-[1px] border-[#318AE6]"
                />
              ) : (
                <p className="text-[13px] text-[#fff]">{userDetails.bank || "Not Provided"}</p>
              )}
            </div>

            <div className="mt-4">
              <h3 className="text-[12px] text-[#B0B0B0]">Account Number</h3>
              {editMode ? (
                <input
                  type="text"
                  value={editedUserDetails.accountNumber}
                  onChange={(e) => setEditedUserDetails({ ...editedUserDetails, accountNumber: e.target.value })}
                  className="w-[100%] rounded-md p-2 bg-[#1A1E21] border-[1px] border-[#318AE6]"
                />
              ) : (
                <p className="text-[13px] text-[#fff]">{userDetails.accountNumber || "Not Provided"}</p>
              )}
            </div>

            {editMode && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleUpdateDetails}
                  className="bg-[#318AE6] text-white p-2 rounded-md"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
