import React from "react";
import "./CardNFTStyles.css";

const CardNFT = ({ nft }) => {
  const { image_url, traits } = nft;
  return (
    <div className="card-nft-container">
      <div className="card-image-container">
        <img src={image_url} alt="nft" />
      </div>

      <div className="card-nft-info">
        <ul>
          {traits.map((trait, index) => (
            <li key={index}>
              {trait.trait_type}: {trait.value}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CardNFT;
