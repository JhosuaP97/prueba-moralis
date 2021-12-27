import React, { useState, useEffect, useMemo } from "react";
import { useMoralis } from "react-moralis";
import "./App.css";

const ownerContractAddress = "0x6Bdde8b895cFa888cE235Da49068f2c94E81FEd4";
const urlOpenSea = `https://testnets-api.opensea.io/assets?owner=${ownerContractAddress}&order_direction=desc&offset=0&limit=20`;
const nft_contract_address = "0x0Fb6EF3505b9c52Ed39595433a21aF9B5FCc4431"; //NFT Minting Contract Use This One "Batteries Included", code of this contract is in the github repository under contract_base for your reference.

function App() {
  const {
    Moralis,
    user,
    logout,
    authenticate,
    enableWeb3,
    isInitialized,
    isAuthenticated,
    isWeb3Enabled,
  } = useMoralis();

  const web3 = new Moralis.Web3(window.ethereum);

  const [values, setValues] = useState({ tokenAddress: "", tokenId: "" });
  const [NFTS, setNFTS] = useState([]);
  const [file, setFile] = useState([]);
  const [name, setName] = useState("");
  const web3Account = useMemo(
    () => isAuthenticated && user.get("accounts")[0],
    [user, isAuthenticated]
  );

  const getAsset = async () => {
    try {
      const res = await Moralis.Plugins.opensea.getAsset({
        network: "testnet",
        tokenAddress: values.tokenAddress,
        tokenId: values.tokenId,
      });
      console.log(res);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (isInitialized) {
      Moralis.initPlugins();
    }
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (isAuthenticated && !isWeb3Enabled) {
      enableWeb3();
    }
    // eslint-disable-next-line
  }, [isAuthenticated]);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(urlOpenSea, {
        method: "GET",
      });
      const data = await response.json();
      console.log(data);
      setNFTS(data.assets);
    };
    fetchData();
  }, []);

  const onFileChange = (e) => {
    const data = e.target.files[0];
    setFile(data);
  };

  const upload = async () => {
    const imageFile = new Moralis.File(file.name, file);
    await imageFile.saveIPFS();
    const imageURI = imageFile.ipfs();
    const metadata = {
      name,
      image: imageURI,
    };
    const metadataFile = new Moralis.File("metadata.json", {
      base64: btoa(JSON.stringify(metadata)),
    });
    await metadataFile.saveIPFS();
    const metadataURI = metadataFile.ipfs();
    const txt = await mintToken(metadataURI).then(console.log);
    console.log(txt);
  };

  async function mintToken(_uri) {
    const encodedFunction = web3.eth.abi.encodeFunctionCall(
      {
        name: "mintToken",
        type: "function",
        inputs: [
          {
            type: "string",
            name: "tokenURI",
          },
        ],
      },
      [_uri]
    );
    const transactionParameters = {
      to: nft_contract_address,
      from: window.ethereum.selectedAddress,
      data: encodedFunction,
    };
    const txt = await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [transactionParameters],
    });
    return txt;
  }

  return (
    <>
      {isAuthenticated ? (
        <div>
          <div>{web3Account}</div>
          <button onClick={() => logout()}>Logout</button>
        </div>
      ) : (
        <button onClick={() => authenticate()}>Connect to Metamask</button>
      )}
      <div>
        <div style={{ margin: "1rem 0" }}>
          <input
            type="text"
            placeholder="NFT Token Address"
            value={values.tokenAddress}
            onChange={(e) =>
              setValues({ ...values, tokenAddress: e.target.value })
            }
          />
          <input
            type="number"
            placeholder="NFT Token ID"
            value={values.tokenId}
            onChange={(e) => setValues({ ...values, tokenId: e.target.value })}
          />
          <button onClick={getAsset}>Get Asset</button>
        </div>
        <div>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <input type="file" name="selectedFile" onChange={onFileChange} />
          <button onClick={upload}>Upload</button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
            margin: "2rem",
          }}
        >
          {NFTS.map((nft, i) => (
            <div key={nft.id} style={{ textAlign: "center" }}>
              <small>{i}</small>
              <img
                src={nft.image_url}
                alt="nft"
                style={{
                  objectFit: "contain",
                  width: "10rem",
                  height: "10rem",
                  maxWidth: "100%",
                  maxHeight: "100%",
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default App;
