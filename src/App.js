import React, { useState, useEffect, useMemo } from "react";
import { Button, CardNFT, TextField } from "./components";
import { useMoralis } from "react-moralis";
import toast, { Toaster } from "react-hot-toast";
import "./App.css";

const ownerContractAddress = "0xE4DCeA1AB8C86543209571350a5C1D470eB009b1";
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
  const [imagePreview, setimagePreview] = useState(null);
  const [properties, setProperties] = useState([{ trait_type: "", value: "" }]);
  const [search, setSearch] = useState("");
  const [contractAddress, setContractAddress] = useState("");

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
  }, []);

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
    if (e.target.files.length !== 0) {
      const data = e.target.files[0];
      const dataFormat = new File(
        [data],
        `${data.name.replace(/(?:\.(?![^.]+$)|[^\w.])+/g, "-")}`,
        { type: data.type }
      );
      setFile(dataFormat);
      setimagePreview(window?.URL?.createObjectURL(dataFormat));
    }
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

    toast.promise(
      mintToken(metadataURI),
      {
        loading: "Subiendo NFT...",
        success: `Has subido con éxito tú NFT`,
        error: "Error en intentar subir el NFT",
      },

      {
        style: {
          overflow: "auto",
          background: "#4545e6",
          color: "#fff",
        },
        success: {
          icon: "🔥",
        },
      }
    );
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
      to: "0x0Fb6EF3505b9c52Ed39595433a21aF9B5FCc4431",
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
        <Toaster />
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
            <CardNFT nft={nft} key={nft.id} />
          ))}
        </div>
      </div>
    </>
  );
}

export default App;
