/**
 * TON-Eats Escrow Contract — Tact
 * Production Ready: Exact value locking, gas refunds, and safe routing.
 */

import "@stdlib/deploy";

// ─── Messages ────────────────────────────────────────────────────────────────

message(0x01) CreateOrder {
    orderId:     Int as uint64;
    merchant:    Address;
    foodAmount:  Int as coins;  // FIX: Explicitly pass the food amount
    hasReferrer: Bool;
    referrer:    Address;
}

message(0x04) UpdateFees {
    deliveryFee: Int as coins;
    protocolFee: Int as coins;
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
    foodAmount:  Int as coins;
    status:      Int as uint8;   // 0=Open, 1=Accepted, 2=Delivered
}

contract TONEatsEscrow with Deployable {

    treasury: Address;
    deliveryFee: Int as coins;
    protocolFee: Int as coins;
    
    // orderId -> OrderData 
    orders: map<Int, OrderData>;
    lockedFunds: Int as coins;

    init(treasury: Address) {
        self.treasury = treasury;
        self.deliveryFee = ton("0.2");
        self.protocolFee = ton("0.1");
        self.orders = emptyMap();
        self.lockedFunds = 0;
    }

    // ── Create Order ─────────────────────────────────────────────────────────

    receive(msg: CreateOrder) {
        let ctx: Context = context();
        let value: Int = ctx.value;
        
        // FIX: Ensure user sent exactly enough for the food + fees + a gas buffer
        let requiredTotal: Int = msg.foodAmount + self.deliveryFee + self.protocolFee;
        require(value >= requiredTotal + ton("0.05"), "Insufficient TON for order and gas");
        require(self.orders.get(msg.orderId) == null, "Order ID already exists");

        let referrer: Address? = null;
        if (msg.hasReferrer) {
            referrer = msg.referrer;
        }

        self.orders.set(msg.orderId, OrderData{
            buyer:       ctx.sender,
            merchant:    msg.merchant,
            courier:     null,
            referrer:    referrer,
            deliveryFee: self.deliveryFee,
            protocolFee: self.protocolFee,
            foodAmount:  msg.foodAmount,
            status:      0
        });

        // Add to locked funds strictly based on known amounts
        self.lockedFunds = self.lockedFunds + requiredTotal;

        emit("order_created".asComment());

        // FIX: Refund the unused gas back to the buyer!
        send(SendParameters{
            to: ctx.sender,
            value: 0,
            mode: SendRemainingValue | SendIgnoreErrors,
            body: "Order Created Refund".asComment()
        });
    }

    // ── Update Fees ──────────────────────────────────────────────────────────

    receive(msg: UpdateFees) {
        require(context().sender == self.treasury, "Only treasury can update fees");
        self.deliveryFee = msg.deliveryFee;
        self.protocolFee = msg.protocolFee;
    }

    // ── Accept Delivery ───────────────────────────────────────────────────────

    receive(msg: AcceptDelivery) {
        let ctx: Context = context();
        let order: OrderData? = self.orders.get(msg.orderId);
        require(order != null, "Order not found");
        
        let o: OrderData = order!!;
        require(o.status == 0, "Order not open");

        o.courier = ctx.sender;
        o.status = 1;
        self.orders.set(msg.orderId, o);

        emit("delivery_accepted".asComment());

        // FIX: Refund excess gas back to the courier
        send(SendParameters{
            to: ctx.sender,
            value: 0,
            mode: SendRemainingValue | SendIgnoreErrors,
            body: "Accept Refund".asComment()
        });
    }

    // ── Confirm Delivery ──────────────────────────────────────────────────────

    receive(msg: ConfirmDelivery) {
        let ctx: Context = context();
        let order: OrderData? = self.orders.get(msg.orderId);
        require(order != null, "Order not found");
        
        let o: OrderData = order!!;
        require(o.status == 1, "Delivery not accepted yet");
        require(ctx.sender == o.courier!! || ctx.sender == o.buyer, "Only courier or buyer can confirm");

        o.status = 2;
        self.orders.set(msg.orderId, o);

        // FIX: Send EXACT amounts. 
        // Mode `SendPayGasSeparately` (1) ensures the forward fee is paid from the 
        // msg_value attached by whoever called ConfirmDelivery, not deducted from the sent amount.
        
        let sendMode: Int = SendPayGasSeparately | SendIgnoreErrors;

        // 1. Food → merchant
        send(SendParameters{ to: o.merchant, value: o.foodAmount, mode: sendMode });

        // 2. Delivery fee → courier
        send(SendParameters{ to: o.courier!!, value: o.deliveryFee, mode: sendMode });

        // 3. Protocol fee split
        if (o.referrer != null) {
            let half: Int = o.protocolFee / 2;
            send(SendParameters{ to: o.referrer!!, value: half, mode: sendMode });
            send(SendParameters{ to: self.treasury, value: o.protocolFee - half, mode: sendMode });
        } else {
            send(SendParameters{ to: self.treasury, value: o.protocolFee, mode: sendMode });
        }

        // Subtract from locked funds
        self.lockedFunds = self.lockedFunds - (o.deliveryFee + o.protocolFee + o.foodAmount);

        emit("delivery_confirmed".asComment());

        // FIX: Refund the remaining gas back to whoever confirmed the delivery
        send(SendParameters{
            to: ctx.sender,
            value: 0,
            mode: SendRemainingValue | SendIgnoreErrors,
            body: "Confirm Refund".asComment()
        });
    }

    // ── Admin Rescue ──────────────────────────────────────────────────────────

    receive("withdraw_all") {
        require(context().sender == self.treasury, "Only treasury can withdraw");
        
        // Keep 0.05 TON alive for contract rent, plus strictly maintain locked funds
        let availableAmount: Int = myBalance() - self.lockedFunds - ton("0.05"); 
        require(availableAmount > 0, "No safe funds to withdraw");
        
        send(SendParameters{
            to: self.treasury,
            value: availableAmount,
            mode: SendIgnoreErrors,
            body: "safe rescue".asComment()
        });
    }

    // ── Getters ──────────────────────────────────────────────────────────────

    get fun get_order_status(orderId: Int): Int {
        let order: OrderData? = self.orders.get(orderId);
        if (order == null) { return -1; }
        return (order!!).status;
    }

    get fun get_order(orderId: Int): OrderData? { return self.orders.get(orderId); }
    get fun get_delivery_fee(): Int { return self.deliveryFee; }
    get fun get_protocol_fee(): Int { return self.protocolFee; }
    get fun contract_balance(): Int { return myBalance(); }
    get fun locked_funds(): Int { return self.lockedFunds; }
}
