export interface ListedToken {
    id: number; // Token ID
    eventName: string | undefined; // Event name from off-chain metadata
    description: string; // Description, defaulted if not available
    date: string; // Event date, defaulted if not available
    location: string; // Event location, defaulted if not available
    price: string; // Price in Ether
    image: string; // Image URL
    status: "Listed" | "Sold" | "Unlisted"; // NFT listing status
  }
  