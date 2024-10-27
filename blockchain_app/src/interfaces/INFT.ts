interface NFT {
    tokenId:number
    seller:string
    owner:string
    price:number
    currentlyListed:boolean
    image?:string
    name:string
    description?:string
}