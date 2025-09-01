import React from "react";
import Buyer from "../../assets/seller.png";
import "./NewsLetter.css";
import { Box, Text } from "@chakra-ui/react";
import { useColorModeValue } from "@chakra-ui/react";


const NewsLetter = () => {
    const mobileNewsLetterBg = useColorModeValue("#fff", "#1A202C");


  return (
    <Box className="md:pl-20 pl-5 newsletter_container pr-5 md:pr-20 pb-14 pt-10"
    bg={mobileNewsLetterBg}
    >
      <div className=" w-[100%] h-[auto] md:pl-20 pl-5 pr-5 md:pr-20  pt-7 pb-7 flex items-center justify-center rounded-3xl">
        <div className="newsletter_content sm:ml-4 text-center ">
          <Text className="md:text-[34px] sm:text-[32px] text-[30px] font-bold">Let's Keep you updated</Text>
          <p className="mt-2 text-[16px] font-[200]">First 100 users of Sylo get Zero Fees for life!!!</p>
          <div className="flex mt-5   items-center  bg-[#fff] pl-5 pt-1 pb-1 pr-2  rounded-full ">
            <input
              type="number"
              name=""
              id=""
              placeholder="WhatsApp Number"
              className="border border-[#FEFEFF] outline-none  text-[13px] bg-[transparent] font-bold  text-[#000] w-[100%]  pl-3  h-[60px]"
            />
            <button className="h-[50px] rounded-full news_button  w-[250px] flex items-center justify-center bg-[#B38939] text-[#FEFEFF] text-[15px]">
              Subscribe Now
            </button>
          </div>
        </div>
      </div>
    </Box>
  );
};

export default NewsLetter;
