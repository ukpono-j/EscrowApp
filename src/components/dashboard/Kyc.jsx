import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import axios from "axios";
import { useToast } from "@chakra-ui/react";
const BASE_URL = import.meta.env.VITE_BASE_URL;
import { FaUpload } from "react-icons/fa";

const Kyc = () => {
  const [showToggleContainer, setShowToggleContainer] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [formData, setFormData] = useState({
    documentType: "",
    documentPhoto: null,
    personalPhoto: null,
    firstName: "",
    lastName: "",
    dateOfBirth: "",
  });
  const [isKycSubmitted, setIsKycSubmitted] = useState(null);
  const toast = useToast();
  // State to store file previews
  const [documentPhotoPreview, setDocumentPhotoPreview] = useState(null);
  const [personalPhotoPreview, setPersonalPhotoPreview] = useState(null);

  const handleShowProfile = () => {
    setShowToggleContainer(false);
    setShowProfile(true);
  };

  const handleMyTransaction = () => {
    setShowToggleContainer(true);
    setShowProfile(false);
  };

  // const handleInputChange = (e) => {
  //   const { name, files } = e.target;
  //   const file = files ? files[0] : null;

  //   // Update file preview based on the input name
  //   if (name === "documentPhoto") {
  //     setDocumentPhotoPreview(file ? URL.createObjectURL(file) : null);
  //   } else if (name === "personalPhoto") {
  //     setPersonalPhotoPreview(file ? URL.createObjectURL(file) : null);
  //   }

  //   setFormData((prevData) => ({
  //     ...prevData,
  //     [name]: file,
  //   }));
  // };



  // const handleInputChange = (e) => {
  //   const { name, value, files } = e.target;
  //   let file = null;
  
  //   if (name === "documentPhoto" || name === "personalPhoto") {
  //     file = files ? files[0] : null;
  //     // Update file preview based on the input name
  //     if (name === "documentPhoto") {
  //       setDocumentPhotoPreview(file ? URL.createObjectURL(file) : null);
  //     } else if (name === "personalPhoto") {
  //       setPersonalPhotoPreview(file ? URL.createObjectURL(file) : null);
  //     }
  //   }
  
  //   setFormData((prevData) => ({
  //     ...prevData,
  //     [name]: name === "documentType" ? value : file,
  //   }));
  // };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    let file = null;
  
    if (name === "documentPhoto" || name === "personalPhoto") {
      file = files ? files[0] : null;
      // Update file preview based on the input name
      if (name === "documentPhoto") {
        setDocumentPhotoPreview(file ? URL.createObjectURL(file) : null);
      } else if (name === "personalPhoto") {
        setPersonalPhotoPreview(file ? URL.createObjectURL(file) : null);
      }
    }
  
    setFormData((prevData) => ({
      ...prevData,
      [name]: name === "documentType" ? value : file,
      firstName: name === "firstName" ? value : prevData.firstName,
      lastName: name === "lastName" ? value : prevData.lastName,
    }));
  };
  

  useEffect(() => {
    // Fetch KYC status from your backend
    const fetchKycStatus = async () => {
      try {
        const token = localStorage.getItem("auth-token");
        if (token) {
          axios.defaults.headers.common["auth-token"] = token;
        }
        const response = await axios.get(`${BASE_URL}/api/kyc/kyc-details`, {
          headers: {
            "auth-token": token,
          },
        });

        setIsKycSubmitted(response.data.isKycSubmitted);
      } catch (error) {
        console.error("Error fetching KYC status:", error);
      }
    };

    fetchKycStatus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

      // Basic validation example, adjust as per your requirements
      if (!formData.firstName || !formData.lastName) {
        alert('Please fill out all required fields.');
        return;
      }

    try {
      const token = localStorage.getItem("auth-token");

      const formDataToSend = new FormData();
      formDataToSend.append("documentType", formData.documentType || ""); // Ensure documentType is set or empty string if null
      formDataToSend.append("documentPhoto", formData.documentPhoto); // Assuming documentPhoto is an array with one element
      formDataToSend.append("personalPhoto", formData.personalPhoto); // Assuming personalPhoto is an array with one element
      formDataToSend.append("firstName", formData.firstName || ""); // Ensure firstName is set or empty string if null
      formDataToSend.append("lastName", formData.lastName || ""); // Ensure lastName is set or empty string if null
      
      // Format dateOfBirth to ISO string format
      formDataToSend.append("dateOfBirth", new Date(formData.dateOfBirth).toISOString());
  

      await axios.post(`${BASE_URL}/api/kyc/submit-kyc`, formDataToSend, {
        // await axios.post(`${BASE_URL}/send-message`, {
        headers: {
            "auth-token": token,
          "Content-Type": "multipart/form-data",
          // "auth-token": token,
        },
      });

      toast({
        title: "KYC Submitted Successful",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Reset the form state
      setFormData({
        documentType: "",
        documentPhoto: null,
        personalPhoto: null,
        firstName: "",
        lastName: "",
        dateOfBirth: "",
      });

      // Update KYC status
      setIsKycSubmitted(true);
    } catch (error) {
      console.error("Error submitting KYC:", error);
      // Handle errors as needed
    }
  };

  return (
    <div className="border flex items-center border-black">
      <Sidebar
        onShowProfile={handleShowProfile}
        onShowToggleComponent={handleMyTransaction}
      />
      <div
        style={{ overflowY: "scroll" }}
        className="layout  bg-[#1A1E21] text-[#000]   fixed right-0 top-0 w-[100%]  md:w-[83.2%] h-[100vh]"
      >
        <div
          className={
            showToggleContainer ? "h-[auto] toggleContainer" : "hidden"
          }
        >
          <div className="font-[Poppins] pl-3 pr-3 pb-24   pt-24  flex flex-col  items-center justify-center  ">
            {/* {isKycSubmitted ? (
             <div className="h-[70vh]  w-[100%] flex items-center justify-center text-[24px] font-bold text-[#fff]">
                   <p>KYC Already Submitted</p>
             </div>
            ) : (
       
            )} */}
            {isKycSubmitted !== null ? (
              isKycSubmitted ? (
                <p className="font-bold text-[#fff] pb-3">
                  KYC Already Submitted
                </p>
              ) : (
                <p className="font-bold text-[#fff] pb-3">
                  {isKycDetailsEmpty
                    ? "You need to submit KYC details for security checks."
                    : "Loading..."}
                </p>
              )
            ) : (
              <p className="font-bold text-[#fff] pb-3">Loading...</p>
            )}

            <form
              action=""
              onSubmit={handleSubmit}
              className="w-[80%] text-white bg-[#111518] pt-9  pb-9  pr-5  pl-5  h-[auto] rounded-2xl"
            >
              <h1 className="text-center text-[33px] font-bold">
                KYC Verification
              </h1>
              <p className="text-center  text-[13px]">
                Submit following to initiate KYC Process
              </p>
              <div className=" m-3">
                <label htmlFor="" className="font-[600] uppercase text-[14px]">
                  official Documents
                </label>
                <select
                  name="documentType"
                  value={formData.documentType}
                  onChange={handleInputChange}
                  className="w-[100%] text-[13px] m-1 border border-[#000] outline-none text-[#000] font-bold pl-2 pr-3 h-[40px] border rounded-xl"
                >
                  <option value="">Select Document Type</option>
                  <option value="Drivers License">Drivers License</option>
                  <option value="Nin Slip">NIN Slip</option>
                  <option value="Passport">Passport</option>
                </select>
              </div>
              {/* ================== Document =========== */}
              <div className="w-[100%] flex items-center ">
                <div className=" ml-3 mt-1 mb-3 mr-3  w-[100%]">
                  <label
                    htmlFor=""
                    className="font-[600] uppercase text-[14px]"
                  >
                    Upload Document Photo
                  </label>
                  <div className=" w-[100%] relative  rounded-xl mt-1  flex items-center justify-center  h-[120px] border border-[white]">
                    {documentPhotoPreview && (
                      <img
                        src={documentPhotoPreview}
                        alt="Document Preview"
                        className="w-full h-full object-cover rounded-xl"
                      />
                    )}
                    <div className="absolute flex w-[40px] h-[40px] flex border-2  border-[#318AE6] items-center justify-center  rounded-full bg-[#031420]">
                      <input
                        type="file"
                        name="documentPhoto"
                        onChange={handleInputChange}
                        className="w-[40px] h-[40px]  opacity-0  mt-3   z-20  absolute  text-[14px]"
                      />
                      <FaUpload   color="#fff" className="absolute text-[20px] mb-[4px]" />
                    </div>
                  </div>
                </div>
                <div className=" ml-3 mt-1 mb-3 mr-3  w-[100%]">
                  <label
                    htmlFor=""
                    className="font-[600] uppercase text-[14px]"
                  >
                    Personal Photo
                  </label>
                  <div className=" w-[100%] rounded-xl mt-1  flex items-center justify-center  h-[120px] border border-[#fff]">
                    {personalPhotoPreview && (
                      <img
                        src={personalPhotoPreview}
                        alt="Document Preview"
                        className="w-full h-full object-cover rounded-xl"
                      />
                    )}
                    <div className="absolute flex w-[40px] h-[40px] flex border-2  border-[#318AE6] items-center justify-center  rounded-full bg-[#031420]">
                      <input
                        type="file"
                        name="personalPhoto"
                        onChange={handleInputChange}
                        className="w-[40px] h-[40px]  opacity-0  mt-3   z-20  absolute  text-[14px]"
                      />
                      <FaUpload   color="#fff" className="absolute text-[20px] mb-[4px]" />
                    </div>
                  </div>
                </div>
              </div>
              {/* =================== KYC BIRTH DETAILS */}
              <div className="w-[100%] flex items-center ">
                <div className=" ml-3 mt-1 mb-3 mr-3  w-[100%]">
                  <label
                    htmlFor=""
                    className="font-[600] uppercase text-[14px]"
                  >
                    First Name(As on Document)
                  </label>
                  <div className=" w-[100%] rounded-xl mt-1  flex items-center justify-center  h-[auto]">
                    <input
                      type="text"
                      name="firstName"
                      placeholder="First Name"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="border border-[#000] text-[13px] text-black font-bold pl-3 outline-none w-[100%] h-[38px] rounded-xl"
                    />
                  </div>
                </div>
                <div className=" ml-3 mt-1 mb-3 mr-3  w-[100%]">
                  <label
                    htmlFor=""
                    className="font-[600] uppercase text-[14px]"
                  >
                    Last Name
                  </label>
                  <div className=" w-[100%] rounded-xl mt-1  flex items-center justify-center  h-[auto]">
                    <input
                      type="text"
                      name="lastName"
                      placeholder="Last Name"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="border border-[#000] text-[13px] text-black font-bold  pl-3 outline-none w-[100%] h-[38px] rounded-xl"
                    />
                  </div>
                </div>
              </div>
              {/* ===================== DATE OF BIRTH */}
              <div className=" m-3">
                <label htmlFor="" className="font-[600] uppercase text-[14px]">
                  Date Of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className="w-[100%] text-[13px] m-1 border border-[#000] outline-none text-[#000] font-bold pl-2 pr-3 h-[40px] border rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end">
                <button className="flex items-center justify-center h-[40px] uppercase  font-[600]  rounded-xl   text-[14px]  w-[100px] border-2  border-[#318AE6] m-2">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center justify-center h-[40px] uppercase  font-[600]  rounded-xl   text-[14px]  w-[100px] m-2 bg-[#318AE6] text-[#fff]"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <BottomNav
        onShowProfile={handleShowProfile}
        onShowToggleComponent={handleMyTransaction}
      />
    </div>
  );
};

export default Kyc;
