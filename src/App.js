import React, { useState, useEffect } from "react";
import { useMoralis } from "react-moralis";
import "./App.css";

function App() {
  const { Moralis, authenticate, isAuthenticated, user } = useMoralis();

  const address = user?.attributes?.ethAddress;
  const [NFTS, setNFTS] = useState([]);
  const [searchValue, setSearchValue] = useState("pancake");

  const getAssets = async (search) => {
    const options = {
      q: search,
      limit: 100,
      filter: "name",
    };

    const nfts = await Moralis.Web3API.token.searchNFTs(options);
    const results = await nfts.result;
    console.log(results);

    const resultToken = results.map((nft) => fixURL(nft.token_uri));

    const response = await resultToken.map(async (res) => {
      const params = { url: res };
      console.log({ res });
      //This function is call from moralis admin
      try {
        const metadata = await Moralis.Cloud.run("fetchJSON", params);
        return (
          metadata.data.image ||
          metadata.data.image_url ||
          metadata.data.imageUrl
        );
        console.log(metadata);
      } catch (error) {
        console.log(error);
      }
    });
    const final = await Promise.all(response);

    setNFTS(final);
  };

  function fixURL(url) {
    if (url.startsWith("ipfs")) {
      return `https://ipfs.moralis.io:2053/ipfs/${url
        .split("ipfs://ipfs/")
        .slice(-1)}`;
    }
    return `${url}?format=json`;
  }

  function checkImage(image) {
    if (image && image.startsWith("ipfs")) {
      return `https://ipfs.moralis.io:2053/ipfs/${image
        .split("ipfs://ipfs/")
        .slice(-1)}`;
    }

    return image;
  }

  const handleChange = (e) => setSearchValue(e.target.value);

  if (!isAuthenticated) {
    return (
      <div>
        <button onClick={() => authenticate()}>Authenticate</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Welcome {address}</h1>

      <form onSubmit={(e) => e.preventDefault()}>
        <input
          type="text"
          placeholder="Search"
          value={searchValue}
          onChange={handleChange}
        />
        <button type="submit" onClick={() => getAssets(searchValue)}>
          Get assets
        </button>
      </form>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "1rem",
        }}
      >
        {NFTS &&
          NFTS.map((nft, i) => (
            <div key={i}>
              {nft !== undefined && (
                <>
                  <small>{i}</small>
                  <img
                    style={{
                      objectFit: "cover",
                    }}
                    width="100"
                    height="100"
                    key={i}
                    src={checkImage(nft)}
                    alt="nft"
                  />
                </>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}

export default App;
