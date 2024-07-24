import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, useWallet, Wallet, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { UnsafeBurnerWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl, Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import React, { FC, ReactNode, useEffect, useMemo, useState } from 'react';
import { Buffer } from 'buffer';

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

const sendInstruction = async (publicKey: PublicKey, signTransaction: (transaction: Transaction) => Promise<Transaction>, connection: Connection) => {
    try {
        console.log("PublicKey: ", publicKey.toBase58());
        console.log("signTransaction: ", signTransaction.toString());
        console.log("Connection", connection);
//        const programId = new PublicKey('DVbC3AGo1MXCTqVGRL9kANVdG2RsyRb9dxBWK77FY14X'); -- devnet
        const programId = new PublicKey('438sqaQZU2hho8qJ15qxyQ2Jrb92C16VG2Lxe1XReRYP'); //-- localnet

        // const publicKey1 = new PublicKey("A1VF6gKKVfFoC84QgQMw8MF1qdNfcj4z31Hui5SQrcWw");
        // const publicKey1 = new PublicKey("8uoRHMqDfpS4RYXrb2tMkW1n4k1h3dVJkLtZ6z4mp7zL"); // devnet
        const publicKey1 = new PublicKey("GvKiT3WgKTW5qToUBXnvvvuTAs5NQbVfDdpNyWUDGkXN"); // localnet
        const keys = [
            { pubkey: publicKey1, isSigner: true, isWritable: true },
        ];
        const uint8Array = new Uint8Array([0, 0, 0, 0, 0]);
        const instrData = Buffer.from(uint8Array);
        const instruction = new TransactionInstruction({ keys, programId, data: instrData });

        const transaction = new Transaction().add(instruction);
        transaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
        if (transaction) {
            transaction.feePayer = publicKey!;
            const signed = await signTransaction(transaction);
            const txid = await connection.sendRawTransaction(signed.serialize());
            console.log("Transaction sent and confirmed:", txid);
        }
    } catch (err) {
        console.log(err);
    }
};


const Content: FC = () => {
    const { publicKey, signTransaction } = useWallet();
    const [connection, setConnection] = useState(new Connection(clusterApiUrl(WalletAdapterNetwork.Devnet), 'confirmed'));

    useEffect(() => {
        setConnection(new Connection("http://localhost:8899", 'confirmed'));
    }, []);

    return (
        <div className="App">
            <button
                onClick={() => {
                    if (publicKey && signTransaction) {
                        sendInstruction(publicKey, signTransaction, connection)
                    }  else {
                        console.log("publicKey: ", publicKey);
                        console.log("signTransaction: ", signTransaction);
                        console.log("Connection: ", connection);
                    }
                }}
                // disabled={!publicKey || !signTransaction}
            >
                Send Instruction
            </button>
            <WalletMultiButton />
        </div>
    );
};
