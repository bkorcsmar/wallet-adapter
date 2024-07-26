import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
    ConnectionProvider,
    useWallet,
    WalletContextState,
    WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { UnsafeBurnerWalletAdapter } from '@solana/wallet-adapter-wallets';
import {
    clusterApiUrl,
    Connection,
    PublicKey,
    Transaction,
    LAMPORTS_PER_SOL,
    TransactionInstruction,
} from '@solana/web3.js';
import React, { FC, ReactNode, useEffect, useMemo, useState } from 'react';
import { Buffer } from 'buffer';
import './styles.css';

require('./App.css');
require('@solana/wallet-adapter-react-ui/styles.css');

const App: FC = () => {
    return (
        <Context>
            <Content />
        </Context>
    );
};
export default App;

const Context: FC<{ children: ReactNode }> = ({ children }) => {
    // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
    // const network = WalletAdapterNetwork.Devnet;

    // You can also provide a custom RPC endpoint.
    // const endpoint = useMemo(() => clusterApiUrl(network), [network]); // devnet
    const endpoint = "http://localhost:8899"

    const wallets = useMemo(
        () => [
            /**
             * Wallets that implement either of these standards will be available automatically.
             *
             *   - Solana Mobile Stack Mobile Wallet Adapter Protocol
             *     (https://github.com/solana-mobile/mobile-wallet-adapter)
             *   - Solana Wallet Standard
             *     (https://github.com/solana-labs/wallet-standard)
             *
             * If you wish to support a wallet that supports neither of those standards,
             * instantiate its legacy wallet adapter here. Common legacy adapters can be found
             * in the npm package `@solana/wallet-adapter-wallets`.
             */
            new UnsafeBurnerWalletAdapter(),
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        ["http://localhost:8899"]
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>{children}</WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};

const sendTransferInstruction = async (wallet : WalletContextState, connection: Connection, targetPublicKey: string, amount: number) => {
    try {
        const publicKey = wallet.publicKey!;
        console.log("PublicKey: ", publicKey.toBase58());
        console.log("Connection", connection);
//        const programId = new PublicKey('DVbC3AGo1MXCTqVGRL9kANVdG2RsyRb9dxBWK77FY14X'); -- devnet
        const programId = new PublicKey('438sqaQZU2hho8qJ15qxyQ2Jrb92C16VG2Lxe1XReRYP'); //-- localnet

        // const publicKey1 = new PublicKey("A1VF6gKKVfFoC84QgQMw8MF1qdNfcj4z31Hui5SQrcWw");
        // const publicKey1 = new PublicKey("8uoRHMqDfpS4RYXrb2tMkW1n4k1h3dVJkLtZ6z4mp7zL"); // devnet
        // const publicKey1 = new PublicKey("GvKiT3WgKTW5qToUBXnvvvuTAs5NQbVfDdpNyWUDGkXN"); // localnet

        let transferInstruction = new TransactionInstruction({
            keys: [
                {pubkey: new PublicKey(publicKey), isSigner: true, isWritable: true},
                {pubkey: new PublicKey(targetPublicKey), isSigner: false, isWritable: true}
            ],
            programId: programId,
            data: Buffer.from([2 /* the index of the 'transfer' instruction in the instruction vector */, amount * LAMPORTS_PER_SOL]),
        });

        let transaction = new Transaction();
        transaction.add(transferInstruction);
        transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        transaction.feePayer = publicKey;

        // Sign the transaction
        if (wallet.signTransaction) {
            let signedTransaction = await wallet.signTransaction(transaction);
            // Send the transaction and get the transaction id
            let txid = await connection.sendRawTransaction(
                signedTransaction.serialize(),
                { skipPreflight: false, preflightCommitment: "confirmed" }
            );
            console.log("Transaction sent:", txid);

        }
    } catch (err) {
        console.log(err);
    }
};


const Content: FC = () => {
    const [targetPublicKey, setTargetPublicKey] = useState('');
    const [amount, setAmount] = useState('');


    const handlePublicKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setTargetPublicKey(event.target.value);
    };

    const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setAmount(event.target.value);
    };

    const wallet = useWallet();
    // const { publicKey, signTransaction } = useWallet();
    const [connection, setConnection] = useState(new Connection(clusterApiUrl(WalletAdapterNetwork.Devnet), 'confirmed'));
    const publicKey = wallet.publicKey;
    const signTransaction = wallet.signTransaction;

    useEffect(() => {
        setConnection(new Connection("http://localhost:8899", 'confirmed'));
    }, []);

    return (
        <div className="App">
            <input className="wallet-adapter-input" type="text" value={targetPublicKey} onChange={handlePublicKeyChange} placeholder="Public Key" style={{ width: '20%'}}/>
            <input className="wallet-adapter-input" type="number" value={amount} onChange={handleAmountChange} placeholder="Amount in SOL" />
            <button className="wallet-adapter-button wallet-adapter-button-trigger"
                onClick={() => {
                    if (wallet.publicKey && wallet.signTransaction) {
                        sendTransferInstruction(wallet, connection, targetPublicKey, Number.parseFloat(amount))
                    } else {
                        console.log("publicKey: ", publicKey);
                        console.log("signTransaction: ", signTransaction);
                        console.log("Connection: ", connection);
                    }

                }}
            >
                Send Instruction
            </button>
            <WalletMultiButton />
        </div>
    );
};
