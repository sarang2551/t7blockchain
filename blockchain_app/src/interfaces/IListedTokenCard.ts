import { ListedToken } from "./ListedToken";

export default interface ListedTokenCardProps {
    token: ListedToken;
    onBuy?: () => void; // Optional callback for the "Buy Token" button
}