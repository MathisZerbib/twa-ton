/**
 * TON-Eats Escrow Contract — Tact
 *
 * Escrow flow:
 *   1. Buyer calls create_order() attaching the full payment.
 *   2. Courier calls accept_delivery() to self-assign.
 *   3. Courier calls confirm_delivery() after verifying PIN with buyer.
 *      Contract splits funds.
 */

import "@stdlib/deploy";

// ─── Messages ────────────────────────────────────────────────────────────────

message(0x01) CreateOrder {
    orderId:         Int as uint64;
    merchant:        Address;
    hasReferrer:     Bool;
    referrer:        Address;
}

message(0x04) UpdateFees {
    deliveryFee:     Int as coins;
    protocolFee:     Int as coins;
}

message(0x02) AcceptDelivery {
    orderId: Int as uint64;
}

message(0x03) ConfirmDelivery {
    orderId: Int as uint64;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

struct OrderData {
    buyer:       Address;
    merchant:    Address;
    courier:     Address?;
    referrer:    Address?;
    deliveryFee: Int as coins;
    protocolFee: Int as coins;
    foodAmount:  Int as coins;   // total locked minus fees
    status:      Int as uint8;   // 0=Open 1=Accepted 2=Delivered
}

contract TONEatsEscrow with Deployable {

    treasury: Address;
    deliveryFee: Int as coins;
    protocolFee: Int as coins;
    
    // orderId -> OrderData  (Tact map)
    orders: map<Int, OrderData>;
    lockedFunds: Int as coins;

    init(treasury: Address) {
        self.treasury = treasury;
        // Default to some values (0.2 TON and 0.1 TON)
        self.deliveryFee = ton("0.2");
        self.protocolFee = ton("0.1");
        self.orders = emptyMap();
        self.lockedFunds = 0;
    }

    // ── Create Order ─────────────────────────────────────────────────────────

    receive(msg: CreateOrder) {
        dump("--- CREATE ORDER ---");
        let ctx: Context = context();
        let buyer: Address = ctx.sender;
        let value: Int = ctx.value;
        dump(msg.orderId);
        dump(value);

        // Food amount = total sent − fees − protocol gas
        let foodAmount: Int = value - self.deliveryFee - self.protocolFee - ton("0.02");
        require(foodAmount > 0, "Insufficient payment");
        require(self.orders.get(msg.orderId) == null, "Order ID already exists");

        let referrer: Address? = null;
        if (msg.hasReferrer) {
            referrer = msg.referrer;
        }

        self.orders.set(msg.orderId, OrderData{
            buyer:       buyer,
            merchant:    msg.merchant,
            courier:     null,
            referrer:    referrer,
            deliveryFee: self.deliveryFee,
            protocolFee: self.protocolFee,
            foodAmount:  foodAmount,
            status:      0
        });

        // Add to locked funds
        self.lockedFunds = self.lockedFunds + self.deliveryFee + self.protocolFee + foodAmount;

        emit("order_created".asComment());
    }

    // ── Update Fees ──────────────────────────────────────────────────────────

    receive(msg: UpdateFees) {
        require(context().sender == self.treasury, "Only treasury can update fees");
        self.deliveryFee = msg.deliveryFee;
        self.protocolFee = msg.protocolFee;
    }

    // ── Accept Delivery ───────────────────────────────────────────────────────

    receive(msg: AcceptDelivery) {
        dump("--- ACCEPT DELIVERY ---");
        let order: OrderData? = self.orders.get(msg.orderId);
        require(order != null, "Order not found");
        let o: OrderData = order!!;
        require(o.status == 0, "Order not open");

        o.courier = context().sender;
        o.status = 1;
        self.orders.set(msg.orderId, o);

        emit("delivery_accepted".asComment());
    }

    // ── Confirm Delivery ──────────────────────────────────────────────────────

    receive(msg: ConfirmDelivery) {
        dump("--- CONFIRM DELIVERY ---");
        let order: OrderData? = self.orders.get(msg.orderId);
        require(order != null, "Order not found");
        let o: OrderData = order!!;
        require(o.status == 1, "Delivery not accepted yet");
        // FIX: Allow either Courier or Buyer to confirm, but primarily Courier.
        require(context().sender == o.courier!! || context().sender == o.buyer, "Only courier or buyer can confirm");

        // Mark delivered first
        o.status = 2;
        self.orders.set(msg.orderId, o);

        let gas: Int = ton("0.01"); // gas per send

        // 1. Food → merchant
        send(SendParameters{
            to:    o.merchant,
            value: o.foodAmount - gas,
            mode:  SendIgnoreErrors
        });

        // 2. Delivery fee → courier
        let c: Address = o.courier!!;
        send(SendParameters{
            to:    c,
            value: o.deliveryFee - gas,
            mode:  SendIgnoreErrors
        });

        // 3. Protocol fee split
        let referrer: Address? = o.referrer;
        if (referrer != null) {
            // 50% to referrer, 50% to treasury
            let half: Int = o.protocolFee / 2;
            send(SendParameters{
                to:    referrer!!,
                value: half - gas,
                mode:  SendIgnoreErrors
            });
            send(SendParameters{
                to:    self.treasury,
                value: o.protocolFee - half - gas,
                mode:  SendIgnoreErrors
            });
        } else {
            send(SendParameters{
                to:    self.treasury,
                value: o.protocolFee - gas,
                mode:  SendIgnoreErrors
            });
        }

        // Subtract from locked funds
        self.lockedFunds = self.lockedFunds - (o.deliveryFee + o.protocolFee + o.foodAmount);

        emit("delivery_confirmed".asComment());
    }

    // ── Admin Rescue ──────────────────────────────────────────────────────────
    receive("withdraw_all") {
        dump("--- WITHDRAW SAFE ---");
        require(context().sender == self.treasury, "Only treasury can withdraw");
        
        let availableAmount: Int = myBalance() - self.lockedFunds - ton("0.05"); // reserve 0.05 TON for gas
        require(availableAmount > 0, "No safe funds to withdraw");
        
        send(SendParameters{
            to: self.treasury,
            value: availableAmount,
            mode: SendIgnoreErrors,
            body: "safe rescue".asComment()
        });
    }
    // ── Getter: order status ─────────────────────────────────────────────────

    get fun get_order_status(orderId: Int): Int {
        let order: OrderData? = self.orders.get(orderId);
        if (order == null) {
            return -1; // not found
        }
        return (order!!).status;
    }

    get fun get_order(orderId: Int): OrderData? {
        return self.orders.get(orderId);
    }

    get fun get_delivery_fee(): Int {
        return self.deliveryFee;
    }

    get fun get_protocol_fee(): Int {
        return self.protocolFee;
    }

    get fun contract_balance(): Int {
        return myBalance();
    }
}
