import { PinataSDK } from "pinata-web3";

const pinata = new PinataSDK({
  pinataJwt: process.env.REACT_APP_PINATA_JWT,
  pinataGateway: process.env.REACT_APP_PINATA_GATEWAY,
});

/**
 * Upload a file and its metadata to Pinata
 * @param {File} file - The file to upload (e.g., image for NFT)
 * @param {Object} metadata - Metadata to associate with the file
 * @returns {Promise<Object>} - The upload response from Pinata
 */
interface Metadata {
  name: string;
  [key: string]: any;
}


export const uploadFileAndMetadataToPinata = async (file: File, metadata: Metadata) => {
  if (!file) {
    throw new Error("No file provided for upload.");
  }

  if (!metadata) {
    throw new Error("No metadata provided for upload.");
  }

  try {
    console.log("Uploading file to Pinata...");

    const flattenedMetadata = {
      name: metadata.name,
      description: metadata.description,
      price: metadata.attributes[0].value,
      quantity: metadata.attributes[1].value,
    };

    const upload = await pinata.upload.file(file).addMetadata({
      name: metadata.name,
      keyValues: flattenedMetadata,
    });

    console.log("Upload successful:", upload);
    return upload; 
  } catch (error) {
    console.error("Error uploading file and metadata to Pinata:", error);
    throw error;
  }
};