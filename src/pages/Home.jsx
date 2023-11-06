import React from 'react'
import Navbar from '../components/Navbar'
import Hero from '../components/home/Hero'
import About from '../components/home/About'
import LogoSection from '../components/home/LogoSection'
import ServicesComponent from '../components/home/ServicesComponent'
import NewsLetter from '../components/home/NewsLetter'
import Footer from '../components/Footer'

const Home = () => {
  return (
    <div>
        <Navbar/>
        <Hero/>
        <LogoSection/>
        <About/>
        <ServicesComponent/>
        <NewsLetter/>
        <Footer/>
    </div>
  )
}

export default Home