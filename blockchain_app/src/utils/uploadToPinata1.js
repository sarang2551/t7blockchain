import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();


/**
 * Upload a file to Pinata
 * @param {File} file - File to upload
 * @returns {Promise<string>} - IPFS hash (CID) of the uploaded file
 */
export const uploadFileToPinata = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
        const response = await axios.post(
            'https://api.pinata.cloud/pinning/pinFileToIPFS',
            formData,
            {
                maxContentLength: 'Infinity',
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
                    pinata_api_key: process.env.PINATA_KEY,
                    pinata_secret_api_key: process.env.PINATA_SECRET,
                },
            }
        );
        return response.data.IpfsHash; // The CID of the uploaded file
    } catch (error) {
        console.error('Error uploading file to Pinata:', error);
        throw error;
    }
};

/**
 * Upload JSON metadata to Pinata
 * @param {Object} metadata - JSON metadata object
 * @returns {Promise<string>} - IPFS hash (CID) of the uploaded metadata
 */
export const uploadMetadataToPinata = async (metadata) => {
    try {
        const response = await axios.post(
            'https://api.pinata.cloud/pinning/pinJSONToIPFS',
            metadata,
            {
                headers: {
                    pinata_api_key: process.env.PINATA_KEY,
                    pinata_secret_api_key: process.env.PINATA_SECRET,
                },
            }
        );
        return response.data.IpfsHash; // The CID of the uploaded metadata
    } catch (error) {
        console.error('Error uploading metadata to Pinata:', error);
        throw error;
    }
};
