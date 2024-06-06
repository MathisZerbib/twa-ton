// OrdersDrawer.tsx
import React, { useState } from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemText,
  Typography,
  IconButton,
  AppBar, // Import IconButton
} from "@mui/material";
import { OrderProps } from "./types"; // Adjust the import path as necessary
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faClock,
  faCircleXmark,
} from "@fortawesome/free-solid-svg-icons";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { useTonConnect } from "../hooks/useTonConnect";
import WalletTxList from "./WalletTxList";
interface OrdersDrawerProps {
  orders: OrderProps[];
  open: boolean;
  onClose: (open: boolean) => void;
}

const OrdersDrawer: React.FC<OrdersDrawerProps> = ({
  orders,
  open,
  onClose,
}) => {
  const { connected } = useTonConnect();
  const { wallet } = useTonConnect();

  const toggleDrawer = (open: boolean) => (event: React.KeyboardEvent) => {
    if (event.key !== "Tab" && event.key !== "Shift") {
      onClose(!open);
    }
  };

  const handleClick = (open: boolean) => (event: React.MouseEvent) => {
    onClose(!open);
  };

  const list = () => (
    <div
      role="presentation"
      onClick={handleClick(open)}
      onKeyDown={toggleDrawer(open)}
      style={{
        minWidth: "90vw",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: "10px",
          padding: "10px",
        }}
      >
        <IconButton
          edge="start"
          color="inherit"
          onClick={handleClick(open)}
          sx={{ ml: 1 }}
        >
          {" "}
          {/* Close button */}
          <FontAwesomeIcon icon={fas.faTimes} />
        </IconButton>
        <Typography variant="h6" textAlign={"center"} sx={{ flexGrow: 1 }}>
          Your Orders
        </Typography>
      </div>
      <List sx={{ pt: 0 }}>
        {orders.map((order, index) => (
          <ListItem key={index} sx={{ mb: 1 }}>
            <FontAwesomeIcon
              icon={order.status === "Completed" ? faCheckCircle : faClock}
            />
            <ListItemText primary={`Order ${index + 1}: ${order.status}`} />
          </ListItem>
        ))}
      </List>
      {/* <WalletTxList walletAddress={wallet!} /> */}
    </div>
  );

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={toggleDrawer(open)}
      sx={{ width: 300, maxWidth: "none" }}
    >
      {list()}
    </Drawer>
  );
};

export default OrdersDrawer;
