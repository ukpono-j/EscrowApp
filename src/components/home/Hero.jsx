import React from "react";
import "./Hero.css";
import { Link } from "react-router-dom";
import HeroImage from "../../assets/hero.png";
import { Box, Text } from "@chakra-ui/react";

const Hero = () => {
  return (
    <Box className="hero-container">
      <div className="hero-text-content">
        <Text className="hero_heading">
          Where Trust Meets Transparency
        </Text>
        <p className="hero_subtext">
          Your ultimate solution for secure and transparent business transactions. TrustLink is redefining the way commerce is conducted by providing a seamless, secure, and reliable escrow service. Whether you're buying or selling, our platform guarantees peace of mind, ensuring that transactions are executed with integrity and confidence.
        </p>
        <div className="hero-btn-wrapper">
          <Link to="/login" className="start_btn">
            Start Transactions
          </Link>
        </div>
      </div>

      <div className="hero-image-section">
        <div className="bounce hero-badge">
          <div className="badge-text">
            <h4>20M+ Active Users</h4>
          </div>
        </div>
        <div className="hero_img_one">
          <img
            src={HeroImage}
            alt="Hero"
            className="hero_main_image moving responsive-image"
          />
        </div>
      </div>
    </Box>
  );
};

export default Hero;
