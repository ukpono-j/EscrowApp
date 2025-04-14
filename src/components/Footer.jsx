import React from "react";
import { Link } from "react-router-dom";
import { Link as ScrollLink, scroller } from "react-scroll";
import { Box, Flex, Text, Container, Grid, GridItem, Divider, Icon, VStack, HStack } from "@chakra-ui/react";
import { FaFacebookF, FaInstagram, FaTwitter, FaLinkedinIn } from "react-icons/fa";
import Logo from "../assets/logo1.png";

const Footer = () => {
  const scrollTo = (element) => {
    scroller.scrollTo(element, {
      duration: 800,
      delay: 0,
      smooth: "easeInOutQuart",
    });
  };
  
  const socialLinks = [
    { icon: FaFacebookF, href: "https://facebook.com" },
    { icon: FaTwitter, href: "https://twitter.com" },
    { icon: FaInstagram, href: "https://instagram.com" },
    { icon: FaLinkedinIn, href: "https://linkedin.com" }
  ];
  
  const navLinks = [
    { name: "About Us", to: "about" },
    { name: "Services", to: "services" },
    { name: "FAQ", to: "faq" },
    { name: "Contact", to: "contact" }
  ];

  const legalLinks = [
    { name: "Terms & Conditions", to: "/terms" },
    { name: "Privacy Policy", to: "/privacy" },
  ];

  return (
    <Box as="footer" bg="#1a202c" color="white">
      {/* Newsletter Section */}
      <Box py={10} bg="">
        <Container maxW="container.xl">
          <VStack spacing={6}>
            <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold" textAlign="center">
              Subscribe To Our Newsletter
            </Text>
            <Flex 
              direction={{ base: "column", md: "row" }} 
              w="full" 
              maxW="600px"
              justifyContent="center" 
              alignItems="center"
              gap={3}
            >
              <Box 
                as="input" 
                type="email" 
                placeholder="Enter your email" 
                py={3} 
                px={4}
                borderRadius="md"
                w={{ base: "full", md: "70%" }}
                color="#1A202C"
              />
              <Box 
                as="button" 
                bg="#B38939" 
                py={3} 
                px={6} 
                // borderRadius="md"
                w={{ base: "full", md: "auto" }}
                _hover={{ bg: "#718096" }}
                fontWeight="semibold"
              >
                Subscribe Now
              </Box>
            </Flex>
          </VStack>
        </Container>
      </Box>
      
      {/* Main Footer Content */}
      <Container className="footer_container" maxW="container.xl" py={12}>
        <Grid 
          templateColumns={{ 
            base: "1fr", 
            md: "1fr 1fr", 
            lg: "2fr 1fr 1fr" 
          }}
          gap={8}
        >
          {/* Logo and Company Info */}
          <GridItem>
            <VStack align="flex-start" spacing={5}>
              <Link to="/" onClick={() => scrollTo("home")}>
                <Box as="img" src={Logo} alt="MiddleMan Logo" w={{ base: "120px", md: "150px" }} />
              </Link>
              <Text fontSize="sm" lineHeight="tall">
                At Sylo, we're dedicated to providing a seamless and secure
                experience for all your transactions. Your trust and satisfaction
                are our top priorities. Our support team is here to help you every
                step of the way.
              </Text>
              <Flex gap={3}>
                {socialLinks.map((social, index) => (
                  <Box 
                    key={index}
                    as="a" 
                    href={social.href} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    bg="whiteAlpha.200"
                    borderRadius="full"
                    w={{ base: "32px", md: "38px" }}
                    h={{ base: "32px", md: "38px" }}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    transition="all 0.3s"
                    _hover={{ bg: "whiteAlpha.400", transform: "translateY(-3px)" }}
                  >
                    <Icon as={social.icon} boxSize={{ base: "15px", md: "18px" }} />
                  </Box>
                ))}
              </Flex>
            </VStack>
          </GridItem>
          
          {/* Quick Links */}
          <GridItem>
            <VStack align="flex-start" spacing={5}>
              <Text fontSize="lg" fontWeight="bold">Quick Links</Text>
              <VStack align="flex-start" spacing={3}>
                {navLinks.map((link, index) => (
                  <ScrollLink
                    key={index}
                    className="cursor-pointer"
                    to={link.to}
                    smooth={true}
                    duration={800}
                  >
                    <Text fontSize="sm" _hover={{ color: "gray.300" }} transition="color 0.2s">
                      {link.name}
                    </Text>
                  </ScrollLink>
                ))}
              </VStack>
            </VStack>
          </GridItem>
          
          {/* Contact Info */}
          <GridItem>
            <VStack align="flex-start" spacing={5}>
              <Text fontSize="lg" fontWeight="bold">Contact Us</Text>
              <VStack align="flex-start" spacing={3}>
                <Text fontSize="sm">
                  <Box as="span" fontWeight="semibold">Email:</Box> support@middleman.com
                </Text>
                <Text fontSize="sm">
                  <Box as="span" fontWeight="semibold">Phone:</Box> +234 123 456 7890
                </Text>
                <Text fontSize="sm">
                  <Box as="span" fontWeight="semibold">Address:</Box> Lagos, Nigeria
                </Text>
              </VStack>
            </VStack>
          </GridItem>
        </Grid>
        
        {/* Footer Bottom */}
        <Divider my={8} borderColor="gray.700" />
        <Flex 
          direction={{ base: "column", md: "row" }} 
          justify="space-between" 
          align={{ base: "center", md: "center" }}
          gap={{ base: 4, md: 0 }}
        >
          <Text fontSize="sm" textAlign={{ base: "center", md: "left" }}>
            © {new Date().getFullYear()} Sylo App. All rights reserved.
          </Text>
          <HStack spacing={4} textAlign="center">
            {legalLinks.map((link, index) => (
              <Link key={index} to={link.to}>
                <Text fontSize="sm" _hover={{ color: "gray.300" }} transition="color 0.2s">
                  {link.name}
                </Text>
              </Link>
            ))}
          </HStack>
          <Text fontSize="sm" textAlign={{ base: "center", md: "right" }}>
            Powered by Zeek
          </Text>
        </Flex>
      </Container>
    </Box>
  );
};

export default Footer;