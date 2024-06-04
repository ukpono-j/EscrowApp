import React, { useEffect, useState } from "react";
import axios from "axios";
import { PiWarningCircleBold } from "react-icons/pi";
import { FaEdit, FaUpload } from "react-icons/fa";
const BASE_URL = import.meta.env.VITE_BASE_URL;
import UserProfile from "../../assets/profile_icon.png";

const Profile = () => {
  const [account, setAccount] = useState(true);
  const [pay, setPay] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [help, setHelp] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [editedUserDetails, setEditedUserDetails] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    bank: "",
    accountNumber: "",
  });
  const [preview, setPreview] = useState(null);

  // State to manage edit mode
  const [editMode, setEditMode] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);

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
          dateOfBirth: response.data.dateOfBirth || "",
          bank: response.data.bank || "",
          accountNumber: response.data.accountNumber || "",
        });
      })
      .catch((error) => {
        console.error("Error fetching user details:", error);
      });
  }, []);

  const reloadProfilePic = () => {
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
        setLoadingImage(false);
      });
  };

  const handleAccount = () => {
    setAccount(true);
    setPay(false);
    setHelp(false);
  };

  const handlePay = () => {
    setPay(true);
    setAccount(false);
    setHelp(false);
  };

  const handleHelp = () => {
    setHelp(true);
    setAccount(false);
    setPay(false);
  };

  const obscurePassword = (password) => {
    return "*".repeat(password.length);
  };

  const handleUpdateDetails = () => {
    const token = localStorage.getItem("auth-token");

    axios
      .put(`${BASE_URL}/update-user-details`, editedUserDetails, {
        headers: {
          "auth-token": token,
        },
      })
      .then((response) => {
        axios
          .get(`${BASE_URL}/user-details`, {
            headers: {
              "auth-token": token,
            },
          })
          .then((response) => {
            setUserDetails(response.data);
          })
          .catch((error) => {
            console.error("Error fetching updated user details:", error);
          });

        setEditedUserDetails({
          firstName: "",
          lastName: "",
          dateOfBirth: "",
          bank: "",
          accountNumber: "",
        });

        setEditMode(false); // Turn off edit mode after update

        console.log(response.data.message);
      })
      .catch((error) => {
        console.error("Error updating user details:", error);
      });
  };

  const handleProfileUpdate = () => {
    const token = localStorage.getItem("auth-token");

    // Upload profile picture
    const formData = new FormData();
    formData.append("image", selectedImageFile);

    axios
      .post(`${BASE_URL}/api/users/setAvatar`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => {
        console.log(response.data);
        reloadProfilePic();
      })
      .catch((error) => {
        console.error("Error setting avatar:", error);
      });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      setSelectedImageFile(file);

      // Preview the selected image
      const imageUrl = URL.createObjectURL(file);
      setPreview(imageUrl);
    }
  };

  return (
    <div className="font-[Poppins] pt-7  md:pr-14 pr-5  pl-5  mt-0    md:pl-14 pb-10">
      <h1 className="text-[33px] font-bold join">My Profile</h1>

      <div className="gif border-b-[1px] border-[#81712E] rounded  flex mt-8">
        <h3
          onClick={handleAccount}
          className={`cursor-pointer text-[13px] pl-6  pr-6 ${
            account
              ? "text-[#fff] border-b-[2px]  h-[32px]  border-[#81712E]"
              : ""
          }`}
        >
          Account
        </h3>
        <h3
          onClick={handlePay}
          className={`ml-6 flex items-center   text-[13px] pl-6  pr-6  cursor-pointer ${
            pay ? "text-[#fff] border-b-[2px]  h-[32px]  border-[#81712E]" : ""
          }`}
        >
          <PiWarningCircleBold className="text-[red] text-[25px]" />
          <span className="pl-1">Payout Details</span>
        </h3>
        <h3
          onClick={handleHelp}
          className={`ml-6 text-[14px] pl-6  pr-6  cursor-pointer ${
            help ? "text-[#fff] border-b-[2px]  h-[32px]  border-[#81712E]" : ""
          }`}
        >
          Help
        </h3>
      </div>

      {account && userDetails && (
        <div className=" mt-16 mb-16  md:flex items-center">
          <div className="flex flex-col items-center md:pt-6 pt-9 pb-9  md:pb-6 pr-6 pl-6  rounded-3xl   bg-[#031420] ">
            <div className="md:w-[300px] w-[100%]  h-[auto] text-center   rounded-3xl   flex items-center justify-center">
              {/* Display or style your profile image */}
              {loadingImage ? (
                <p>Loading...</p>
              ) : userDetails.avatarImage ? (
                <div className="relative  flex items-center justify-center">
                  <img
                    src={`${BASE_URL}/images/${userDetails.avatarImage}`}
                    alt="Profile"
                    className="w-[300px] h-full object-cover rounded-3xl"
                  />
                  <div className="absolute flex w-[47px] h-[47px] flex border-2  border-[#81712E] items-center justify-center  rounded-full bg-[#031420]">
                    <input
                      type="file"
                      // onChange={(e) => setSelectedImageFile(e.target.files[0])}
                      onChange={handleImageChange}
                      className="w-[47px] border z-20    opacity-0  cursor-pointer absolute  border-[gray]"
                    />
                    <FaUpload
                      color="#fff"
                      className="absolute text-[20px] mb-[4px]"
                    />
                  </div>
                </div>
              ) : (
                // <span>No Profile Image</span>
                <div className="relative  flex items-center justify-center">
                  <img
                    src={UserProfile}
                    alt=""
                    className="w-[100%] h-[100%] object-cover bg-[#fff] rounded-3xl"
                  />

                  <div className="absolute flex w-[47px] h-[47px] flex border-2  border-[#81712E] items-center justify-center  rounded-full bg-[#031420]">
                    <input
                      type="file"
                      onChange={(e) => setSelectedImageFile(e.target.files[0])}
                      className="w-[47px] border z-20    opacity-0  cursor-pointer absolute  border-[gray]"
                    />
                    <FaUpload
                      color="#fff"
                      className="absolute text-[20px] mb-[4px]"
                    />
                  </div>
                </div>
              )}
            </div>
            {/* ====== Update Profile Picture =========== */}
            {/* <div className="md:w-[300px] w-[100%]  h-[auto]">
              {preview && (
                <div className="absolute   inset-0 flex items-center justify-center">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-[300px] h-[300px] object-cover object-center  rounded-3xl"
                  />
                </div>
              )}
            </div> */}
            <button
              onClick={handleProfileUpdate}
              className="flex text-[14px] items-center   justify-center w-[190px] h-[40px] bg-[#81712E] rounded-xl mt-4"
            >
              Submit Update
            </button>

          </div>
          <div className="md:ml-4 mt-4 md:mt-0  w-[100%] bg-[#031420] pt-4 pb-7 pl-5 pr-5  rounded-3xl">
            <div className=" w-[100%]  flex items-center ">
              <div className="w-[100%]">
                <h4 className="pt-1  text-[115x] font-[700]">First Name</h4>
                {editMode ? (
                  <input
                    type="text"
                    className="text-[#fff] font-bold border border-[#81712E] text-[13px] mt-1  bg-[transparent] h-[32px] pl-2 rounded-3xl w-[100%] "
                    autoComplete="on"
                    value={editedUserDetails.firstName}
                    onChange={(e) =>
                      setEditedUserDetails({
                        ...editedUserDetails,
                        firstName: e.target.value,
                      })
                    }
                  />
                ) : (
                  <p className="text-[14px]">{userDetails.firstName}</p>
                )}
              </div>
              <div className="w-[100%]">
                <h4 className="pt-1  text-[15px] font-[700]">Last Name</h4>
                {editMode ? (
                  <input
                    type="text"
                    className="text-[#fff] font-bold border border-[#81712E] text-[13px] mt-1  bg-[transparent] h-[32px] pl-2 rounded-3xl w-[100%] "
                    autoComplete="on"
                    value={editedUserDetails.lastName}
                    onChange={(e) =>
                      setEditedUserDetails({
                        ...editedUserDetails,
                        lastName: e.target.value,
                      })
                    }
                  />
                ) : (
                  <p className="text-[14px]">{userDetails.lastName}</p>
                )}
              </div>
            </div>
            {/* ====================== Email and Date of Birth */}
            <div className=" flex items-center ">
              <div className="w-[100%]">
                <h4 className="pt-5 text-[1615] font-[700]">Bank Number</h4>
                {editMode ? (
                  <input
                    type="text"
                    className="text-[#fff] font-bold border border-[#81712E] text-[13px] mt-1  bg-[transparent] h-[32px] pl-2 rounded-3xl w-[100%] "
                    autoComplete="on"
                    value={editedUserDetails.accountNumber}
                    onChange={(e) =>
                      setEditedUserDetails({
                        ...editedUserDetails,
                        accountNumber: e.target.value,
                      })
                    }
                  />
                ) : (
                  <p className="text-[14px]">{userDetails.accountNumber}</p>
                )}
              </div>

              <div className="w-[100%] ">
                <h4 className="pt-5 text-[16px] font-[700]">Date of Birth</h4>
                {editMode ? (
                  <input
                    type="text"
                    className="text-[#fff] font-bold border border-[#81712E] text-[13px] mt-1  bg-[transparent] h-[32px] pl-2 rounded-3xl w-[100%] "
                    autoComplete="on"
                    value={editedUserDetails.dateOfBirth}
                    onChange={(e) =>
                      setEditedUserDetails({
                        ...editedUserDetails,
                        dateOfBirth: e.target.value,
                      })
                    }
                  />
                ) : (
                  <p className="text-[15px]">{userDetails.dateOfBirth}</p>
                )}
              </div>
            </div>
            <div>
              <h4 className="pt-5 text-[15px] font-[700]">Bank Name</h4>
              {editMode ? (
                <input
                  type="text"
                  className="text-[#fff] font-bold border border-[#81712E] text-[13px] mt-1  bg-[transparent] h-[32px] pl-2 rounded-3xl w-[100%] "
                  autoComplete="on"
                  value={editedUserDetails.bank}
                  onChange={(e) =>
                    setEditedUserDetails({
                      ...editedUserDetails,
                      bank: e.target.value,
                    })
                  }
                />
              ) : (
                <p className="text-[14px]">{userDetails.bank}</p>
              )}
            </div>

            <div className="w-[100%] ">
              <h4 className="pt-5 text-[16px] font-[700]">Email</h4>
              <p className="text-[15px]">{userDetails.email}</p>
            </div>
            {editMode && (
              <button
                onClick={handleUpdateDetails}
                className="bg-[#81712E] text-[14px]  mt-10  text-white px-4 py-2 rounded"
              >
                Update Details
              </button>
            )}
            {account && userDetails && !editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="bg-[#81712E] text-[14px]  text-white flex items-center  justify-center  px-4 py-2 mt-4 rounded"
              >
                <FaEdit className="mr-2" /> Edit Details
              </button>
            )}
          </div>
        </div>
      )}

      {pay && <div className="pt-4">Pay</div>}
      {help && <div className="pt-4">Help</div>}
      {/* Add Edit icon and handleEdit function */}
    </div>
  );
};

export default Profile;
