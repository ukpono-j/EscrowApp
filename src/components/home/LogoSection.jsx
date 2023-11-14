import React, { useRef, useEffect } from "react";
import Slider from "react-slick";
import "./LogoSection.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Logo1 from "../../assets/logo-remove.png"
const LogoSection = () => {
  const sliderRef = useRef(null);

  useEffect(() => {
    const slider = sliderRef.current;

    if (!slider) {
      return;
    }

    const scroll = () => {
      slider.slickNext();
    };

    const scrollInterval = setInterval(scroll, 200); // Adjust the interval duration as needed

    // Reset scroll position when reaching the end of the content
    const handleScrollEnd = () => {
      const currentSlide = slider.innerSlider.state.currentSlide;
      if (currentSlide === slider.slideCount - 1) {
        slider.slickGoTo(0);
      }
    };

    // Clean up the interval and event listener
    return () => {
      clearInterval(scrollInterval);
    };
  }, [sliderRef]);

  // Slick settings
  const slickSettings = {
    dots: true,
    infinite: true,
    speed: 6000,
    slidesToShow: 3, // Adjust the number of slides to show on larger screens
    slidesToScroll: 1,
    responsive: [
      {
        breakpoint: 768, // Adjust the breakpoint as needed
        settings: {
          slidesToShow: 1, // Show one slide at a time on smaller screens
        },
      },
    ],
  };

  return (
    <div className="logo-slider font-[Poppins] text-[13px] md:pt-8 pt-4 md:pl-14 md:pr-14 pl-3 pb-4 md:pb-8 ">
      <Slider
        {...slickSettings}
        className="flex items-center logo-container pl-3"
        ref={sliderRef}
      >
        <div className="logo-wrapper">
          <div className="logo text-[#fff] m-2 md:w-[300px] w-full h-[80px] border border-[#2D6B76] hover:bg-[#031420] cursor-pointer flex items-center justify-center rounded-xl bg-[#072534]">
            <img src={Logo1} alt=""  className="w-[50%] h-[100%] object-center   "/>
          </div>
        </div>
        <div className="logo-wrapper">
          <div className="logo text-[#fff] m-2 md:w-[300px] w-full h-[80px] border border-[#2D6B76] hover-bg-[#031420] cursor-pointer flex items-center justify-center rounded-xl bg-[#072534]">
          <img src={Logo1} alt=""  className="w-[50%] h-[100%] object-center   "/>
          </div>
        </div>
        <div className="logo-wrapper">
          <div className="logo text-[#fff] m-2 md:w-[300px] w-full h-[80px] border border-[#2D6B76] hover-bg-[#031420] cursor-pointer flex items-center justify-center rounded-xl bg-[#072534]">
          <img src={Logo1} alt=""  className="w-[50%] h-[100%] object-center   "/>
          </div>
        </div>
        <div className="logo-wrapper">
          <div className="logo text-[#fff] m-2 md:w-[300px] w-full h-[80px] border border-[#2D6B76] hover-bg-[#031420] cursor-pointer flex items-center justify-center rounded-xl bg-[#072534]">
          <img src={Logo1} alt=""  className="w-[50%] h-[100%] object-center   "/>
          </div>
        </div>
        {/* Repeat other logo elements here */}
      </Slider>
    </div>
  );
};

export default LogoSection;
