import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useToast } from "@chakra-ui/react";
const BASE_URL = import.meta.env.VITE_BASE_URL;
import Logo from "../assets/logo2.png"

const Login = () => {
  const [password, setPassword] = useState();
  const [email, setEmail] = useState();
  const navigate = useNavigate();
  const toast = useToast();


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/login`, {
        email,
        password,
      });
      const { message, token } = response.data;

      if (message === "Login successful!") {
        // Store the token in localStorage
        localStorage.setItem("auth-token", token);

        // Set the authentication token in Axios headers
        axios.defaults.headers.common["auth-token"] = token;
        // console.log("token", token);
        toast({
          title: "Login Successful.",
          description: "Welcome back!",
          status: "success",
          duration: 5000,  // Reduced duration for quicker disappearance
          isClosable: true,
        });
        // Redirect the user to the dashboard
        navigate("/dashboard");
    
      } else {
        // Handle invalid credentials
        toast({
          title: "Invalid Credentials.",
          description: "",
          status: "error",
          duration: 9000,
          isClosable: true,
        });
      }
    } catch (error) {
      // Handle API errors or network issues
      console.error(error);
      toast({
        title: "An Error Occurred.",
        description: "",
        status: "error",
        duration: 9000,
        isClosable: true,
      });
    }
  };

  return (
    <div>
      {/* <Navbar/>  */}
      <div className="w-[100%] min-h-[100vh] flex-col  flex items-center justify-center pt-10  pb-5 pl-5 pr-5   bg-[#fff]">
        <div className="absolute top-[40px] font-bold font-[Poppins] text-[36px] text-[#031420] md:left-[100px] left-[27px]">
          <Link to="/" className="outline-none">
          {/* MiddleMan */}
          <img src={Logo} alt="Logo Detail"  className="w-[200px]"/>
          </Link>
        </div>
        <form
          action=""
          onSubmit={handleSubmit}
          className="pt-10 mt-8 text-[] pb-10 pl-5 pr-5  bg-[#031420] font-[Poppins] rounded-xl md:w-[500px] w-[100%] border border-[#031420] h-[auto]"
        >
          <h3 className="text-[#fff]">All fields are required*</h3>
          <div className="mt-5">
            <label htmlFor="" className="text-[13px] text-[#fff]">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              onChange={(e) => setEmail(e.target.value)}
              // value={email}
              placeholder="Enter Email Address"
              className="w-[100%] text-[13px] mt-1 pl-3 h-[40px] border-[#D8D3EB] border rounded"
            />
          </div>
          <div className="mt-3">
            <label htmlFor="" className="text-[13px] text-[#fff]">
              Password
            </label>
            <input
              type="password"
              name="password"
              // value={password}
              onChange={(e) => setPassword(e.target.value)}
              id=""
              placeholder="Enter Password"
              className=" w-[100%] text-[13px] mt-1  pl-3  h-[40px] border-[#D8D3EB] border rounded"
            />
          </div>
          <button
            type="submit"
            // to="/dashboard"
            to=""
            className="w-[100%] flex  items-center justify-center  h-[50px] text-[14px] border-2   border-[#2D6B76] hover:border hover:border-[#81712E]  rounded-xl mt-5  text-[#0F0821] hover:bg-[#81712E] hover:text-[#fff] text-[#fff] bg-[#072534]"
          >
            Login
          </button>
        </form>
        <p className="mt-4 font-[Poppins]  text-[grey] text-[13px]">
          I Don't have an account?{" "}
          <Link
            to="/register"
            className="text-[#000] outline-none  font-bold underline"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
