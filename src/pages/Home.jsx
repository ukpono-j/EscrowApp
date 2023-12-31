// Home.jsx
import React from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/home/Hero";
import About from "../components/home/About";
import LogoSection from "../components/home/LogoSection";
import ServicesComponent from "../components/home/ServicesComponent";
import NewsLetter from "../components/home/NewsLetter";
import Footer from "../components/Footer";
import "./Home.css";
import FAQ from "../components/home/FAQ";

const Home = () => {
  return (
    <div className="home">
      <Navbar />
      <Hero id="home" />
      <About id="about" />
      <ServicesComponent id="services" />
      <FAQ id="faq" />
      <Footer id="footer" />
    </div>
  );
};

export default Home;
