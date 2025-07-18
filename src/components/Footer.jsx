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
  useColorModeValue,
  SimpleGrid
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

  const contactInfo = [
    { icon: FaEnvelope, text: "support@sylo.com", type: "email" },
    { icon: FaPhone, text: "+234 903 833 2467", type: "phone" },
    { icon: FaPhone, text: "+234 812 927 3412", type: "phone" },
    { icon: FaPhone, text: "+234 912 995 6648", type: "phone" },
    { icon: FaMapMarkerAlt, text: "Lagos, Nigeria", type: "location" }
  ];

  // Theme colors
  const bgColor = useColorModeValue("#111827", "#111827");
  const accentColor = useColorModeValue("#B38939", "#D4A256");
  const textColor = useColorModeValue("white", "white");
  const borderColor = useColorModeValue("gray.700", "gray.700");
  const inputBgColor = useColorModeValue("white", "gray.800");

  return (
    <Box as="footer" bg={bgColor} color={textColor} w="100%" overflow="hidden" position="relative">
      {/* Multiple decorative elements for better visual */}
      <Box 
        position="absolute" 
        top="5%" 
        right="-5%" 
        w={{ base: "250px", md: "350px", lg: "450px" }}
        h={{ base: "250px", md: "350px", lg: "450px" }}
        borderRadius="full" 
        bg={`${accentColor}15`}
        filter="blur(80px)"
        zIndex="0"
      />
      <Box 
        position="absolute" 
        bottom="10%" 
        left="-10%" 
        w={{ base: "200px", md: "300px" }}
        h={{ base: "200px", md: "300px" }}
        borderRadius="full" 
        bg={`${accentColor}10`}
        filter="blur(60px)"
        zIndex="0"
      />
      
      {/* Enhanced Newsletter Section */}
      <Box 
        py={{ base: 12, md: 16, lg: 20 }} 
        bg="linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0) 100%)" 
        position="relative" 
        zIndex="1"
        borderBottom="1px solid"
        borderColor="whiteAlpha.100"
      >
        <Container maxW="container.xl" px={{ base: 4, md: 6, lg: 8 }}>
          <VStack spacing={{ base: 8, md: 10 }} maxW="800px" mx="auto">
            <VStack spacing={4} textAlign="center">
              <Text 
                fontSize={{ base: "2xl", sm: "3xl", md: "4xl", lg: "5xl" }} 
                fontWeight="bold"
                bgGradient={`linear(45deg, ${accentColor}, white, ${accentColor})`}
                bgClip="text"
                lineHeight="1.1"
                letterSpacing="-0.02em"
              >
                Stay Updated with Sylo
              </Text>
              <Text 
                fontSize={{ base: "sm", md: "lg" }} 
                color="gray.300"
                maxW="600px"
                lineHeight="1.6"
              >
                Join our exclusive community! First 100 users get <Box as="span" color={accentColor} fontWeight="bold">Zero Fees for Life</Box> ✨
              </Text>
            </VStack>
            
            <Box w="full" maxW="500px">
              <VStack spacing={4}>
                <HStack w="full" spacing={0}>
                  <Input 
                    type="number" 
                    placeholder="Enter your WhatsApp number" 
                    py={{ base: 6, md: 7 }}
                    px={{ base: 4, md: 6 }}
                    borderRadius="full"
                    borderTopRightRadius="0"
                    borderBottomRightRadius="0"
                    bg={inputBgColor}
                    color="gray.800"
                    border="2px solid transparent"
                    boxShadow="0 10px 25px rgba(0,0,0,0.1)"
                    _placeholder={{ color: "gray.500" }}
                    _focus={{ 
                      boxShadow: `0 0 0 2px ${accentColor}`,
                      borderColor: accentColor
                    }}
                    fontSize={{ base: "sm", md: "md" }}
                    flex="1"
                  />
                  <Button 
                    bg={accentColor} 
                    py={{ base: 6, md: 7 }}
                    px={{ base: 6, md: 8 }}
                    borderRadius="full"
                    borderTopLeftRadius="0"
                    borderBottomLeftRadius="0"
                    _hover={{ 
                      bg: `${accentColor}90`, 
                      transform: "translateY(-2px)",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
                    }}
                    _active={{ transform: "translateY(0)" }}
                    transition="all 0.3s ease"
                    fontWeight="bold"
                    boxShadow="0 10px 25px rgba(0,0,0,0.1)"
                    fontSize={{ base: "sm", md: "md" }}
                    color="white"
                    minW="120px"
                  >
                    Subscribe
                  </Button>
                </HStack>
                <Text fontSize="xs" color="gray.400" textAlign="center">
                  🔒 We respect your privacy. Unsubscribe anytime.
                </Text>
              </VStack>
            </Box>
          </VStack>
        </Container>
      </Box>
      
      {/* Main Footer Content with Better Layout */}
      <Container maxW="container.xl" py={{ base: 12, md: 16, lg: 20 }} px={{ base: 4, md: 6, lg: 8 }} position="relative" zIndex="1">
        
        {/* <Divider borderColor={borderColor} mb={{ base: 10, md: 16 }} />
         */}
        {/* Middle Section - Links and Contact */}
        <SimpleGrid 
          columns={{ base: 1, sm: 2, lg: 3 }} 
          spacing={{ base: 8, md: 12 }}
          mb={{ base: 10, md: 16 }}
        >
          {/* Quick Links */}
          <VStack align="flex-start" spacing={6}>
            <Text 
              fontSize={{ base: "lg", md: "xl" }} 
              fontWeight="bold"
              position="relative"
              color={accentColor}
              _after={{
                content: '""',
                position: "absolute",
                bottom: "-10px",
                left: "0",
                width: "50px",
                height: "3px",
                bg: accentColor,
                borderRadius: "full"
              }}
            >
              Quick Links
            </Text>
            <VStack align="flex-start" spacing={3} pt={2}>
              {navLinks.map((link, index) => (
                <ScrollLink
                  key={index}
                  className="cursor-pointer"
                  to={link.to}
                  smooth={true}
                  duration={800}
                >
                  <Flex
                    align="center"
                    transition="all 0.3s ease"
                    _hover={{ 
                      color: accentColor,
                      transform: "translateX(8px)"
                    }}
                    role="group"
                  >
                    <Icon 
                      as={FaEnvelope} 
                      boxSize={0} 
                      mr={2} 
                      opacity={0}
                      transition="all 0.3s ease"
                      _groupHover={{ boxSize: "12px", opacity: 1 }}
                    />
                    <Text fontSize={{ base: "sm", md: "md" }} color="gray.300">
                      {link.name}
                    </Text>
                  </Flex>
                </ScrollLink>
              ))}
            </VStack>
          </VStack>
          
          {/* Contact Info */}
          <VStack align="flex-start" spacing={6}>
            <Text 
              fontSize={{ base: "lg", md: "xl" }} 
              fontWeight="bold"
              position="relative"
              color={accentColor}
              _after={{
                content: '""',
                position: "absolute",
                bottom: "-10px",
                left: "0",
                width: "50px",
                height: "3px",
                bg: accentColor,
                borderRadius: "full"
              }}
            >
              Contact Info
            </Text>
            <VStack align="flex-start" spacing={4} pt={2}>
              {contactInfo.map((contact, index) => (
                <Flex 
                  key={index} 
                  align="center" 
                  gap={3}
                  transition="all 0.3s ease"
                  _hover={{ 
                    transform: "translateX(5px)",
                    color: accentColor
                  }}
                >
                  <Box 
                    p={2.5}
                    bg={`${accentColor}20`}
                    borderRadius="lg"
                    color={accentColor}
                    transition="all 0.3s ease"
                    _hover={{ bg: `${accentColor}40` }}
                  >
                    <Icon as={contact.icon} boxSize={4} />
                  </Box>
                  <Text 
                    fontSize={{ base: "sm", md: "md" }} 
                    color="gray.300"
                    wordBreak="break-word"
                  >
                    {contact.text}
                  </Text>
                </Flex>
              ))}
            </VStack>
          </VStack>
          
          {/* Support Hours */}
          <VStack align="flex-start" spacing={6}>
            <Text 
              fontSize={{ base: "lg", md: "xl" }} 
              fontWeight="bold"
              position="relative"
              color={accentColor}
              _after={{
                content: '""',
                position: "absolute",
                bottom: "-10px",
                left: "0",
                width: "50px",
                height: "3px",
                bg: accentColor,
                borderRadius: "full"
              }}
            >
              Support Hours
            </Text>
            <VStack align="flex-start" spacing={3} pt={2}>
              <Text fontSize={{ base: "sm", md: "md" }} color="gray.300">
                <Box as="span" color={accentColor} fontWeight="semibold">Monday - Friday:</Box><br />
                9:00 AM - 6:00 PM WAT
              </Text>
              <Text fontSize={{ base: "sm", md: "md" }} color="gray.300">
                <Box as="span" color={accentColor} fontWeight="semibold">Weekend:</Box><br />
                10:00 AM - 4:00 PM WAT
              </Text>
              <Box 
                bg={`${accentColor}20`} 
                px={4} 
                py={2} 
                borderRadius="lg"
                border="1px solid"
                borderColor={`${accentColor}40`}
                mt={2}
              >
                <Text fontSize="xs" color={accentColor} fontWeight="semibold">
                  🚀 24/7 Emergency Support Available
                </Text>
              </Box>
                {/* Social Media integrated under description */}
              <VStack spacing={4} align="flex-start" pt={2}>
                <Text 
                  fontSize={{ base: "md", lg: "lg" }} 
                  fontWeight="semibold"
                  color={accentColor}
                  display="flex"
                  alignItems="center"
                  gap={2}
                >
                  Connect with us
                  <Box w="40px" h="2px" bg={accentColor} />
                </Text>
                <HStack spacing={3}>
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
                      w={{ base: "40px", md: "44px" }}
                      h={{ base: "40px", md: "44px" }}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      transition="all 0.3s ease"
                      border="1px solid"
                      borderColor="whiteAlpha.300"
                      _hover={{ 
                        bg: accentColor, 
                        transform: "translateY(-4px)",
                        boxShadow: `0 8px 25px ${accentColor}30`,
                        borderColor: accentColor
                      }}
                    >
                      <Icon as={social.icon} boxSize={{ base: "18px", md: "20px" }} />
                    </Box>
                  ))}
                </HStack>
              </VStack>
            </VStack>
          </VStack>
        </SimpleGrid>
        
        {/* Bottom Section - Legal and Copyright */}
        <Box 
          borderTop="1px solid"
          borderColor={borderColor}
          pt={{ base: 6, md: 8 }}
        >
          <Flex 
            direction={{ base: "column", md: "row" }} 
            justify="space-between" 
            align="center"
            gap={{ base: 4, md: 0 }}
          >
            <Text 
              fontSize={{ base: "xs", md: "sm" }} 
              color="gray.400"
              textAlign={{ base: "center", md: "left" }}
            >
              © {new Date().getFullYear()} Sylo App. All rights reserved.
            </Text>
            
            <HStack 
              spacing={8} 
              justify="center"
              flexWrap="wrap"
            >
              {legalLinks.map((link, index) => (
                <Link key={index} to={link.to}>
                  <Text 
                    fontSize={{ base: "xs", md: "sm" }} 
                    color="gray.400"
                    transition="all 0.2s ease"
                    _hover={{ 
                      color: accentColor,
                      transform: "translateY(-2px)"
                    }}
                    whiteSpace="nowrap"
                  >
                    {link.name}
                  </Text>
                </Link>
              ))}
            </HStack>
            
            <Text 
              fontSize={{ base: "xs", md: "sm" }} 
              color="gray.400"
              textAlign={{ base: "center", md: "right" }}
            >
              Powered by{" "}
              <Box 
                as="span" 
                color={accentColor} 
                fontWeight="bold"
                transition="all 0.2s ease"
                _hover={{ color: "white" }}
              >
                Zeek
              </Box>
            </Text>
          </Flex>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;