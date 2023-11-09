import React, { useRef, useEffect } from 'react';
import "./LogoSection.css";
import Test from "../../assets/logo.png";

const LogoSection = () => {
  const logoContainerRef = useRef(null);

  useEffect(() => {
    const logoContainer = logoContainerRef.current;

    const scroll = () => {
      logoContainer.scrollTo({
        left: logoContainer.scrollLeft + 1,
        behavior: 'smooth'
      });
    };

    const scrollInterval = setInterval(scroll, 20);

    // Reset scroll position when reaching the end of the content
    const handleScrollEnd = () => {
      if (logoContainer.scrollLeft >= logoContainer.scrollWidth - logoContainer.clientWidth) {
        logoContainer.scrollTo({ left: 0, behavior: 'auto' });
      }
    };

    logoContainer.addEventListener('scroll', handleScrollEnd);

    // Clean up the interval and event listener
    return () => {
      clearInterval(scrollInterval);
      logoContainer.removeEventListener('scroll', handleScrollEnd);
    };
  }, []);

  return (
    <div className='logo-slider font-[Poppins] text-[13px] md:pt-8 pt-4 md:pl-14 md:pr-14  pl-3 pb-4 md:pb-8 '>
      <div className='flex items-center logo-container pl-10 ' ref={logoContainerRef}>
        <div className='logo text-[#fff] md:m-4 m-2 w-[300px] h-[80px] border border-[#2D6B76] hover:bg-[#031420] cursor-pointer  flex items-center justify-center rounded-xl bg-[#072534]'>
          Logos
        </div>
        <div className='logo text-[#fff] md:m-4 m-2 w-[300px] h-[80px] border border-[#6149FA] flex items-center justify-center rounded-xl bg-[#072534]'>
          Logos
        </div>
        <div className='logo text-[#fff] md:m-4 m-2 w-[300px] h-[80px] border border-[#2D6B76] hover:bg-[#031420] cursor-pointer  flex items-center justify-center rounded-xl bg-[#072534]'>
          Logos
        </div>
        <div className='logo text-[#fff] md:m-4 m-2 w-[300px] h-[80px] border border-[#2D6B76] hover:bg-[#031420] cursor-pointer  flex items-center justify-center rounded-xl bg-[#072534]'>
          Logos
        </div>
        <div className='logo text-[#fff] md:m-4 m-2 w-[300px] h-[80px] border border-[#2D6B76] hover:bg-[#031420] cursor-pointer  flex items-center justify-center rounded-xl bg-[#072534]'>
          Logos
        </div>
        <div className='logo text-[#fff] md:m-4 m-2 w-[300px] h-[80px] border border-[#2D6B76] hover:bg-[#031420] cursor-pointer  flex items-center justify-center rounded-xl bg-[#072534]'>
          Logos
        </div>
        {/* Repeat other logo elements here */}
      </div>
    </div>
  );
};

export default LogoSection;
