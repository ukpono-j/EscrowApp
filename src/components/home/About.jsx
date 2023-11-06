import React, { useState, useEffect } from "react";
import "./About.css";
import Test from "../../assets/money3.png";

const About = () => {
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const aboutSection = document.getElementById("about");
      if (aboutSection) {
        const rect = aboutSection.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          setIsScrolling(true);
        } else {
          setIsScrolling(false);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div
      id="about"
      className={`w-[100%] pt-14 bg-[#0f1a2e] text-[#fff]  md:pl-20 pl-5 pb-14  pr-5  md:pr-20 justify-between h-[auto] flex md:flex-row  flex-col-reverse  items-center ${
        isScrolling ? "fade-in" : "fade-out"
      }`}
    >
      <div
        className={`sm:w-[47%] flex items-end justify-between   fade_left  h-[auto] ${
          isScrolling ? "slide-in-left" : "slide-out-left"
        }`}
      >
        <div className=" md:w-[100%] md:h-[320px] w-[300px] sm:w-[100%] sm:h-[300px] relative z-10  md:mr-[-100px] mr-[-120px] mb-[70px] about_img_two ">
          <img src={Test} alt="" className="w-[100%] h-[100%] object-cover" />
        </div>
        <div className=" sm:w-[480px] w-[100%] sm:h-[500px]  h-[400px] mr-[0] about_img_one ">
          <img src={Test} alt="" className="w-[100%] h-[100%] object-cover" />
        </div>
      </div>
      <div
        className={`md:w-[46%]  m-4 w-[100%] font-[Poppins] fade_right  h-[auto] ${
          isScrolling ? "slide-in-right" : "slide-out-right"
        }`}
      >
        <h3 className="text-[16px]">Who We Are</h3>
        <h1 className="font-bold text-[#96E1FC] text-[27px] pt-1">
          Transfer & Exchange Your Money Anytime Inthis World
        </h1>
        <p className="font-[300] text-[13px] pt-2">
          EmpowerTransact isn't just a platform; it's a mindset. Our passionate
          team of industry experts and technology enthusiasts is committed to
          transforming business transactions into transparent, secure, and
          efficient experiences. With a deep understanding of the challenges and
          opportunities in the business world, we've developed an all-purpose
          escrow solution that places trust at its core
        </p>
        <div className="flex items-center ">
          <div className="border border-[#6149FA]  w-[100px] h-[60px]"></div>
          <div className="pl-3 pr-3 mt-4 mb-3">
            <h2 className="font-bold">Powerful Mobile & Online App</h2>
            <p className="text-[13px] pt-1">
              Vestibulum ac diam sit amet quam vehicula elemen tum sed sit amet
              dui praesent sapien pellen tesque .
            </p>
          </div>
        </div>
        <div className="flex items-center ">
          <div className="border border-[#6149FA]  w-[100px] h-[60px]"></div>
          <div className="pl-3 pr-3 mt-4 mb-3">
            <h2 className="font-bold">Powerful Mobile & Online App</h2>
            <p className="text-[13px] pt-1">
              Vestibulum ac diam sit amet quam vehicula elemen tum sed sit amet
              dui praesent sapien pellen tesque .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
