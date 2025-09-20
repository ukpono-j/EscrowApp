import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Box, Flex, Icon, Text, useColorModeValue, useToast } from "@chakra-ui/react";
import { FaHome, FaUser, FaExchangeAlt, FaWallet } from "react-icons/fa";
import axios from "../../utils/axiosConfig";

const BottomNav = ({ onShowProfile, onShowToggleComponent }) => {
  const navigate = useNavigate();
  const toast = useToast();
  const [user, setUser] = useState(null);
  const activeColor = useColorModeValue("blue.500", "blue.200");
  const inactiveColor = useColorModeValue("gray.500", "gray.400");

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await axios.get("/api/users/user-details");
        setUser(response.data.user);
      } catch (error) {
        console.error("Error fetching user details:", error);
        if (error.response?.status === 401) {
          // Axios interceptor handles token refresh and redirect
        } else {
          // toast({
          //   title: "Error",
          //   description: "Failed to fetch user details. Please try again.",
          //   status: "error",
          //   duration: 5000,
          //   isClosable: true,
          // });
        }
      }
    };
    fetchUserDetails();
  }, [toast]);

  const navItems = [
    { path: "/dashboard", icon: FaHome, label: "Home", onClick: onShowToggleComponent },
    { path: "/transactions", icon: FaExchangeAlt, label: "Transactions", onClick: onShowToggleComponent },
    { path: "/wallet", icon: FaWallet, label: "Wallet", onClick: onShowToggleComponent },
    { path: "/profile", icon: FaUser, label: "Profile", onClick: onShowProfile },
  ];

  return (
    <Box
      position="fixed"
      bottom="0"
      left="0"
      right="0"
      bg={useColorModeValue("gray.800", "gray.900")}
      boxShadow="0 -2px 10px rgba(0, 0, 0, 0.2)"
      zIndex="10"
      display={{ base: "block", md: "none" }}
    >
      <Flex justify="space-around" align="center" py={2}>
        {navItems.map((item) => (
          <NavLink key={item.path} to={item.path} onClick={item.onClick} style={{ textDecoration: "none" }}>
            {({ isActive }) => (
              <Flex
                direction="column"
                align="center"
                color={isActive ? activeColor : inactiveColor}
                p={2}
                transition="all 0.3s"
              >
                <Icon as={item.icon} boxSize={6} />
                <Text fontSize="xs" mt={1}>
                  {item.label}
                </Text>
              </Flex>
            )}
          </NavLink>
        ))}
      </Flex>
    </Box>
  );
};

export default BottomNav;