import React, { useState } from "react";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useToast } from "@chakra-ui/react";
const BASE_URL = import.meta.env.VITE_BASE_URL ;
import Logo from "../assets/logo2.png"

const Register = () => {
  const [firstName, setFirstName] = useState();
  const [lastName, setLastName] = useState();
  const [password, setPassword] = useState();
  const [email, setEmail] = useState();
  const [bank, setBank] = useState();
  const [accountNumber, setAccountNumber] = useState();
  const [dateOfBirth, setDateOfBirth] = useState();
  const navigate = useNavigate();
  const toast = useToast();

// sd
  
  const handleSubmit = (e) => {
    e.preventDefault();
    axios
    .post(`${BASE_URL}/api/auth/register`, {
        firstName,
        lastName,
        password,
        email,
        dateOfBirth,
      })
      .then((result) => {
        console.log(result);
        toast({
          title: "Account created Successfully.",
          description: "We've created your account for you.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        navigate("/login");
      })
      .catch((err) => console.log(err));
  };

  return (
    <div>
      <div className="w-[100%] min-h-[100vh] flex-col  flex items-center justify-center pt-10  pb-14 pl-5 pr-5   bg-[#fff]">
        <div className="absolute top-[40px] font-bold font-[Poppins] text-[36px] text-[#031420] md:left-[100px] left-[27px]">
          <Link to="/" className="outline-none">
          <img src={Logo} alt="Logo Detail"  className="w-[200px]"/>
          </Link>
        </div>
        <form
          action=""
          onSubmit={handleSubmit}
          className="pt-10  mt-24  text-[] pb-10 pl-5 pr-5  bg-[#031420] font-[Poppins] rounded-xl md:w-[500px] w-[100%] border border-[#031420] h-[auto]"
        >
          <h3 className="text-[#fff]">All fields are required*</h3>
          <div className="mt-5">
            <label htmlFor="" className="text-[13px] text-[#fff]">
              First Name
            </label>
            <input
              type="text"
              name="first_name"
              onChange={(e) => setFirstName(e.target.value)}
              id=""
              required
              placeholder="First Name"
              className=" w-[100%] text-[13px] mt-1  pl-3  h-[40px] border-[#D8D3EB] border rounded"
            />
          </div>
          <div className="mt-5">
            <label htmlFor="" className="text-[13px] text-[#fff]">
              Last Name
            </label>
            <input
              type="text"
              required
              name="last_name"
              onChange={(e) => setLastName(e.target.value)}
              id=""
              placeholder="Last  Name"
              className=" w-[100%] text-[13px] mt-1  pl-3  h-[40px] border-[#D8D3EB] border rounded"
            />
          </div>
          <div className="mt-5">
            <label htmlFor="" className="text-[13px] text-[#fff]">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              required
              onChange={(e) => setEmail(e.target.value)}
              id=""
              placeholder="Enter Email Address"
              className=" w-[100%] text-[13px] mt-1  pl-3  h-[40px] border-[#D8D3EB] border rounded"
            />
          </div>
  
          <div className="mt-5">
            <label htmlFor="" className="text-[13px] text-[#fff]">
              Date of Birth
            </label>
            <input
              type="date"
              name="dateOfBirth"
              required
              onChange={(e) => setDateOfBirth(e.target.value)}
              id=""
              className=" w-[100%] pr-2  text-[13px] text-[#000] mt-1  pl-3  h-[40px] border-[#D8D3EB] border rounded"
            />
          </div>
          <div className="mt-3">
            <label htmlFor="" className="text-[13px] text-[#fff]">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              onChange={(e) => setPassword(e.target.value)}
              id=""
              placeholder="Enter Password"
              className=" w-[100%] text-[13px] mt-1  pl-3  h-[40px] border-[#D8D3EB] border rounded"
            />
          </div>
          <div className="mt-3">
            <label htmlFor="" className="text-[13px] text-[#fff]">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirm_password"
              id=""
              required
              placeholder="Confirm Password"
              className=" w-[100%] text-[13px] mt-1  pl-3  h-[40px] border-[#D8D3EB] border rounded"
            />
          </div>
          <button
            type="submit"
            
            className="w-[100%] flex  items-center justify-center  h-[50px] text-[14px] border-2   border-[#2D6B76] hover:border hover:border-[#81712E]  rounded-xl mt-5  text-[#0F0821] hover:bg-[#81712E] hover:text-[#fff] text-[#fff] bg-[#072534]"
          >
            Register
          </button>
        </form>
        <p className="mt-4 font-[Poppins] text-[grey] text-[13px]">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-[#000] outline-none  font-bold underline"
          >
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
