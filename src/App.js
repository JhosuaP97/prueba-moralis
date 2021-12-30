import React, { useState, useEffect, useMemo } from "react";
import { Button, CardNFT, TextField } from "./components";
import { useMoralis } from "react-moralis";
import "./App.css";

const ownerContractAddress = "0x6Bdde8b895cFa888cE235Da49068f2c94E81FEd4";
const urlOpenSea = `https://testnets-api.opensea.io/assets?owner=${ownerContractAddress}&order_direction=desc&offset=0&limit=10`;
const nft_contract_address = "0xD55802295128af74ea42eddCFAA4d4DdCf24abcE"; //NFT Minting Contract Use This One "Batteries Included", code of this contract is in the github repository under contract_base for your reference.

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
  const [imagePreview, setimagePreview] = useState(null);
  const [properties, setProperties] = useState([{ trait_type: "", value: "" }]);
  const [search, setSearch] = useState("");
  const [nftContractAddress, setnftContractAddress] = useState("");

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
    setimagePreview(URL.createObjectURL(data));
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
        <div className="login">
          <p>
            Usuario :<span>{web3Account}</span>
          </p>
          <Button onClick={() => logout()}>Cerrar sesión</Button>
        </div>
      ) : (
        <Button onClick={() => authenticate()}>Conectarse a Metamask</Button>
      )}
      <div className="container">
        <section>
          <h3>Escribe el nombre del NFT</h3>
          <div>
            <TextField
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              type="file"
              name="selectedFile"
              onChange={onFileChange}
            />
          </div>

          {imagePreview && (
            <img src={imagePreview} alt="" className="image-preview" />
          )}
        </section>
        <section className="properties">
          <h3>Propiedades</h3>
          {properties.map((property, i) => (
            <div key={i} className="property-column">
              <TextField
                type="text"
                placeholder="nombre de la propiedad"
                value={property.trait_type}
                onChange={(e) => handleChange(i, e)}
                name="trait_type"
              />
              <TextField
                type="text"
                placeholder="valor de la propiedad"
                value={property.value}
                onChange={(e) => handleChange(i, e)}
                name="value"
              />

              {i ? (
                <Button type="Button" onClick={() => removeFormFields(i)}>
                  Eliminar propiedad
                </Button>
              ) : null}
            </div>
          ))}
        </section>

        <section className="property-btn">
          <Button type="Button" onClick={addFormFields}>
            Añadir nueva propiedad
          </Button>
          <Button type="Button" onClick={upload}>
            Subir NFT
          </Button>
        </section>

        <section className="search">
          <h2>Buscar</h2>
          <TextField
            type="text"
            placeholder="Buscar por propiedad"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </section>

        <div className="grid">
          {searchByProperty(NFTS).map((nft, i) => (
            <CardNFT nft={nft} />
          ))}
        </div>
      </div>
    </>
  );
}

export default App;
