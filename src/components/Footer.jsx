import React from "react";
import { Link } from "react-router-dom";
import { Link as ScrollLink, scroller } from "react-scroll";
import { 
  Box, 
  Flex, 
  Text, 
  Container, 
  Grid, 
  GridItem, 
  Divider, 
  Icon, 
  VStack, 
  HStack,
  Input,
  Button,
  Image,
  useColorModeValue
} from "@chakra-ui/react";
import { FaFacebookF, FaInstagram, FaTwitter, FaLinkedinIn, FaEnvelope, FaPhone, FaMapMarkerAlt } from "react-icons/fa";
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
    { icon: FaFacebookF, href: "https://facebook.com", label: "Facebook" },
    { icon: FaTwitter, href: "https://twitter.com", label: "Twitter" },
    { icon: FaInstagram, href: "https://instagram.com", label: "Instagram" },
    { icon: FaLinkedinIn, href: "https://linkedin.com", label: "LinkedIn" }
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

  // Theme colors
  const bgColor = useColorModeValue("#111827", "#111827");
  const accentColor = useColorModeValue("#B38939", "#D4A256");
  const textColor = useColorModeValue("white", "white");
  const borderColor = useColorModeValue("gray.700", "gray.700");
  const inputBgColor = useColorModeValue("white", "gray.800");

  return (
    <Box as="footer" bg={bgColor} color={textColor} w="100%" overflow="hidden" position="relative">
      {/* Decorative element */}
      <Box 
        position="absolute" 
        top="5%" 
        right="-5%" 
        w="300px" 
        h="300px" 
        borderRadius="full" 
        bg={`${accentColor}20`}
        filter="blur(70px)"
        zIndex="0"
      />
      
      {/* Newsletter Section with gradient background */}
      <Box py={14} bg="linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0) 100%)" position="relative" zIndex="1">
        <Container maxW="container.xl">
          <VStack spacing={8}>
            <Text 
              fontSize={{ base: "2xl", md: "3xl" }} 
              fontWeight="bold" 
              textAlign="center"
              bgGradient={`linear(to-r, ${accentColor}, white)`}
              bgClip="text"
            >
             Let's Keep you updated
            </Text>
            <Text textAlign="center" maxW="700px" fontSize={{ base: "sm", md: "md" }} color="gray.300">
            First 100 users of Sylo get Zero Fees for life!!!
            </Text>
            <Flex 
              direction={{ base: "column", md: "row" }} 
              w="full" 
              maxW="600px"
              justifyContent="center" 
              alignItems="center"
              gap={3}
            >
              <Input 
                type="number" 
                placeholder="Enter WhatsApp Number" 
                py={6} 
                px={4}
                borderRadius="full"
                bg={inputBgColor}
                color="gray.800"
                border="none"
                boxShadow="md"
                _placeholder={{ color: "gray.500" }}
                _focus={{ boxShadow: `0 0 0 2px ${accentColor}` }}
                w={{ base: "full", md: "70%" }}
                fontSize="md"
              />
              <Button 
                bg={accentColor} 
                py={6} 
                px={8} 
                borderRadius="full"
                w={{ base: "full", md: "auto" }}
                _hover={{ bg: `${accentColor}90`, transform: "translateY(-2px)" }}
                _active={{ transform: "translateY(0)" }}
                transition="all 0.3s ease"
                fontWeight="semibold"
                boxShadow="md"
                fontSize="md"
              >
                Subscribe Now
              </Button>
            </Flex>
          </VStack>
        </Container>
      </Box>
      
      {/* Main Footer Content */}
      <Container maxW="container.xl" py={14} position="relative" zIndex="1">
        <Grid 
          templateColumns={{ 
            base: "1fr", 
            md: "repeat(2, 1fr)", 
            lg: "2fr 1fr 1fr" 
          }}
          gap={{ base: 10, lg: 16 }}
        >
          {/* Logo and Company Info */}
          <GridItem>
            <VStack align="flex-start" spacing={6}>
              <Link to="/" onClick={() => scrollTo("home")}>
                <Image 
                  src={Logo} 
                  alt="Sylo Logo" 
                  w={{ base: "140px", md: "170px" }} 
                  transition="transform 0.3s ease"
                  _hover={{ transform: "scale(1.05)" }}
                />
              </Link>
              <Text fontSize={{ base: "sm", md: "md" }} lineHeight="1.8" color="gray.300" maxW="450px">
                At Sylo, we're dedicated to providing a seamless and secure
                experience for all your transactions. Your trust and satisfaction
                are our top priorities. Our support team is here to help you every
                step of the way.
              </Text>
              <Flex gap={4} mt={2}>
                {socialLinks.map((social, index) => (
                  <Box 
                    key={index}
                    as="a" 
                    href={social.href} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    bg="whiteAlpha.200"
                    borderRadius="full"
                    w="40px"
                    h="40px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    transition="all 0.3s ease"
                    _hover={{ 
                      bg: accentColor, 
                      transform: "translateY(-5px)",
                      boxShadow: "lg" 
                    }}
                  >
                    <Icon as={social.icon} boxSize="18px" />
                  </Box>
                ))}
              </Flex>
            </VStack>
          </GridItem>
          
          {/* Quick Links */}
          <GridItem>
            <VStack align={{ base: "flex-start", md: "flex-start" }} spacing={6}>
              <Text 
                fontSize={{ base: "lg", md: "xl" }} 
                fontWeight="bold"
                position="relative"
                _after={{
                  content: '""',
                  position: "absolute",
                  bottom: "-8px",
                  left: "0",
                  width: "40px",
                  height: "3px",
                  bg: accentColor,
                  borderRadius: "full"
                }}
              >
                Quick Links
              </Text>
              <VStack align="flex-start" spacing={4} pt={2}>
                {navLinks.map((link, index) => (
                  <ScrollLink
                    key={index}
                    className="cursor-pointer"
                    to={link.to}
                    smooth={true}
                    duration={800}
                  >
                    <Box 
                      as="span"
                      position="relative"
                      sx={{
                        "& > span": {
                          color: accentColor,
                          opacity: 0,
                          marginRight: "5px",
                          transition: "opacity 0.3s ease",
                        },
                        "&:hover > span": {
                          opacity: 1,
                        },
                        "&:hover > p": {
                          color: "white",
                          transform: "translateX(5px)",
                        }
                      }}
                    >
                      <Box as="span">{">"}</Box>
                      <Text 
                        as="p"
                        fontSize={{ base: "sm", md: "md" }} 
                        color="gray.300"
                        display="inline"
                        transition="all 0.3s ease"
                      >
                        {link.name}
                      </Text>
                    </Box>
                  </ScrollLink>
                ))}
              </VStack>
            </VStack>
          </GridItem>
          
          {/* Contact Info */}
          <GridItem>
            <VStack align={{ base: "flex-start", md: "flex-start" }} spacing={6}>
              <Text 
                fontSize={{ base: "lg", md: "xl" }} 
                fontWeight="bold"
                position="relative"
                _after={{
                  content: '""',
                  position: "absolute",
                  bottom: "-8px",
                  left: "0",
                  width: "40px",
                  height: "3px",
                  bg: accentColor,
                  borderRadius: "full"
                }}
              >
                Contact Us
              </Text>
              <VStack align="flex-start" spacing={4} pt={2}>
                <Flex align="center" gap={3}>
                  <Box 
                    p={2} 
                    bg={`${accentColor}30`} 
                    borderRadius="md"
                    color={accentColor}
                  >
                    <Icon as={FaEnvelope} boxSize={4} />
                  </Box>
                  <Text fontSize={{ base: "sm", md: "md" }} color="gray.300">
                    support@sylo.com
                  </Text>
                </Flex>
                <Flex align="center" gap={3}>
                  <Box 
                    p={2} 
                    bg={`${accentColor}30`} 
                    borderRadius="md"
                    color={accentColor}
                  >
                    <Icon as={FaPhone} boxSize={4} />
                  </Box>
                  <Text fontSize={{ base: "sm", md: "md" }} color="gray.300">
                    +234 903 833 2467 
                  </Text>
                </Flex>
                <Flex align="center" gap={3}>
                  <Box 
                    p={2} 
                    bg={`${accentColor}30`} 
                    borderRadius="md"
                    color={accentColor}
                  >
                    <Icon as={FaPhone} boxSize={4} />
                  </Box>
                  <Text fontSize={{ base: "sm", md: "md" }} color="gray.300">
                    +234 812 927 3412
                  </Text>
                </Flex>
                <Flex align="center" gap={3}>
                  <Box 
                    p={2} 
                    bg={`${accentColor}30`} 
                    borderRadius="md"
                    color={accentColor}
                  >
                    <Icon as={FaPhone} boxSize={4} />
                  </Box>
                  <Text fontSize={{ base: "sm", md: "md" }} color="gray.300">
                    +234 912 995 6648
                  </Text>
                </Flex>
                <Flex align="center" gap={3}>
                  <Box 
                    p={2} 
                    bg={`${accentColor}30`} 
                    borderRadius="md"
                    color={accentColor}
                  >
                    <Icon as={FaMapMarkerAlt} boxSize={4} />
                  </Box>
                  <Text fontSize={{ base: "sm", md: "md" }} color="gray.300">
                    Lagos, Nigeria
                  </Text>
                </Flex>
              </VStack>
            </VStack>
          </GridItem>
        </Grid>
        
        {/* Footer Bottom */}
        <Divider my={10} borderColor={borderColor} />
        <Flex 
          direction={{ base: "column", md: "row" }} 
          justify="space-between" 
          align="center"
          gap={{ base: 6, md: 0 }}
        >
          <Text fontSize={{ base: "xs", md: "sm" }} textAlign={{ base: "center", md: "left" }} color="gray.400">
            © {new Date().getFullYear()} Sylo App. All rights reserved.
          </Text>
          <HStack spacing={6} textAlign="center">
            {legalLinks.map((link, index) => (
              <Link key={index} to={link.to}>
                <Text 
                  fontSize={{ base: "xs", md: "sm" }} 
                  color="gray.400"
                  transition="color 0.2s ease"
                  _hover={{ color: accentColor }}
                >
                  {link.name}
                </Text>
              </Link>
            ))}
          </HStack>
          <Text 
            fontSize={{ base: "xs", md: "sm" }} 
            textAlign={{ base: "center", md: "right" }} 
            color="gray.400"
          >
            Powered by <Box as="span" color={accentColor} fontWeight="medium">Zeek</Box>
          </Text>
        </Flex>
      </Container>
    </Box>
  );
};

export default Footer;