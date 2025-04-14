import React, { useState } from "react";
import "./FAQ.css";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { Box, Text } from "@chakra-ui/react";

const FAQ = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [openAccordionId, setOpenAccordionId] = useState(null);

  const accordionData = [
    {
      id: 1,
      title: "What is TrustLink Escrow?",
      content:
        "TrustLink Escrow is a secure payment service that acts as a trusted third party between a buyer and a seller. It ensures that the funds are held safely until both parties fulfill their obligations in a transaction.",
    },
    {
      id: 2,
      title: "How does TrustLink Escrow work?",
      content:
        "When a buyer and seller agree on a transaction, the buyer sends the payment to TrustLink Escrow. TrustLink holds the funds until the buyer confirms receipt of the goods or services. Once the buyer is satisfied, TrustLink releases the funds to the seller.",
    },
    {
      id: 3,
      title: "Is TrustLink Escrow safe to use?",
      content:
        "Yes, TrustLink Escrow is highly secure and uses encryption and other security measures to protect your transactions. We verify the identity of all users to ensure a safe and reliable escrow service.",
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
        "TrustLink Escrow accepts various payment methods, including credit cards, bank transfers, and digital wallets. We provide a convenient and secure way for buyers and sellers to transact online.",
    },
  ];

  const toggleAccordion = (id) => {
    setOpenAccordionId(openAccordionId === id ? null : id);
  };

  return (
    <Box className="h-[auto] text-center md:text-start faq md:flex md:flex-row flex-col-reverse flex w-[100%] pr-5 pl-5 md:pl-[80px] md:pr-[80px] pt-14  pb-14">
      <div className="border md:p-10 p-3  w-[100%] text-left  md:mt-0 mt-14  h-[auto] rounded-3xl  ">
        {/* Accordion */}
        {accordionData.map((item) => (
          <div className="pt-3 pb-3 pl-3 pr-3" key={item.id}>
            <div
              className="cursor-pointer flex justify-between items-center"
              onClick={() => toggleAccordion(item.id)}
            >
              <Text className=" font-[700] accordion_title">
                {item.title}
              </Text>
              {openAccordionId === item.id ? (
                  <FaChevronUp className="text-[#B38939]" />
              ) : (
                <FaChevronDown className="text-[#B38939]" />
              )}
            </div>
            {openAccordionId === item.id && (
              <div className=" text-[14px] mt-2 font-[300] ">
                <Text>{item.content}</Text>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="w-[100%] h-[auto] md:ml-5 md:mr-5 md:mt-5 fg md:mb-5">
        <h1 className="font-bold md:text-left Uppercase  md:text-[50px] leading-[44px] md:leading-[60px]  text-[40px]">
          Frequently Asked Questions
        </h1>
        <p className=" text-[14px] mt-4 font-bold">What is Sylo Escrow?</p>
        <p className=" text-[14px] mt-4">
          Sylo is a secure, easy-to-use escrow platform that protects both buyers and sellers during online and offline transactions. We act as a trusted third-party, holding funds securely until both parties are satisfied and the deal is complete. Whether it's services, products, or high-value exchanges — Sylo ensures no one gets cheated.
        </p>
        <div className="flex justify-center md:justify-start">
          <button className="outine-none rounded-full text-white w-[auto] faq mt-5 start_btn  pl-8 pr-8 text-[16px] h[auto] pt-3 pb-3 font-bold flex items-center justify-center border-2 bg-[#B38939] border-[#B38939]">
            Get Started Now
          </button>
        </div>
      </div>
    </Box>
  );
};

export default FAQ;
