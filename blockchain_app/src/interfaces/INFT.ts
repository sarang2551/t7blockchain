export interface NFT {
    tokenId:number
    minter:string
    owner:string
    price:number
    currentlyListed:boolean
    image?:string
    name:string
    description?:string
    eventDate:string
    location:string
}