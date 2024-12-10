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


export const uploadFileAndMetadataToPinata = async (
  file: File,
  metadata: Metadata
) => {
  if (!file) {
    throw new Error("No file provided for upload.");
  }

  if (!metadata) {
    throw new Error("No metadata provided for upload.");
  }

  try {
    console.log("Uploading file to Pinata...");

    // Flatten metadata for keyValues
    const flattenedMetadata = {
      name: metadata.name,
      description: metadata.description,
      price: metadata.attributes.find((attr: { trait_type: string; value: any }) => attr.trait_type === "Price")?.value,
      quantity: metadata.attributes.find((attr: { trait_type: string; value: any }) => attr.trait_type === "Quantity")?.value,
      date: metadata.attributes.find((attr: { trait_type: string; value: any }) => attr.trait_type === "Date")?.value,
      location: metadata.attributes.find((attr: { trait_type: string; value: any }) => attr.trait_type === "Location")?.value,
    };

    // Upload file to Pinata with metadata
    const upload = await pinata.upload.file(file).addMetadata({
      name: metadata.name,
      keyValues: flattenedMetadata,
    });

    console.log("Upload successful:", upload);
    return upload; // Returns upload response
  } catch (error) {
    console.error("Error uploading file and metadata to Pinata:", error);
    throw error;
  }
};


/**
 * Update metadata for an existing file on Pinata
 * @param {string} cid - The CID of the existing file to update
 * @param {Metadata} metadata - Updated metadata to associate with the file
 * @returns {Promise<Object>} - The response from Pinata after updating metadata
 */
export const updateMetadataOnPinata = async (cid: string, metadata: Metadata) => {
  if (!cid) {
    throw new Error("No CID provided for metadata update.");
  }

  if (!metadata) {
    throw new Error("No metadata provided for update.");
  }

  try {
    console.log("Updating metadata on Pinata...");

    // Flatten metadata for keyValues
    const flattenedMetadata = {
      name: metadata.name,
      description: metadata.description,
      price: metadata.attributes?.find((attr: { trait_type: string; value: any }) => attr.trait_type === "Price")?.value,
      quantity: metadata.attributes?.find((attr: { trait_type: string; value: any }) => attr.trait_type === "Quantity")?.value,
      date: metadata.attributes?.find((attr: { trait_type: string; value: any }) => attr.trait_type === "Date")?.value,
      location: metadata.attributes?.find((attr: { trait_type: string; value: any }) => attr.trait_type === "Location")?.value,
    };

    // Call Pinata's updateMetadata function
    const update = await pinata.updateMetadata({
      cid,
      name: metadata.name,
      keyValues: flattenedMetadata,
    });

    console.log("Metadata updated successfully:", update);
    return update; // Return the update response
  } catch (error) {
    console.error("Error updating metadata on Pinata:", error);
    throw error;
  }
};
