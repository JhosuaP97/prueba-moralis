import React, { useState, useEffect, useMemo } from "react";
import { useMoralis } from "react-moralis";
import "./App.css";



const ownerContractAddress = "0x1D59181A7b9Df5F6F5AfBb301f6C92131ee787a6";
const urlOpenSea = `https://testnets-api.opensea.io/assets?owner=${ownerContractAddress}&order_direction=desc&offset=0&limit=10&offset=0`;

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
  const [properties, setProperties] = useState([{ trait_type: "", value: "" }]);
  const [search, setSearch] = useState("");
  const [contractAddress, setContractAddress] = useState("")

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
    const fetchData = async () => {
      const response = await fetch(urlOpenSea, {
        method: "GET",
      });
      const data = await response.json();
      console.log(data);
      setNFTS(data.assets);
    };
    fetchData();
  }, [])

  useEffect(() => {
    if (isAuthenticated && !isWeb3Enabled) {
      enableWeb3();
    }
    // eslint-disable-next-line
  }, [isAuthenticated]);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch("http://127.0.0.1:5000/gestion_empresa/company_contract", {
        method: "GET",
      });
      const data = await response.json();
      console.log(data);
      setContractAddress(data.data);
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
      traits: properties,
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
      to: contractAddress,
      from: window.ethereum.selectedAddress,
      data: encodedFunction,
    };
    const txt = await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [transactionParameters],
    });
    return txt;
  }
  const addFormFields = () => {
    setProperties([...properties, { trait_type: "", value: "" }]);
  };

  const handleChange = (i, e) => {
    const newProperties = [...properties];
    newProperties[i][e.target.name] = e.target.value;
    setProperties(newProperties);
  };

  const removeFormFields = (i) => {
    let newProperties = [...properties];
    const deleteProperty = newProperties.filter((_, index) => index !== i);
    setProperties(deleteProperty);
  };

  function searchByProperty(data) {
    if (search !== "") {
      return data.filter((item) =>
        item.traits.some(
          (trait) =>
            trait.trait_type
              .toString()
              .toLowerCase()
              .indexOf(search.toLowerCase()) !== -1
        )
      );
    }
    return data;
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
        {/* <div style={{ margin: "1rem 0" }}>
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
        </div> */}
        <div>
          <input type="file" name="selectedFile" onChange={onFileChange} />
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          {properties.map((property, i) => (
            <div key={i}>
              <input
                type="text"
                placeholder="Name property"
                value={property.trait_type}
                onChange={(e) => handleChange(i, e)}
                name="trait_type"
              />
              <input
                type="text"
                placeholder="Value property"
                value={property.value}
                onChange={(e) => handleChange(i, e)}
                name="value"
              />

              {i ? (
                <button type="button" onClick={() => removeFormFields(i)}>
                  Remove
                </button>
              ) : null}
            </div>
          ))}
          <button onClick={addFormFields}>Add new property</button>
          <button onClick={upload}>Upload</button>
        </div>

        <input
          type="text"
          placeholder="Search by property"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
            margin: "2rem",
          }}
        >
          {searchByProperty(NFTS).map((nft, i) => (
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
              <ul>
                {nft.traits.map((trait, index) => (
                  <li key={index}>
                    {trait.trait_type}: {trait.value}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default App;
