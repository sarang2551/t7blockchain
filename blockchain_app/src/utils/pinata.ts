import axios from 'axios'
import FormData from 'form-data'

export const GetIpfsUrlFromPinata = (pinataUrl:string) => {
    var IPFSUrl = pinataUrl.split("/");
    const lastIndex = IPFSUrl.length;
    const url = "https://ipfs.io/ipfs/"+IPFSUrl[lastIndex-1];
    return url;
};

//require('dotenv').config();
const key = process.env.PINATA_KEY;
const secret = process.env.PINATA_SECRET;

export const uploadJSONToIPFS = async(JSONBody:any) => {
    const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
    //making axios POST request to Pinata ⬇️
    return axios 
        .post(url, JSONBody, {
            headers: {
                pinata_api_key: key,
                pinata_secret_api_key: secret,
            }
        })
        .then(function (response:any) {
           return {
               success: true,
               pinataURL: "https://gateway.pinata.cloud/ipfs/" + response.data.IpfsHash
           };
        })
        .catch(function (error:Error) {
            console.log(error)
            return {
                success: false,
                message: error.message,
            }

    });
};

export const uploadFileToIPFS = async(file:File) => {
    const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
    //making axios POST request to Pinata ⬇️
    
    let data = new FormData();
    data.append('file', file);

    const metadata = JSON.stringify({
        name: 'testname',
        keyvalues: {
            exampleKey: 'exampleValue'
        }
    });
    data.append('pinataMetadata', metadata);

    //pinataOptions are optional
    const pinataOptions = JSON.stringify({
        cidVersion: 0,
        customPinPolicy: {
            regions: [
                {
                    id: 'FRA1',
                    desiredReplicationCount: 1
                },
                {
                    id: 'NYC1',
                    desiredReplicationCount: 2
                }
            ]
        }
    });
    data.append('pinataOptions', pinataOptions);
    try{
        const response = await axios.post(url, data, {
            maxBodyLength: Number.MAX_VALUE,
            headers: {
              'Content-Type': `multipart/form-data;`, //  boundary=${data._boundary}
      
              pinata_api_key: key,
              pinata_secret_api_key: secret, 
      
            }
          });
      
          console.log("image uploaded", response.data.IpfsHash);
          return {
            success: true,
            pinataURL: "https://gateway.pinata.cloud/ipfs/" + response.data.IpfsHash
          };
    }catch(error:any){
        console.log(error)
            return {
                success: false,
                message: error.message,
        }
    }
};