import React, { useEffect, useState } from "react";
import Profile_image from "../../assets/profile.png";
import { PiWarningCircleBold } from "react-icons/pi";
import axios from "axios";
const BASE_URL = import.meta.env.VITE_BASE_URL ;

const Profile = () => {
  const [account, setAccount] = useState(true);
  const [pay, setPay] = useState(false);
  const [help, setHelp] = useState(false);
  const [userDetails, setUserDetails] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("auth-token");
    if (token) {
      axios.defaults.headers.common["auth-token"] = token;
    }
    // Fetch user details from the backend after component mounts
    axios
      .get(`${BASE_URL}/user-details`, {
        headers: {
          "auth-token": token,
        },
      })
      .then((response) => {
        setUserDetails(response.data); // Set the user details in the state
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

  // Function to obscure the password
  const obscurePassword = (password) => {
    return "*".repeat(password.length); // Replace each character with '*'
  };

  return (
    <div className="font-[Poppins] md:pl-20 pl-4  pr-4  md:pr-20 pt-14  pb-10">
      <h1 className="text-[30px] font-bold">My Profile</h1>

      <div className="gif border-b-[1px] border-[#D8D3EB]   flex mt-8">
        <h3
          onClick={handleAccount}
          className={`cursor-pointer text-[13px] pl-6  pr-6 ${
            account
              ? "text-[#000] border-b-[4px]  h-[32px]  border-blue-500"
              : ""
          }`}
        >
          Account
        </h3>
        <h3
          onClick={handlePay}
          className={`ml-6 flex items-center   text-[13px] pl-6  pr-6  cursor-pointer ${
            pay ? "text-[#000] border-b-[4px]  h-[32px]  border-blue-500" : ""
          }`}
        >
          <PiWarningCircleBold className="text-[red] text-[25px]" />
          <span className="pl-1">Payout Details</span>
        </h3>
        <h3
          onClick={handleHelp}
          className={`ml-6 text-[14px] pl-6  pr-6  cursor-pointer ${
            help ? "text-[#000] border-b-[4px]  h-[32px]  border-blue-500" : ""
          }`}
        >
          Help
        </h3>
      </div>
      {account && userDetails && (
        <div className=" mt-16  flex">
          <div>
            <h4 className="pt-5 text-[16px] font-[700]">First Name</h4>
            <p>{userDetails.firstName} </p>
            <h4 className="pt-5 text-[16px] font-[700]">Last Name</h4>
            <p>{userDetails.lastName}</p>
            <h4 className="pt-5 text-[16px] font-[700]">Email</h4>
            <p className="text-[]">{userDetails.email}</p>
            <h4 className="pt-5 text-[16px] font-[700]">Date of Birth</h4>
            <p>{userDetails.dateOfBirth} </p>
            <div className="w-[300px]">
              <h4 className="pt-5 text-[16px] font-[700]">Password</h4>
              {/* <p className="text-[]">{userDetails.password}</p> */}
              <p className="text-[]">{obscurePassword(userDetails.password)}</p>
            </div>
          </div>
          <div className="w-[300px] ml-14 flex items-center justify-center">
            <img src={Profile_image} alt="" />
          </div>
        </div>
      )}
      {pay && (
        <div className="pt-4">
          <h4 className="pt-5 text-[16px] font-[700]">Bank Name</h4>
          <p>{userDetails.bank} </p>
          <h4 className="pt-5 text-[16px] font-[700]">Bank Number</h4>
          <p>{userDetails.accountNumber} </p>
        </div>
      )}
      {help && <div className="pt-4">Help</div>}
    </div>
  );
};

export default Profile;
