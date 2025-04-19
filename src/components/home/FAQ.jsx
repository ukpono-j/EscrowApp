import React, { useState, useEffect, useRef } from "react";
import "./FAQ.css";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { 
  Box, 
  Text, 
  Flex, 
  Container,
  useColorModeValue,
  ScaleFade,
  Button
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const MotionBox = motion(Box);

const FAQ = () => {
  const [openAccordionId, setOpenAccordionId] = useState(1); // Default open the first one
  const accordionRefs = useRef({});
  
  const accordionData = [
    {
      id: 1,
      title: "What is Sylo Escrow?",
      content:
        "Sylo is a secure payment service that acts as a trusted third party between a buyer and a seller. It ensures that the funds are held safely until both parties fulfill their obligations in a transaction.",
    },
    {
      id: 2,
      title: "How does Sylo work?",
      content:
        "When a buyer and seller agree on a transaction, the buyer sends the payment to Sylo. Sylo holds the funds until the buyer confirms receipt of the goods or services. Once the buyer is satisfied, Sylo releases the funds to the seller.",
    },
    {
      id: 3,
      title: "Is Sylo safe to use?",
      content:
        "Yes, Sylo is highly secure and uses encryption and other security measures to protect your transactions. We verify the identity of all users to ensure a safe and reliable escrow service.",
    },
    {
      id: 4,
      title: "How long does the escrow process take?",
      content:
        "The length of the escrow process depends on the agreement between the buyer and seller and the type of transaction. It can vary from a few days to several weeks, depending on the terms of the deal.",
    },
    {
      id: 5,
      title: "What types of payments are accepted?",
      content:
        "Sylo Escrow accepts various payment methods, including credit cards, bank transfers, and digital wallets. We provide a convenient and secure way for buyers and sellers to transact online.",
    },
  ];

  // Animation for revealing sections on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
          }
        });
      },
      { threshold: 0.1 }
    );
    
    const sections = document.querySelectorAll('.animate-on-scroll');
    sections.forEach(section => observer.observe(section));
    
    return () => {
      sections.forEach(section => observer.unobserve(section));
    };
  }, []);

  const toggleAccordion = (id) => {
    setOpenAccordionId(openAccordionId === id ? null : id);
    
    // Scroll to the selected accordion on mobile
    if (window.innerWidth < 768 && accordionRefs.current[id] && openAccordionId !== id) {
      setTimeout(() => {
        accordionRefs.current[id].scrollIntoView({ 
          behavior: 'smooth',
          block: 'center'
        });
      }, 100);
    }
  };

  // Style variables
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const hoverBgColor = useColorModeValue("gray.50", "gray.700");
  const accordionBg = useColorModeValue("white", "gray.800");

  // Variants for animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <Box 
      className="faq" 
      py={{ base: 14, md: 20 }} 
      px={{ base: 5, md: 10, lg: 20 }}
      bg={bgColor}
    >
      <Container maxW="container.xl" px={0}>
        <Flex 
          direction={{ base: "column-reverse", md: "row" }}
          align="stretch"
          justify="space-between"
          className="animate-on-scroll"
        >
          {/* FAQ Accordion Section */}
          <MotionBox
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            flex="1"
            className="accordion-container faq-card"
            borderRadius="16px"
            overflow="hidden"
            boxShadow="lg"
            border="1px"
            borderColor={borderColor}
            mt={{ base: 10, md: 0 }}
            mr={{ base: 0, md: 6 }}
            position="relative"
            bg={accordionBg}
          >
            {accordionData.map((item) => (
              <MotionBox
                variants={itemVariants}
                key={item.id}
                className="accordion-item"
                borderBottom="1px"
                borderColor={borderColor}
                ref={el => accordionRefs.current[item.id] = el}
                _last={{ borderBottom: "none" }}
              >
                <Flex
                  className="accordion-header"
                  justify="space-between"
                  align="center"
                  p={5}
                  cursor="pointer"
                  onClick={() => toggleAccordion(item.id)}
                  bg={openAccordionId === item.id ? hoverBgColor : "transparent"}
                  _hover={{ bg: hoverBgColor }}
                  transition="all 0.3s ease"
                >
                  <Text 
                    className="accordion_title" 
                    fontWeight="700" 
                    fontSize={{ base: "15px", sm: "16px", md: "18px" }}
                    pr={4}
                  >
                    {item.title}
                  </Text>
                  <Box 
                    className="toggle-icon"
                    transition="all 0.3s ease"
                  >
                    {openAccordionId === item.id ? (
                      <FaChevronUp className="text-[#B38939]" />
                    ) : (
                      <FaChevronDown className="text-[#B38939]" />
                    )}
                  </Box>
                </Flex>
                

                <ScaleFade in={openAccordionId === item.id}>
                  {openAccordionId === item.id && (
                    <Box 
                      className="accordion-content"
                      p={{ base: 3, md: 5 }}
                      pt={0}
                    >
                      <Text 
                        fontSize={{ base: "14px", md: "16px" }}
                        lineHeight="1.6"
                      >
                        {item.content}
                      </Text>
                    </Box>
                  )}
                </ScaleFade>
              </MotionBox>
            ))}
            
            {/* Decorative elements */}
            <Box 
              position="absolute"
              width="100px"
              height="100px"
              borderRadius="full"
              bg="rgba(179, 137, 57, 0.05)"
              top="-20px"
              right="-30px"
              zIndex="0"
            />
            <Box 
              position="absolute"
              width="60px"
              height="60px"
              borderRadius="full"
              bg="rgba(179, 137, 57, 0.08)"
              bottom="40px"
              left="-20px"
              zIndex="0"
            />
          </MotionBox>
          
          {/* FAQ Text Section */}
          <MotionBox
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            flex="1"
            className="faq-decorative faq-text-container"
            ml={{ base: 0, md: 6 }}
          >
            <MotionBox variants={itemVariants}>
              <Text 
                as="h1"
                fontWeight="bold"
                fontSize={{ base: "36px", md: "42px", lg: "50px" }}
                lineHeight={{ base: "44px", md: "60px" }}
                textAlign={{ base: "left", md: "left" }}
                textTransform="uppercase"
                mb={4}
              >
                Frequently Asked Questions
              </Text>
            </MotionBox>
            
            <MotionBox variants={itemVariants}>
              <Text 
                fontWeight="bold" 
                mt={4} 
                fontSize={{ base: "14px", md: "15px" }}
                textAlign={{ base: "left", md: "left" }}
              >
                What is Sylo Escrow?
              </Text>
            </MotionBox>
            
            <MotionBox variants={itemVariants}>
              <Text 
                mt={4} 
                fontSize={{ base: "14px", md: "15px" }}
                lineHeight="1.8"
                textAlign={{ base: "left", md: "left" }}
              >
                Sylo is a secure, easy-to-use escrow platform that protects both buyers and sellers during online and offline transactions. We act as a trusted third-party, holding funds securely until both parties are satisfied and the deal is complete. Whether it's services, products, or high-value exchanges — Sylo ensures no one gets cheated.
              </Text>
            </MotionBox>
            
            <MotionBox 
              variants={itemVariants}
              display="flex"
              justifyContent={{ base: "flex-start", md: "flex-start" }}
              mt={6}
            >
              <Link to="/register">
                <Button
                  className="start_btn w-full"
                  bg="#B38939"
                  color="white"
                  borderRadius="full"
                  px={8}
                  py={6}
                  fontSize="16px"
                  fontWeight="bold"
                  border="2px solid #B38939"
                  _hover={{
                    transform: "translateY(-3px)",
                    boxShadow: "0 8px 20px rgba(179, 137, 57, 0.3)"
                  }}
                  _active={{
                    transform: "translateY(-1px)"
                  }}
                >
                  Get Started Now
                </Button>
              </Link>
            </MotionBox>
          </MotionBox>
        </Flex>
      </Container>
    </Box>
  );
};

export default FAQ;