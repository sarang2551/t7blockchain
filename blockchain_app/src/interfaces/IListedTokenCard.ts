import { NFT } from "./INFT";
import { ListedToken } from "./ListedToken";

export default interface ListedTokenCardProps {
    token: NFT;
    onBuy?: () => void; // Optional callback for the "Buy Token" button
}