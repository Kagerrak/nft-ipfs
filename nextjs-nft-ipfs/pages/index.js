import Head from "next/head";
import styles from "../styles/Home.module.css";
import { Contract, providers, utils } from "ethers";
import React, { useEffect, useRef, useState } from "react";
import { abi, NFT_CONTRACT_ADDRESS } from "../constants";
import Web3Modal from "web3modal";

export default function Home() {
  // walletConnected keep track of whether the user's wallet is connected or not
  const [walletConnected, setWalletConnected] = useState(false);
  // loading is set to true when we are waiting for a transaction to get mined
  const [loading, setLoading] = useState(false);
  // tokensMinted keep track of the number of tokenIds that have been minted
  const [tokenIdsMinted, setTokenIdsMinted] = useState("0");
  // Create a refernece to the Web3 Modal (used for connecting to Metamask) which persist as long as the page is open
  const web3ModalRef = useRef();

  /**
   * publicMint: mint an NFT
   */

  const publicMint = async () => {
    try {
      console.log("Public mint");
      // we need a signer here since this is a "write" transaction
      const signer = await getProviderOrSigner(true);
      // Create a new instance of the contract with a signer, which allows
      // update methods
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
      // call the mint function from the contract to mint LW3Punks
      const tx = await nftContract.mint({
        // value signifies the cost of one LW3Punks which is "0.01" eth.
        // We are parsing `0.01` string to ether using th utils library form ethers.js
        value: utils.parseEther("0.01"),
      });
      setLoading(true);
      // wait for the transaction to get mined
      await tx.wait(1);
      setLoading(false);
      window.alert("You have succesfully minted a LW3Punk!");
    } catch (error) {
      console.error(error);
    }
  };

  /*
  connecWallet: Connects the metamask wallet
  */
  const connectWallet = async () => {
    try {
      // Get the provider from web3Modal, which in our case is Metamask
      // When used for the first time, it prompts the user to connect their wallet
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (error) {
      console.error(error);
    }
  };

  /**
   * getTokenIdsMinted: gets he number of tokenIds that have been minted
   */
  const getTokenIdsMinted = async () => {
    try {
      // get the provider from web3Moda, which in our case is MetaMask
      // No need for the Signer here, as we are only reading the state from the blockchain
      const provider = await getProviderOrSigner();
      // We connec to the contract using provider , so we will only
      // have read-only access to the Contract
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      // call the tokenIds fromthe contract
      const _tokenIds = await nftContract.tokenIds();
      console.log("tokensIds", _tokenIds);
      //  _tokenIds is a BigNumber. We need to convert BigNUmber to a string
      setTokenIdsMinted(_tokenIds.toString());
    } catch (error) {
      console.error(error);
    }
  };

  /**
   * Returns a Provider or Signer object representing the Ethereum RPC with or without the
   * signing capabilities of metamask attached
   *
   * A `Provider` is needed to interact with the blockchain - reading transactions, reading balances, reading state, etc.
   *
   * A `Signer` is a special type of Provider used in case a `write` transaction needs to be made to the blockchain, which involves the connected account
   * needing to make a digital signature to authorize the transaction being sent. Metamask exposes a Signer API to allow your website to
   * request signatures from the user using Signer functions.
   *
   * @param {*} needSigner - True if you need the signer, default false otherwise
   */
  const getProviderOrSigner = async (needSigner = false) => {
    // Connect to Metamask
    // since we store web3Modal as a refernece, we need to access the current value to get access to the underlying object
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // If user is not connected to the Mumbai network, let them know and throw an error
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 80001) {
      window.alert("Change the network to Mumbai");
      throw new Error("Change the network to Mumbai");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  // useEffects are used to react to changes in state of the website
  // The array at the end of function call represents what state changes will trigger this effect
  // In this case, whenever the value of `walletConnected` changes - this effect will be called
  useEffect(() => {
    if (!walletConnected) {
      // Assign the Web3Modal class to the reference object by setting it's `current` value
      // The `current` value is persisted throughout as long as this page is open
      web3ModalRef.current = new Web3Modal({
        network: "mumbai",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();

      getTokenIdsMinted();

      // set interval to get the number of token Ids minted every 5 seconds
      setInterval(async () => {
        await getTokenIdsMinted();
      }, 5 * 1000);
    }
  }, [walletConnected]);

  const renderButton = () => {
    // if wallet is not connected, r etrun a button which allows them to connect their wallet
    if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect your wallet
        </button>
      );
    }

    if (loading) {
      return <button className={styles.button}>Loading...</button>;
    }

    return (
      <button className={styles.button} onClick={publicMint}>
        Public Mint 🚀
      </button>
    );
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="LW3Punks-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to LW3Punks!</h1>
          <div className={styles.description}>
            Its an NFT collection for LearnWeb3 students.
          </div>
          <div className={styles.description}>
            {tokenIdsMinted}/10 have been minted
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="/LW3Punks/1.png" />
        </div>
      </div>

      <footer className={styles.footer}>Made with &#10084; by LW3Punks</footer>
    </div>
  );
}
