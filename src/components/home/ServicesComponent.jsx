import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Vesa from "../../assets/vesa.png";
import Card from "../../assets/card.png";
import Girl from "../../assets/about.png";
import "./ServicesComponent.css";
import { Box, Text, Flex, Container, useColorModeValue } from "@chakra-ui/react";

const ServicesComponent = () => {
  const sectionRefs = useRef([]);
  
  // Animation for sections on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('section-animate');
          }
        });
      },
      { threshold: 0.1 }
    );
    
    sectionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });
    
    return () => {
      sectionRefs.current.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, []);
  
  // Add refs to the array
  const addToRefs = (el) => {
    if (el && !sectionRefs.current.includes(el)) {
      sectionRefs.current.push(el);
    }
  };
  
  const bgColor = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.700", "gray.100");
  const highlightColor = useColorModeValue("rgba(179, 137, 57, 0.2)", "rgba(226, 192, 124, 0.2)");

  return (
    <Box 
      className="services" 
      py={{ base: 12, md: 20 }} 
      px={{ base: 5, md: 20 }}
      bg={bgColor}
      color={textColor}
    >
      <Container maxW="container.xl" px={0}>
        <div className="h-[auto]">
          {/* Main Title */}
          <Box 
            className="service_title" 
            textAlign="left" 
            mb={{ base: 12, md: 16 }}
            fontWeight="900"
            fontSize={{ base: "34px", md: "50px" }}
            lineHeight={{ base: "44px", md: "60px" }}
            mx="auto"
            maxW={{ base: "100%", md: "560px" }}
          >
            What You Order Has To Be What You Get!
          </Box>
          
          {/* === Buyer Protection Section === */}
          <Flex 
            ref={addToRefs}
            direction={{ base: "column", md: "row" }}
            align="center"
            justify="space-between"
            gap={8}
            mb={{ base: 16, md: 20 }}
            className="opacity-0"
          >
            <Box 
              flex="1"
              display="flex"
              flexDirection="column"
              alignItems={{ base: "flex-start", md: "flex-start" }}
              textAlign={{ base: "left", md: "left" }}
            >
              <h1 className="font-[900] text-[40px] service_sub_title">
                Buyer Protection
              </h1>
              
              <Text fontWeight="bold" mt={4} fontSize="17px">
                What you order is what you get — or your money stays safe
              </Text>
              
              <Text mt={4} fontSize="17px">
                Shopping online or engaging in digital transactions shouldn't come with a risk. At Sylo, we make sure your money is protected until you're 100% satisfied. Whether you're buying a product, hiring a freelancer, or engaging in a peer-to-peer exchange, your funds are held securely in escrow and only released when you confirm the deal meets your expectations.
              </Text>
              
              <Text mt={4} fontSize="17px">
                Peace of mind in every purchase.
              </Text>
              
              <Box mt={4} fontSize="17px" fontWeight="bold" display="flex" alignItems="center">
                <Box as="span" fontSize="24px" mr={2}>🔒</Box>
                <span className="highlight-text">Start using Sylo today and experience next-level buyer confidence.</span>
              </Box>
              
             <div className="flex w-full border">
             <Link
                to="/register"
                className="mt-5 flex rounded-full items-center nav-btn font-bold justify-center px-8 py-3 text-[#fff] text-[17px] bg-[#B38939] border-2 border-[#B38939] login_btn"
              >
                Get Started now
              </Link>
             </div>
            </Box>
            
            <Box 
              flex="1"
              className="image-container moving"
              position="relative"
              mt={{ base: 10, md: 0 }}
            >
              <Box 
                className="decorative-circle" 
                w="120px" 
                h="120px" 
                top="-30px" 
                right="-40px"
              />
              <Box 
                className="decorative-circle" 
                w="80px" 
                h="80px" 
                bottom="30px" 
                left="-20px"
              />
              <img
                src={Card}
                alt="Buyer Protection Card"
                className="sm:w-[100%] w-[80%] mx-auto"
              />
            </Box>
          </Flex>
          
          {/* === Seller Protection Section === */}
          <Flex 
            ref={addToRefs}
            direction={{ base: "column-reverse", md: "row" }}
            align="center"
            justify="space-between"
            gap={8}
            mb={{ base: 16, md: 20 }}
            className="opacity-0"
          >
            <Box 
              flex="1" 
              className="image-container moving"
              position="relative"
              mt={{ base: 10, md: 0 }}
            >
              <Box 
                className="decorative-circle" 
                w="100px" 
                h="100px" 
                top="20px" 
                left="-30px"
              />
              <Box 
                className="decorative-circle" 
                w="150px" 
                h="150px" 
                bottom="-40px" 
                right="-30px"
              />
              <img
                src={Girl}
                alt="Seller Protection"
                className="w-[90%] mx-auto"
              />
            </Box>
            
            <Box 
              flex="1"
              display="flex"
              flexDirection="column"
              alignItems={{ base: "flex-start", md: "flex-start" }}
              textAlign={{ base: "left", md: "left" }}
            >
              <h1 className="font-[900] text-[40px] service_sub_title">
                Seller Protection
              </h1>
              
              <Text fontWeight="bold" mt={4} fontSize="17px">
                Ship with confidence, knowing your payment is locked in.
              </Text>
              
              <Text mt={4} fontSize="17px">
                As a seller, you deserve the assurance that your time and effort won't go to waste. With Sylo, funds from the buyer are securely held in escrow before you ship or deliver any service. This means you never have to worry about fake buyers, delayed payments, or chargebacks.
              </Text>
              
              <Text mt={4} fontSize="17px">
                Once the buyer confirms receipt or is satisfied with your product or service, we instantly release your payment. We've built Sylo with your security in mind — you can focus on delivering quality while we handle the trust.
              </Text>
              
              <Box mt={4} fontSize="17px" fontWeight="bold" display="flex" alignItems="center">
                <Box as="span" fontSize="24px" mr={2}>📦</Box>
                <span className="highlight-text">Start selling confidently with Sylo today.</span>
              </Box>
              
              <Link
                to="/register"
                className="mt-5 rounded-full flex nav-btn justify-center font-bold px-10 py-3 text-[#fff] text-[17px] bg-[#B38939] border-2 border-[#B38939] login_btn"
              >
                Get Started now
              </Link>
            </Box>
          </Flex>
          
          {/* === Fraud Protection Section === */}
          <Flex 
            ref={addToRefs}
            direction={{ base: "column", md: "row" }}
            align="flex-start"
            justify="space-between"
            gap={10}
            mb={6}
            className="opacity-0"
          >
            <Box 
              flex="1"
              display="flex"
              flexDirection="column"
              alignItems={{ base: "flex-start", md: "flex-start" }}
              textAlign={{ base: "left", md: "left" }}
            >
              <h1 className="font-[900] text-[40px] service_sub_title">
                Fraud Protection
              </h1>
              
              <Text fontWeight="bold" mt={4} fontSize="17px">
                We don't just secure transactions — we help fight fraud.
              </Text>
              
              <Text mt={4} fontSize="17px">
                At Sylo, your safety goes beyond just holding funds. Every transaction is processed through Bondly's secure wallets and verification systems, ensuring every user is authenticated and each payment is monitored for legitimacy.
              </Text>
              
              <Text mt={4} fontSize="17px">
                We work closely with trusted partners, fraud prevention tools, and even authorities where needed to make sure scammers and bad actors are kept out of our system. Our protocols ensure that you get not only a safe transaction — but a clean environment to do business.
              </Text>
              
              <Box mt={4} fontSize="17px" fontWeight="bold" display="flex" alignItems="center">
                <Box as="span" fontSize="24px" mr={2}>🛡️</Box>
                <span className="highlight-text">Join Sylo and transact with confidence — every single time.</span>
              </Box>
              
              <Link
                to="/register"
                className="mt-5 flex rounded-full items-center nav-btn justify-center px-8 py-3 font-bold text-[#fff] text-[16px] bg-[#B38939] border-2 border-[#B38939] login_btn"
              >
                Get Started now
              </Link>
            </Box>
            
            <Box 
              flex="1"
              className="image-container moving"
              position="relative"
              mt={{ base: 10, md: 0 }}
              height={{ base: "400px", md: "500px" }}
              borderRadius="24px"
              overflow="hidden"
            >
              <Box 
                className="decorative-circle" 
                w="180px" 
                h="180px" 
                bottom="-60px" 
                left="-60px"
              />
              <img
                src={Vesa}
                alt="Fraud Protection"
                className="h-[100%] w-[100%] object-cover object-center rounded-3xl"
              />
            </Box>
          </Flex>
        </div>
      </Container>
    </Box>
  );
};

export default ServicesComponent;