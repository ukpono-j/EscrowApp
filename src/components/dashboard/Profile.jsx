import React, { useEffect, useState } from "react";
import axios from "axios";
import { PiWarningCircleBold } from "react-icons/pi";
import { FaEdit } from "react-icons/fa";
const BASE_URL = import.meta.env.VITE_BASE_URL;



const Profile = () => {
  const [account, setAccount] = useState(true);
  const [pay, setPay] = useState(false);
  const [help, setHelp] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [editedUserDetails, setEditedUserDetails] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    bank: "",
    accountNumber: "",
  });

  // State to manage edit mode
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("auth-token");
    if (token) {
      axios.defaults.headers.common["auth-token"] = token;
    }

    axios
      .get(`${BASE_URL}/user-details`, {
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

  return (
    <div className="font-[Poppins] pt-14 md:pr-14 pr-10 pl-10 mt-10 md:pl-14 pb-10">
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
        <div className=" mt-16  flex">
          <div className="w-[300px] h-[300px] text-center   rounded-3xl ml-14 border  flex items-center justify-center">
            {/* Display or style your profile image */}
            {userDetails.avatarImage ? (
              <img
                src={userDetails.avatarImage}
                alt="Profile"
                className="w-full h-full object-cover rounded-3xl"
              />
            ) : (
              <span>No Profile Image</span>
            )}
          </div>
          <div className="pl-4">
            <div className="flex w-[100%] justify-between">
              <div className="">
                <h4 className="pt-5 text-[16px] font-[700]">First Name</h4>
                {editMode ? (
                  <input
                    type="text"
                    value={editedUserDetails.firstName}
                    onChange={(e) =>
                      setEditedUserDetails({
                        ...editedUserDetails,
                        firstName: e.target.value,
                      })
                    }
                  />
                ) : (
                  <p>{userDetails.firstName}</p>
                )}
              </div>
              <div className="">
                <h4 className="pt-5 text-[16px] font-[700]">Last Name</h4>
                {editMode ? (
                  <input
                    type="text"
                    value={editedUserDetails.lastName}
                    onChange={(e) =>
                      setEditedUserDetails({
                        ...editedUserDetails,
                        lastName: e.target.value,
                      })
                    }
                  />
                ) : (
                  <p>{userDetails.lastName}</p>
                )}
              </div>
            </div>
            <div>
              <h4 className="pt-5 text-[16px] font-[700]">Email</h4>
              <p className="text-[]">{userDetails.email}</p>
            </div>
            <div>
              <h4 className="pt-5 text-[16px] font-[700]">Date of Birth</h4>
              {editMode ? (
                <input
                  type="text"
                  value={editedUserDetails.dateOfBirth}
                  onChange={(e) =>
                    setEditedUserDetails({
                      ...editedUserDetails,
                      dateOfBirth: e.target.value,
                    })
                  }
                />
              ) : (
                <p>{userDetails.dateOfBirth}</p>
              )}
            </div>
            <div>
              <h4 className="pt-5 text-[16px] font-[700]">Bank Name</h4>
              {editMode ? (
                <input
                  type="text"
                  value={editedUserDetails.bank}
                  onChange={(e) =>
                    setEditedUserDetails({
                      ...editedUserDetails,
                      bank: e.target.value,
                    })
                  }
                />
              ) : (
                <p>{userDetails.bank}</p>
              )}
            </div>
            <div>
              <h4 className="pt-5 text-[16px] font-[700]">Bank Number</h4>
              {editMode ? (
                <input
                  type="text"
                  value={editedUserDetails.accountNumber}
                  onChange={(e) =>
                    setEditedUserDetails({
                      ...editedUserDetails,
                      accountNumber: e.target.value,
                    })
                  }
                />
              ) : (
                <p>{userDetails.accountNumber}</p>
              )}
            </div>
            {editMode && (
              <button
                onClick={handleUpdateDetails}
                className="bg-blue-500 text-white px-4 py-2 mt-4 rounded"
              >
                Update Details
              </button>
            )}
          </div>
        </div>
      )}

      {pay && <div className="pt-4">Pay</div>}
      {help && <div className="pt-4">Help</div>}
      {/* Add Edit icon and handleEdit function */}
      {account && userDetails && !editMode && (
        <button
          onClick={() => setEditMode(true)}
          className="bg-blue-500 text-white px-4 py-2 mt-4 rounded"
        >
          <FaEdit className="mr-2" /> Edit Details
        </button>
      )}
    </div>
  );
};

export default Profile;
