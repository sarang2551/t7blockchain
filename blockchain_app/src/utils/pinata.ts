import { PinataSDK } from "pinata-web3";

const pinata = new PinataSDK({
  pinataJwt: process.env.REACT_APP_PINATA_JWT!,
  pinataGateway: process.env.REACT_APP_PINATA_GATEWAY!,
});

export const GetIpfsUrlFromPinata = (pinataUrl:string) => {
    var IPFSUrl = pinataUrl.split("/");
    const lastIndex = IPFSUrl.length;
    const url = "https://ipfs.io/ipfs/"+IPFSUrl[lastIndex-1];
    return url;
};

/**
 * Fetch metadata of an NFT from Pinata using CID
 * @param cid - Content Identifier (CID) of the IPFS file
 * @returns Metadata object or error message
 */
export const getNFTMetadata = async (cid: string) => {
  try {
    // List files and filter by CID
    const files = await pinata.listFiles().cid(cid).all();

    if (!files || files.length === 0) {
      throw new Error("No metadata found for the specified CID.");
    }

    // Extract metadata from the first matching file
    const file = files[0];

    return {
      success: true,
      metadata: {
        name: file.metadata?.name || "Unnamed NFT",
        keyValues: file.metadata?.keyvalues || {},
        image: `ipfs://${cid}`, // Assumes CID is for the image
      },
    };
  } catch (error: any) {
    console.error(`Error fetching NFT metadata for CID ${cid}:`, error);
    return {
      success: false,
      message: error.message || "Failed to fetch metadata",
    };
  }
};
