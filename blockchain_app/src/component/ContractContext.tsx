import React, { createContext, useContext, useEffect, useState } from "react";
import { ethers, BrowserProvider, Contract } from "ethers";
import MarketplaceData from "../contracts/MarketPlace.json";

interface ContractContextProps {
  nftContract: Contract | null;
  signer: ethers.JsonRpcSigner | null;
  provider: BrowserProvider | null;
  initializeContract: () => Promise<void>;
}

const ContractContext = createContext<ContractContextProps>({
  nftContract: null,
  signer: null,
  provider: null,
  initializeContract: async () => {},
});

export const ContractProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [nftContract, setNftContract] = useState<Contract | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);

  const initializeContract = async () => {
    try {
      const browserProvider = window.ethereum ? new BrowserProvider(window.ethereum) : null;
      if (!browserProvider) {
        alert("MetaMask has not been installed!");
        return;
      }
      setProvider(browserProvider);

      const currentSigner = await browserProvider.getSigner();
      setSigner(currentSigner);

      const contractInstance = new ethers.Contract(
        MarketplaceData.address,
        MarketplaceData.abi,
        currentSigner
      );
      setNftContract(contractInstance);
    } catch (error) {
      console.error("Failed to initialize contract:", error);
    }
  };

  useEffect(() => {
    initializeContract();
  }, []);

  return (
    <ContractContext.Provider value={{ nftContract, signer, provider, initializeContract }}>
      {children}
    </ContractContext.Provider>
  );
};

export const useContract = () => useContext(ContractContext);
