// import { useState } from "react";
// import CBDShopDelivery from "../contracts/CBDShopDelivery";
// import { useTonClient } from "./useTonClient";
// import { useAsyncInitialize } from "./useAsyncInitialize";
// import { useTonConnect } from "./useTonConnect";
// import { Address, OpenedContract } from "ton-core";
// import { useQuery } from "@tanstack/react-query";
// import { CHAIN } from "@tonconnect/protocol";

// export function useCBDShopContract() {
//     const { client } = useTonClient();
//     const { sender, network } = useTonConnect();

//     const cbdShopContract = useAsyncInitialize(async () => {
//         if (!client) return;
//         const contract = new CBDShopDelivery(
//             Address.parse(
//                 network === CHAIN.MAINNET
//                     ? "EQBPEDbGdwaLv1DKntg9r6SjFIVplSaSJoJ-TVLe_2rqBOmH"
//                     : "EQBYLTm4nsvoqJRvs_L-IGNKwWs5RKe19HBK_lFadf19FUfb"
//             )
//         );
//         return client.open(contract) as OpenedContract<CBDShopDelivery>;
//     }, [client]);

//     const { data: deliveryStatus, isFetching } = useQuery(
//         ["deliveryStatus"],
//         async () => {
//             if (!cbdShopContract) return null;
//             const orderId = 1;
//             return (await cbdShopContract.getDeliveryStatus(orderId)).toString();
//         },
//         { refetchInterval: 3000 }
//     );

//     const initializeDelivery = async (orderId: number, amount: number) => {
//         if (!cbdShopContract || !sender) return;
//         await cbdShopContract.initializeDelivery(sender, orderId, amount);
//     };

//     const confirmDelivery = async (orderId: number) => {
//         if (!cbdShopContract || !sender) return;
//         await cbdShopContract.confirmDelivery(sender, orderId);
//     };

//     return {
//         deliveryStatus: isFetching ? null : deliveryStatus,
//         address: cbdShopContract?.address.toString(),
//         initializeDelivery,
//         confirmDelivery,
//     };
// }