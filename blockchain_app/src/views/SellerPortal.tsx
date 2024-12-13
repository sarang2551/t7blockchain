// SellerPortal.tsx
import { useEffect, useState } from "react";
import NavBar from "../component/NavigationBar";
import {
  uploadFileAndMetadataToPinata,
  updateMetadataOnPinata,
} from "../utils/uploadToPinata";
import { getNFTMetadata } from "../utils/pinata";
import { ethers, BrowserProvider } from "ethers";
import MarketplaceData from "../utils/Marketplace.json";

interface FormData {
  eventName: string;
  date: string;
  location: string;
  maxPrice: string;
  quantity: string;
  description: string;
}

interface EditFormData {
  eventName: string;
  date: string;
  location: string;
  maxPrice: string;
  quantity: string;
  description: string;
}

interface Ticket {
  id: string;
  eventName: string;
  description: string;
  date: string;
  location: string;
  price: string;
  maxPrice: string;
  image: string;
  status: string;
}

const SellerPortal = () => {
  const [formData, setFormData] = useState<FormData>({
    eventName: "",
    date: "",
    location: "",
    maxPrice: "",
    quantity: "",
    description: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);

  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    eventName: "",
    date: "",
    location: "",
    maxPrice: "",
    quantity: "",
    description: "",
  });
  const [editLoading, setEditLoading] = useState(false);

  // Handle both input and textarea elements
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleEditInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditFormData({ ...editFormData, [name]: value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleCreateListing = async () => {
    setLoading(true);

    try {
      if (!imageFile) {
        alert("Please upload an image for the NFT.");
        setLoading(false);
        return;
      }

      if (!formData.quantity || parseInt(formData.quantity) <= 0) {
        alert("Quantity must be greater than 0.");
        setLoading(false);
        return;
      }

      if (!formData.maxPrice || parseFloat(formData.maxPrice) <= 0) {
        alert("Max price must be greater than 0.");
        setLoading(false);
        return;
      }

      const metadata = {
        name: formData.eventName,
        description: formData.description,
        keyValues: {
          description: formData.description,
          date: formData.date,
          location: formData.location,
          maxPrice: formData.maxPrice,
          quantity: formData.quantity,
        },
        image: "", // Will be populated by Pinata upload
      };

      const uploadResponse = await uploadFileAndMetadataToPinata(
        imageFile,
        metadata
      );
      console.log("Uploaded to Pinata:", uploadResponse);

      const tokenURI = `ipfs://${uploadResponse.IpfsHash}`;

      if (!window.ethereum) {
        alert("MetaMask is not installed!");
        setLoading(false);
        return;
      }

      const networkVersion = await window.ethereum.request({
        method: "net_version",
      });
      if (networkVersion !== "17000") {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x4268" }],
        });
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner(0);
      const nftContract = new ethers.Contract(
        MarketplaceData.address,
        MarketplaceData.abi,
        signer
      );

      const transaction = await nftContract.mintBatch(
        tokenURI,
        ethers.parseEther(formData.maxPrice),
        formData.eventName,
        formData.description,
        parseInt(formData.quantity)
      );
      await transaction.wait();

      alert(
        `${formData.quantity} ticket${
          parseInt(formData.quantity) > 1 ? "s" : ""
        } minted successfully!`
      );
      fetchMintedTickets();
    } catch (error) {
      console.error("Error minting tickets:", error);
      alert("Failed to mint the tickets. Check the console for details.");
    }

    setLoading(false);
  };

  const fetchMintedTickets = async () => {
    setLoading(true);
    try {
      if (!window.ethereum) {
        alert("MetaMask is not installed!");
        setLoading(false);
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      const contract = new ethers.Contract(
        MarketplaceData.address,
        MarketplaceData.abi,
        signer
      );

      const tokenIds = await contract.getMintedTokens(userAddress);

      const newTickets = await Promise.all(
        tokenIds.map(async (tokenId: any) => {
          const tokenDetails = await contract.getTokenDetails(tokenId);
          const tokenURI = await contract.tokenURI(tokenId);

          const metadataResult = await getNFTMetadata(
            tokenURI.replace("ipfs://", "")
          );
          const offchainmetadata: any = metadataResult.metadata || {};

          const imageUrl = offchainmetadata.image?.startsWith("ipfs://")
            ? `https://gateway.pinata.cloud/ipfs/${offchainmetadata.image.replace(
                "ipfs://",
                ""
              )}`
            : offchainmetadata.image || "";

          // Determine status based on original logic
          let status = "Unlisted";
          if (tokenDetails.currentlyListed) {
            status = "Listed";
          } else if (
            tokenDetails.owner &&
            userAddress &&
            tokenDetails.owner.toLowerCase() !== userAddress.toLowerCase()
          ) {
            status = "Sold";
          }

          return {
            id: tokenId.toString(),
            eventName: tokenDetails.name,
            description:
              offchainmetadata.keyValues?.description ||
              tokenDetails.description,
            date: offchainmetadata.keyValues?.date || "Unknown",
            location: offchainmetadata.keyValues?.location || "Unknown",
            price: ethers.formatUnits(tokenDetails.price.toString(), "ether"),
            maxPrice: ethers.formatUnits(
              tokenDetails.maxPrice.toString(),
              "ether"
            ),
            image: imageUrl,
            status,
          };
        })
      );

      setTickets(newTickets);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      alert("Failed to fetch tickets. Check the console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditTicket = async (ticket: Ticket) => {
    setEditingTicket(ticket);
    setEditLoading(true);
    try {
      if (!window.ethereum) {
        alert("MetaMask is not installed!");
        return;
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        MarketplaceData.address,
        MarketplaceData.abi,
        signer
      );

      const tokenURI = await contract.tokenURI(ticket.id);
      const tokenDetails = await contract.getTokenDetails(ticket.id);
      const metadataResult = await getNFTMetadata(
        tokenURI.replace("ipfs://", "")
      );

      if (metadataResult.success && metadataResult.metadata) {
        const metadata = metadataResult.metadata;

        setEditFormData({
          eventName:
            metadata.name || tokenDetails.name || "",
          description:
            metadata.keyValues?.description || tokenDetails.description || "",
          maxPrice: ethers.formatUnits(tokenDetails.maxPrice, "ether"),
          quantity: "", // Quantity is not stored on-chain, if needed store it in metadata
          date: metadata.keyValues?.date || "Unknown",
          location: metadata.keyValues?.location || "Unknown",
        });
      } else {
        console.error(
          "Error fetching metadata from Pinata:",
          metadataResult.message
        );
        alert("Failed to load metadata. Check the console for details.");
      }
    } catch (error) {
      console.error("Error fetching metadata:", error);
      alert("An error occurred while fetching ticket metadata.");
    } finally {
      setEditLoading(false);
    }
  };

  const submitEditTicket = async () => {
    if (!editingTicket) return;
    setEditLoading(true);
    try {
      if (!window.ethereum) {
        alert("MetaMask is not installed!");
        setEditLoading(false);
        return;
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        MarketplaceData.address,
        MarketplaceData.abi,
        signer
      );

      const tokenURI = await contract.tokenURI(editingTicket.id);
      const cid = tokenURI.replace("ipfs://", "");
      const currentMetadataResult = await getNFTMetadata(cid);

      if (!currentMetadataResult.success || !currentMetadataResult.metadata) {
        throw new Error("Failed to fetch existing metadata from Pinata.");
      }

      const currentMetadata = currentMetadataResult.metadata;

      // Update maxPrice on-chain if changed
      if (
        editFormData.maxPrice &&
        parseFloat(editFormData.maxPrice) > 0
      ) {
        const tx = await contract.updateMaxPrice(
          editingTicket.id,
          ethers.parseEther(editFormData.maxPrice)
        );
        await tx.wait();
      } else {
        alert("Please enter a valid max price.");
        setEditLoading(false);
        return;
      }

      const updatedMetadata = {
        name: editFormData.eventName || currentMetadata.name,
        description:
          editFormData.description ||
          currentMetadata.keyValues?.description,
        keyValues: {
          description:
            editFormData.description ||
            currentMetadata.keyValues?.description,
          date: editFormData.date || currentMetadata.keyValues?.date,
          location:
            editFormData.location ||
            currentMetadata.keyValues?.location,
        },
        image: currentMetadata.image,
      };

      const updateResponse = await updateMetadataOnPinata(
        cid,
        updatedMetadata
      );
      console.log(
        "Metadata updated successfully on Pinata:",
        updateResponse
      );

      alert("Ticket updated successfully!");
      fetchMintedTickets();
      setEditingTicket(null);
    } catch (error) {
      console.error("Error updating ticket:", error);
      alert("Failed to update ticket. Check the console for details.");
    } finally {
      setEditLoading(false);
    }
  };

  useEffect(() => {
    fetchMintedTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Seller's Portal</h1>

        {/* Create a New Event Form */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-12">
          <h2 className="text-2xl font-semibold mb-4">Create a New Event</h2>
          <form>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Event Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Event Name
                </label>
                <input
                  type="text"
                  name="eventName"
                  value={formData.eventName}
                  onChange={handleInputChange}
                  placeholder="Enter event name"
                  className="mt-1 block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Enter location"
                  className="mt-1 block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Max Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Max Price (ETH)
                </label>
                <input
                  type="number"
                  name="maxPrice"
                  value={formData.maxPrice}
                  onChange={handleInputChange}
                  placeholder="Enter max price"
                  className="mt-1 block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                />
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Quantity
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  placeholder="Enter ticket quantity"
                  className="mt-1 block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter event description"
                  className="mt-1 block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                ></textarea>
              </div>

              {/* Event Image */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Event Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleCreateListing}
                disabled={loading}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    ></path>
                  </svg>
                ) : null}
                {loading ? "Minting..." : "Mint Tickets"}
              </button>
            </div>
          </form>
        </div>

        {/* My Minted Tickets */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">My Minted Tickets</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="px-6 py-3 border-b-2 border-gray-300 text-left leading-4 text-blue-600 tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 border-b-2 border-gray-300 text-left leading-4 text-blue-600 tracking-wider">
                    Thumbnail
                  </th>
                  <th className="px-6 py-3 border-b-2 border-gray-300 text-left leading-4 text-blue-600 tracking-wider">
                    Event Name
                  </th>
                  <th className="px-6 py-3 border-b-2 border-gray-300 text-left leading-4 text-blue-600 tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 border-b-2 border-gray-300 text-left leading-4 text-blue-600 tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 border-b-2 border-gray-300 text-left leading-4 text-blue-600 tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 border-b-2 border-gray-300 text-left leading-4 text-blue-600 tracking-wider">
                    Price (ETH)
                  </th>
                  <th className="px-6 py-3 border-b-2 border-gray-300 text-left leading-4 text-blue-600 tracking-wider">
                    Max Price (ETH)
                  </th>
                  <th className="px-6 py-3 border-b-2 border-gray-300 text-left leading-4 text-blue-600 tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 border-b-2 border-gray-300 text-left leading-4 text-blue-600 tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {tickets.map((ticket, index) => (
                  <tr key={ticket.id} className="hover:bg-gray-100">
                    <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200">
                      <img
                        src={ticket.image}
                        alt={ticket.eventName}
                        className="w-12 h-12 object-cover rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200">
                      {ticket.eventName}
                    </td>
                    <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200">
                      {ticket.description}
                    </td>
                    <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200">
                      {ticket.date}
                    </td>
                    <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200">
                      {ticket.location}
                    </td>
                    <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200">
                      {ticket.price}
                    </td>
                    <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200">
                      {ticket.maxPrice}
                    </td>
                    <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          ticket.status === "Listed"
                            ? "bg-green-100 text-green-800"
                            : ticket.status === "Sold"
                            ? "bg-red-100 text-red-800"
                            : ticket.status === "Unlisted"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200">
                      {ticket.status === "Unlisted" ? (
                        <button
                          onClick={() => handleEditTicket(ticket)}
                          className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none"
                        >
                          Edit
                        </button>
                      ) : ticket.status === "Listed" ? (
                        <button
                          onClick={() =>
                            alert("You need to Unlist Your ticket first")
                          }
                          className="px-3 py-1 bg-gray-500 text-white rounded-md cursor-not-allowed"
                          disabled
                        >
                          Edit
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Ticket Modal */}
        {editingTicket && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Edit Ticket Metadata</h3>
                <button
                  onClick={() => setEditingTicket(null)}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <form>
                <div className="space-y-4">
                  {/* Event Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Event Name
                    </label>
                    <input
                      type="text"
                      name="eventName"
                      value={editFormData.eventName}
                      onChange={handleEditInputChange}
                      className="mt-1 block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={editFormData.description}
                      onChange={handleEditInputChange}
                      className="mt-1 block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                    ></textarea>
                  </div>

                  {/* Max Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Max Price (ETH)
                    </label>
                    <input
                      type="number"
                      name="maxPrice"
                      value={editFormData.maxPrice || ""}
                      onChange={handleEditInputChange}
                      min="0"
                      className="mt-1 block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Quantity
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      value={editFormData.quantity}
                      readOnly
                      className="mt-1 block w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-md cursor-not-allowed"
                    />
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Date
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={editFormData.date}
                      onChange={handleEditInputChange}
                      className="mt-1 block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={editFormData.location}
                      onChange={handleEditInputChange}
                      className="mt-1 block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setEditingTicket(null)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={submitEditTicket}
                    disabled={editLoading}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editLoading ? (
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        ></path>
                      </svg>
                    ) : null}
                    {editLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerPortal;
