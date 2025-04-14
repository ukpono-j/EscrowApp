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
          {/* Where Trust Meets Transparency */}
          Secure Your Deals with Confidence. Welcome to Sylo
        </Text>
        <p className="hero_subtext">
        Experience peace of mind with Sylo, your trusted partner for secure and transparent business dealings. Our platform ensures that every transaction is handled with integrity, providing a seamless experience for both buyers and sellers.
        </p>
        <div className="hero-btn-wrapper">
          <Link to="/login" className="start_btn rounded-full font-bold">
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
