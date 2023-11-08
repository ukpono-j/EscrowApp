import React from "react";
import "./FAQ.css";


const FAQ = () => {
  return (
    <div className="h-[auto] text-center md:text-start  faq bg-[#062333]   md:flex md:flex-row flex-col-reverse flex  w-[100%]  text-[#fff]  pr-5  pl-5  md:pl-[50px] md:pr-[50px] pt-14  pb-14   ">
      <div className="border w-[100%] h-[300px] bg-[#fff] rounded-3xl mt-10 md:mt-2 ">
        {/* Accordion */}
      </div>
      <div className="w-[100%] h-[auto] md:ml-5 md:mr-5 md:mt-5 md:mb-5">
        <h1 className="font-bold">FREQUENTLY ASKED QUESTIONS</h1>
        <p className="font-[200]  text-[16px] mt-4">
          Lorem, ipsum dolor sit amet consectetur adipisicing elit. Suscipit
          modi nobis voluptatum quidem laborum cumque maxime tenetur
          consequatur, sunt, nulla saepe expedita maiores nostrum eos labore
          repudiandae quasi commodi in.
        </p>
        <button
        className="outine-none w-[auto] faq  mt-5  start_btn  pl-7 pr-7  text-[14px] h-[auto] pt-3 pb-3  text-[#fff] font-bold flex items-center justify-center   rounded-[50px]  border-2 border-[#81712E]" >
            Get Started</button>
      </div>
    </div>
  );
};

export default FAQ;
