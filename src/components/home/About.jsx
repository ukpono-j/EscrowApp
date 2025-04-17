import React, { useState, useEffect } from "react";
import "./About.css";
import AboutImage from "../../assets/about.png";
import { Link } from "react-router-dom";

const About = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const aboutSection = document.getElementById("about");
      if (aboutSection) {
        const rect = aboutSection.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.75 && rect.bottom > 0) {
          setIsVisible(true);
        }
      }
    };

    // Initial check
    handleScroll();
    
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <section id="about" className="about-section">
      <div className="about-container">
        <div className="about-grid">
          {/* Image Column */}
          <div className={`about-image-column ${isVisible ? "animate-in" : ""}`}>
            <div className="image-wrapper">
              <div className="image-border">
                <img src={AboutImage} alt="About Sylo" className="main-image" />
                <div className="accent-shape top-left"></div>
                <div className="accent-shape bottom-right"></div>
                <div className="glow-effect"></div>
              </div>
              <div className="floating-element gold-circle"></div>
              <div className="floating-element blue-square"></div>
            </div>
          </div>
          
          {/* Content Column */}
          <div className={`about-content-column ${isVisible ? "animate-in" : ""}`}>
            <div className="content-wrapper">
              <div className="heading-container">
                <span className="subheading">Who We Are</span>
                <h2 className="main-heading">Trustworthy Escrow Services</h2>
                <div className="heading-accent"></div>
              </div>
              
              <div className="text-content">
                <p>
                  At Sylo, we believe that trust is the currency of every successful transaction. 
                  Whether you're dealing with digital goods, services, or high-stake purchases, 
                  uncertainty shouldn't be part of the deal. That's where we come in.
                </p>
                
                <p>
                  We're a modern, tech-forward escrow platform built to protect both buyers and sellers, 
                  no matter the industry. From freelancers and online sellers to real estate investors 
                  and everyday users, Sylo acts as your secure middle ground, holding funds safely until 
                  both sides are satisfied.
                </p>
                
                <div className="highlight-box">
                  <span>With Sylo, no one gets paid until the job is done right.</span>
                </div>
                
                <Link to="/transactions" className="gold-button rounded-full">
                  Start Transactions
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;