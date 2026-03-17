import {
    Cell,
    Slice,
    Address,
    Builder,
    beginCell,
    ComputeError,
    TupleItem,
    TupleReader,
    Dictionary,
    contractAddress,
    address,
    ContractProvider,
    Sender,
    Contract,
    ContractABI,
    ABIType,
    ABIGetter,
    ABIReceiver,
    TupleBuilder,
    DictionaryValue
} from '@ton/core';

export type DataSize = {
    $$type: 'DataSize';
    cells: bigint;
    bits: bigint;
    refs: bigint;
}

export function storeDataSize(src: DataSize) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.cells, 257);
        b_0.storeInt(src.bits, 257);
        b_0.storeInt(src.refs, 257);
    };
}

export function loadDataSize(slice: Slice) {
    const sc_0 = slice;
    const _cells = sc_0.loadIntBig(257);
    const _bits = sc_0.loadIntBig(257);
    const _refs = sc_0.loadIntBig(257);
    return { $$type: 'DataSize' as const, cells: _cells, bits: _bits, refs: _refs };
}

export function loadTupleDataSize(source: TupleReader) {
    const _cells = source.readBigNumber();
    const _bits = source.readBigNumber();
    const _refs = source.readBigNumber();
    return { $$type: 'DataSize' as const, cells: _cells, bits: _bits, refs: _refs };
}

export function loadGetterTupleDataSize(source: TupleReader) {
    const _cells = source.readBigNumber();
    const _bits = source.readBigNumber();
    const _refs = source.readBigNumber();
    return { $$type: 'DataSize' as const, cells: _cells, bits: _bits, refs: _refs };
}

export function storeTupleDataSize(source: DataSize) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.cells);
    builder.writeNumber(source.bits);
    builder.writeNumber(source.refs);
    return builder.build();
}

export function dictValueParserDataSize(): DictionaryValue<DataSize> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDataSize(src)).endCell());
        },
        parse: (src) => {
            return loadDataSize(src.loadRef().beginParse());
        }
    }
}

export type SignedBundle = {
    $$type: 'SignedBundle';
    signature: Buffer;
    signedData: Slice;
}

export function storeSignedBundle(src: SignedBundle) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeBuffer(src.signature);
        b_0.storeBuilder(src.signedData.asBuilder());
    };
}

export function loadSignedBundle(slice: Slice) {
    const sc_0 = slice;
    const _signature = sc_0.loadBuffer(64);
    const _signedData = sc_0;
    return { $$type: 'SignedBundle' as const, signature: _signature, signedData: _signedData };
}

export function loadTupleSignedBundle(source: TupleReader) {
    const _signature = source.readBuffer();
    const _signedData = source.readCell().asSlice();
    return { $$type: 'SignedBundle' as const, signature: _signature, signedData: _signedData };
}

export function loadGetterTupleSignedBundle(source: TupleReader) {
    const _signature = source.readBuffer();
    const _signedData = source.readCell().asSlice();
    return { $$type: 'SignedBundle' as const, signature: _signature, signedData: _signedData };
}

export function storeTupleSignedBundle(source: SignedBundle) {
    const builder = new TupleBuilder();
    builder.writeBuffer(source.signature);
    builder.writeSlice(source.signedData.asCell());
    return builder.build();
}

export function dictValueParserSignedBundle(): DictionaryValue<SignedBundle> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSignedBundle(src)).endCell());
        },
        parse: (src) => {
            return loadSignedBundle(src.loadRef().beginParse());
        }
    }
}

export type StateInit = {
    $$type: 'StateInit';
    code: Cell;
    data: Cell;
}

export function storeStateInit(src: StateInit) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeRef(src.code);
        b_0.storeRef(src.data);
    };
}

export function loadStateInit(slice: Slice) {
    const sc_0 = slice;
    const _code = sc_0.loadRef();
    const _data = sc_0.loadRef();
    return { $$type: 'StateInit' as const, code: _code, data: _data };
}

export function loadTupleStateInit(source: TupleReader) {
    const _code = source.readCell();
    const _data = source.readCell();
    return { $$type: 'StateInit' as const, code: _code, data: _data };
}

export function loadGetterTupleStateInit(source: TupleReader) {
    const _code = source.readCell();
    const _data = source.readCell();
    return { $$type: 'StateInit' as const, code: _code, data: _data };
}

export function storeTupleStateInit(source: StateInit) {
    const builder = new TupleBuilder();
    builder.writeCell(source.code);
    builder.writeCell(source.data);
    return builder.build();
}

export function dictValueParserStateInit(): DictionaryValue<StateInit> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeStateInit(src)).endCell());
        },
        parse: (src) => {
            return loadStateInit(src.loadRef().beginParse());
        }
    }
}

export type Context = {
    $$type: 'Context';
    bounceable: boolean;
    sender: Address;
    value: bigint;
    raw: Slice;
}

export function storeContext(src: Context) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeBit(src.bounceable);
        b_0.storeAddress(src.sender);
        b_0.storeInt(src.value, 257);
        b_0.storeRef(src.raw.asCell());
    };
}

export function loadContext(slice: Slice) {
    const sc_0 = slice;
    const _bounceable = sc_0.loadBit();
    const _sender = sc_0.loadAddress();
    const _value = sc_0.loadIntBig(257);
    const _raw = sc_0.loadRef().asSlice();
    return { $$type: 'Context' as const, bounceable: _bounceable, sender: _sender, value: _value, raw: _raw };
}

export function loadTupleContext(source: TupleReader) {
    const _bounceable = source.readBoolean();
    const _sender = source.readAddress();
    const _value = source.readBigNumber();
    const _raw = source.readCell().asSlice();
    return { $$type: 'Context' as const, bounceable: _bounceable, sender: _sender, value: _value, raw: _raw };
}

export function loadGetterTupleContext(source: TupleReader) {
    const _bounceable = source.readBoolean();
    const _sender = source.readAddress();
    const _value = source.readBigNumber();
    const _raw = source.readCell().asSlice();
    return { $$type: 'Context' as const, bounceable: _bounceable, sender: _sender, value: _value, raw: _raw };
}

export function storeTupleContext(source: Context) {
    const builder = new TupleBuilder();
    builder.writeBoolean(source.bounceable);
    builder.writeAddress(source.sender);
    builder.writeNumber(source.value);
    builder.writeSlice(source.raw.asCell());
    return builder.build();
}

export function dictValueParserContext(): DictionaryValue<Context> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeContext(src)).endCell());
        },
        parse: (src) => {
            return loadContext(src.loadRef().beginParse());
        }
    }
}

export type SendParameters = {
    $$type: 'SendParameters';
    mode: bigint;
    body: Cell | null;
    code: Cell | null;
    data: Cell | null;
    value: bigint;
    to: Address;
    bounce: boolean;
}

export function storeSendParameters(src: SendParameters) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.mode, 257);
        if (src.body !== null && src.body !== undefined) { b_0.storeBit(true).storeRef(src.body); } else { b_0.storeBit(false); }
        if (src.code !== null && src.code !== undefined) { b_0.storeBit(true).storeRef(src.code); } else { b_0.storeBit(false); }
        if (src.data !== null && src.data !== undefined) { b_0.storeBit(true).storeRef(src.data); } else { b_0.storeBit(false); }
        b_0.storeInt(src.value, 257);
        b_0.storeAddress(src.to);
        b_0.storeBit(src.bounce);
    };
}

export function loadSendParameters(slice: Slice) {
    const sc_0 = slice;
    const _mode = sc_0.loadIntBig(257);
    const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _code = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _data = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _value = sc_0.loadIntBig(257);
    const _to = sc_0.loadAddress();
    const _bounce = sc_0.loadBit();
    return { $$type: 'SendParameters' as const, mode: _mode, body: _body, code: _code, data: _data, value: _value, to: _to, bounce: _bounce };
}

export function loadTupleSendParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _code = source.readCellOpt();
    const _data = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'SendParameters' as const, mode: _mode, body: _body, code: _code, data: _data, value: _value, to: _to, bounce: _bounce };
}

export function loadGetterTupleSendParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _code = source.readCellOpt();
    const _data = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'SendParameters' as const, mode: _mode, body: _body, code: _code, data: _data, value: _value, to: _to, bounce: _bounce };
}

export function storeTupleSendParameters(source: SendParameters) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.mode);
    builder.writeCell(source.body);
    builder.writeCell(source.code);
    builder.writeCell(source.data);
    builder.writeNumber(source.value);
    builder.writeAddress(source.to);
    builder.writeBoolean(source.bounce);
    return builder.build();
}

export function dictValueParserSendParameters(): DictionaryValue<SendParameters> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSendParameters(src)).endCell());
        },
        parse: (src) => {
            return loadSendParameters(src.loadRef().beginParse());
        }
    }
}

export type MessageParameters = {
    $$type: 'MessageParameters';
    mode: bigint;
    body: Cell | null;
    value: bigint;
    to: Address;
    bounce: boolean;
}

export function storeMessageParameters(src: MessageParameters) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.mode, 257);
        if (src.body !== null && src.body !== undefined) { b_0.storeBit(true).storeRef(src.body); } else { b_0.storeBit(false); }
        b_0.storeInt(src.value, 257);
        b_0.storeAddress(src.to);
        b_0.storeBit(src.bounce);
    };
}

export function loadMessageParameters(slice: Slice) {
    const sc_0 = slice;
    const _mode = sc_0.loadIntBig(257);
    const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _value = sc_0.loadIntBig(257);
    const _to = sc_0.loadAddress();
    const _bounce = sc_0.loadBit();
    return { $$type: 'MessageParameters' as const, mode: _mode, body: _body, value: _value, to: _to, bounce: _bounce };
}

export function loadTupleMessageParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'MessageParameters' as const, mode: _mode, body: _body, value: _value, to: _to, bounce: _bounce };
}

export function loadGetterTupleMessageParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'MessageParameters' as const, mode: _mode, body: _body, value: _value, to: _to, bounce: _bounce };
}

export function storeTupleMessageParameters(source: MessageParameters) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.mode);
    builder.writeCell(source.body);
    builder.writeNumber(source.value);
    builder.writeAddress(source.to);
    builder.writeBoolean(source.bounce);
    return builder.build();
}

export function dictValueParserMessageParameters(): DictionaryValue<MessageParameters> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeMessageParameters(src)).endCell());
        },
        parse: (src) => {
            return loadMessageParameters(src.loadRef().beginParse());
        }
    }
}

export type DeployParameters = {
    $$type: 'DeployParameters';
    mode: bigint;
    body: Cell | null;
    value: bigint;
    bounce: boolean;
    init: StateInit;
}

export function storeDeployParameters(src: DeployParameters) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.mode, 257);
        if (src.body !== null && src.body !== undefined) { b_0.storeBit(true).storeRef(src.body); } else { b_0.storeBit(false); }
        b_0.storeInt(src.value, 257);
        b_0.storeBit(src.bounce);
        b_0.store(storeStateInit(src.init));
    };
}

export function loadDeployParameters(slice: Slice) {
    const sc_0 = slice;
    const _mode = sc_0.loadIntBig(257);
    const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _value = sc_0.loadIntBig(257);
    const _bounce = sc_0.loadBit();
    const _init = loadStateInit(sc_0);
    return { $$type: 'DeployParameters' as const, mode: _mode, body: _body, value: _value, bounce: _bounce, init: _init };
}

export function loadTupleDeployParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _bounce = source.readBoolean();
    const _init = loadTupleStateInit(source);
    return { $$type: 'DeployParameters' as const, mode: _mode, body: _body, value: _value, bounce: _bounce, init: _init };
}

export function loadGetterTupleDeployParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _bounce = source.readBoolean();
    const _init = loadGetterTupleStateInit(source);
    return { $$type: 'DeployParameters' as const, mode: _mode, body: _body, value: _value, bounce: _bounce, init: _init };
}

export function storeTupleDeployParameters(source: DeployParameters) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.mode);
    builder.writeCell(source.body);
    builder.writeNumber(source.value);
    builder.writeBoolean(source.bounce);
    builder.writeTuple(storeTupleStateInit(source.init));
    return builder.build();
}

export function dictValueParserDeployParameters(): DictionaryValue<DeployParameters> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDeployParameters(src)).endCell());
        },
        parse: (src) => {
            return loadDeployParameters(src.loadRef().beginParse());
        }
    }
}

export type StdAddress = {
    $$type: 'StdAddress';
    workchain: bigint;
    address: bigint;
}

export function storeStdAddress(src: StdAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.workchain, 8);
        b_0.storeUint(src.address, 256);
    };
}

export function loadStdAddress(slice: Slice) {
    const sc_0 = slice;
    const _workchain = sc_0.loadIntBig(8);
    const _address = sc_0.loadUintBig(256);
    return { $$type: 'StdAddress' as const, workchain: _workchain, address: _address };
}

export function loadTupleStdAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readBigNumber();
    return { $$type: 'StdAddress' as const, workchain: _workchain, address: _address };
}

export function loadGetterTupleStdAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readBigNumber();
    return { $$type: 'StdAddress' as const, workchain: _workchain, address: _address };
}

export function storeTupleStdAddress(source: StdAddress) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.workchain);
    builder.writeNumber(source.address);
    return builder.build();
}

export function dictValueParserStdAddress(): DictionaryValue<StdAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeStdAddress(src)).endCell());
        },
        parse: (src) => {
            return loadStdAddress(src.loadRef().beginParse());
        }
    }
}

export type VarAddress = {
    $$type: 'VarAddress';
    workchain: bigint;
    address: Slice;
}

export function storeVarAddress(src: VarAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.workchain, 32);
        b_0.storeRef(src.address.asCell());
    };
}

export function loadVarAddress(slice: Slice) {
    const sc_0 = slice;
    const _workchain = sc_0.loadIntBig(32);
    const _address = sc_0.loadRef().asSlice();
    return { $$type: 'VarAddress' as const, workchain: _workchain, address: _address };
}

export function loadTupleVarAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readCell().asSlice();
    return { $$type: 'VarAddress' as const, workchain: _workchain, address: _address };
}

export function loadGetterTupleVarAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readCell().asSlice();
    return { $$type: 'VarAddress' as const, workchain: _workchain, address: _address };
}

export function storeTupleVarAddress(source: VarAddress) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.workchain);
    builder.writeSlice(source.address.asCell());
    return builder.build();
}

export function dictValueParserVarAddress(): DictionaryValue<VarAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeVarAddress(src)).endCell());
        },
        parse: (src) => {
            return loadVarAddress(src.loadRef().beginParse());
        }
    }
}

export type BasechainAddress = {
    $$type: 'BasechainAddress';
    hash: bigint | null;
}

export function storeBasechainAddress(src: BasechainAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        if (src.hash !== null && src.hash !== undefined) { b_0.storeBit(true).storeInt(src.hash, 257); } else { b_0.storeBit(false); }
    };
}

export function loadBasechainAddress(slice: Slice) {
    const sc_0 = slice;
    const _hash = sc_0.loadBit() ? sc_0.loadIntBig(257) : null;
    return { $$type: 'BasechainAddress' as const, hash: _hash };
}

export function loadTupleBasechainAddress(source: TupleReader) {
    const _hash = source.readBigNumberOpt();
    return { $$type: 'BasechainAddress' as const, hash: _hash };
}

export function loadGetterTupleBasechainAddress(source: TupleReader) {
    const _hash = source.readBigNumberOpt();
    return { $$type: 'BasechainAddress' as const, hash: _hash };
}

export function storeTupleBasechainAddress(source: BasechainAddress) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.hash);
    return builder.build();
}

export function dictValueParserBasechainAddress(): DictionaryValue<BasechainAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeBasechainAddress(src)).endCell());
        },
        parse: (src) => {
            return loadBasechainAddress(src.loadRef().beginParse());
        }
    }
}

export type Deploy = {
    $$type: 'Deploy';
    queryId: bigint;
}

export function storeDeploy(src: Deploy) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(2490013878, 32);
        b_0.storeUint(src.queryId, 64);
    };
}

export function loadDeploy(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2490013878) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    return { $$type: 'Deploy' as const, queryId: _queryId };
}

export function loadTupleDeploy(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'Deploy' as const, queryId: _queryId };
}

export function loadGetterTupleDeploy(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'Deploy' as const, queryId: _queryId };
}

export function storeTupleDeploy(source: Deploy) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    return builder.build();
}

export function dictValueParserDeploy(): DictionaryValue<Deploy> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDeploy(src)).endCell());
        },
        parse: (src) => {
            return loadDeploy(src.loadRef().beginParse());
        }
    }
}

export type DeployOk = {
    $$type: 'DeployOk';
    queryId: bigint;
}

export function storeDeployOk(src: DeployOk) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(2952335191, 32);
        b_0.storeUint(src.queryId, 64);
    };
}

export function loadDeployOk(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2952335191) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    return { $$type: 'DeployOk' as const, queryId: _queryId };
}

export function loadTupleDeployOk(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'DeployOk' as const, queryId: _queryId };
}

export function loadGetterTupleDeployOk(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'DeployOk' as const, queryId: _queryId };
}

export function storeTupleDeployOk(source: DeployOk) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    return builder.build();
}

export function dictValueParserDeployOk(): DictionaryValue<DeployOk> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDeployOk(src)).endCell());
        },
        parse: (src) => {
            return loadDeployOk(src.loadRef().beginParse());
        }
    }
}

export type FactoryDeploy = {
    $$type: 'FactoryDeploy';
    queryId: bigint;
    cashback: Address;
}

export function storeFactoryDeploy(src: FactoryDeploy) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1829761339, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeAddress(src.cashback);
    };
}

export function loadFactoryDeploy(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1829761339) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _cashback = sc_0.loadAddress();
    return { $$type: 'FactoryDeploy' as const, queryId: _queryId, cashback: _cashback };
}

export function loadTupleFactoryDeploy(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _cashback = source.readAddress();
    return { $$type: 'FactoryDeploy' as const, queryId: _queryId, cashback: _cashback };
}

export function loadGetterTupleFactoryDeploy(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _cashback = source.readAddress();
    return { $$type: 'FactoryDeploy' as const, queryId: _queryId, cashback: _cashback };
}

export function storeTupleFactoryDeploy(source: FactoryDeploy) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeAddress(source.cashback);
    return builder.build();
}

export function dictValueParserFactoryDeploy(): DictionaryValue<FactoryDeploy> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeFactoryDeploy(src)).endCell());
        },
        parse: (src) => {
            return loadFactoryDeploy(src.loadRef().beginParse());
        }
    }
}

export type CreateOrder = {
    $$type: 'CreateOrder';
    orderId: bigint;
    merchant: Address;
    foodAmount: bigint;
    hasReferrer: boolean;
    referrer: Address;
}

export function storeCreateOrder(src: CreateOrder) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1, 32);
        b_0.storeUint(src.orderId, 64);
        b_0.storeAddress(src.merchant);
        b_0.storeCoins(src.foodAmount);
        b_0.storeBit(src.hasReferrer);
        b_0.storeAddress(src.referrer);
    };
}

export function loadCreateOrder(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1) { throw Error('Invalid prefix'); }
    const _orderId = sc_0.loadUintBig(64);
    const _merchant = sc_0.loadAddress();
    const _foodAmount = sc_0.loadCoins();
    const _hasReferrer = sc_0.loadBit();
    const _referrer = sc_0.loadAddress();
    return { $$type: 'CreateOrder' as const, orderId: _orderId, merchant: _merchant, foodAmount: _foodAmount, hasReferrer: _hasReferrer, referrer: _referrer };
}

export function loadTupleCreateOrder(source: TupleReader) {
    const _orderId = source.readBigNumber();
    const _merchant = source.readAddress();
    const _foodAmount = source.readBigNumber();
    const _hasReferrer = source.readBoolean();
    const _referrer = source.readAddress();
    return { $$type: 'CreateOrder' as const, orderId: _orderId, merchant: _merchant, foodAmount: _foodAmount, hasReferrer: _hasReferrer, referrer: _referrer };
}

export function loadGetterTupleCreateOrder(source: TupleReader) {
    const _orderId = source.readBigNumber();
    const _merchant = source.readAddress();
    const _foodAmount = source.readBigNumber();
    const _hasReferrer = source.readBoolean();
    const _referrer = source.readAddress();
    return { $$type: 'CreateOrder' as const, orderId: _orderId, merchant: _merchant, foodAmount: _foodAmount, hasReferrer: _hasReferrer, referrer: _referrer };
}

export function storeTupleCreateOrder(source: CreateOrder) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.orderId);
    builder.writeAddress(source.merchant);
    builder.writeNumber(source.foodAmount);
    builder.writeBoolean(source.hasReferrer);
    builder.writeAddress(source.referrer);
    return builder.build();
}

export function dictValueParserCreateOrder(): DictionaryValue<CreateOrder> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeCreateOrder(src)).endCell());
        },
        parse: (src) => {
            return loadCreateOrder(src.loadRef().beginParse());
        }
    }
}

export type UpdateFees = {
    $$type: 'UpdateFees';
    deliveryFee: bigint;
    protocolFee: bigint;
}

export function storeUpdateFees(src: UpdateFees) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(4, 32);
        b_0.storeCoins(src.deliveryFee);
        b_0.storeCoins(src.protocolFee);
    };
}

export function loadUpdateFees(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 4) { throw Error('Invalid prefix'); }
    const _deliveryFee = sc_0.loadCoins();
    const _protocolFee = sc_0.loadCoins();
    return { $$type: 'UpdateFees' as const, deliveryFee: _deliveryFee, protocolFee: _protocolFee };
}

export function loadTupleUpdateFees(source: TupleReader) {
    const _deliveryFee = source.readBigNumber();
    const _protocolFee = source.readBigNumber();
    return { $$type: 'UpdateFees' as const, deliveryFee: _deliveryFee, protocolFee: _protocolFee };
}

export function loadGetterTupleUpdateFees(source: TupleReader) {
    const _deliveryFee = source.readBigNumber();
    const _protocolFee = source.readBigNumber();
    return { $$type: 'UpdateFees' as const, deliveryFee: _deliveryFee, protocolFee: _protocolFee };
}

export function storeTupleUpdateFees(source: UpdateFees) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.deliveryFee);
    builder.writeNumber(source.protocolFee);
    return builder.build();
}

export function dictValueParserUpdateFees(): DictionaryValue<UpdateFees> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeUpdateFees(src)).endCell());
        },
        parse: (src) => {
            return loadUpdateFees(src.loadRef().beginParse());
        }
    }
}

export type AcceptDelivery = {
    $$type: 'AcceptDelivery';
    orderId: bigint;
}

export function storeAcceptDelivery(src: AcceptDelivery) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(2, 32);
        b_0.storeUint(src.orderId, 64);
    };
}

export function loadAcceptDelivery(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2) { throw Error('Invalid prefix'); }
    const _orderId = sc_0.loadUintBig(64);
    return { $$type: 'AcceptDelivery' as const, orderId: _orderId };
}

export function loadTupleAcceptDelivery(source: TupleReader) {
    const _orderId = source.readBigNumber();
    return { $$type: 'AcceptDelivery' as const, orderId: _orderId };
}

export function loadGetterTupleAcceptDelivery(source: TupleReader) {
    const _orderId = source.readBigNumber();
    return { $$type: 'AcceptDelivery' as const, orderId: _orderId };
}

export function storeTupleAcceptDelivery(source: AcceptDelivery) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.orderId);
    return builder.build();
}

export function dictValueParserAcceptDelivery(): DictionaryValue<AcceptDelivery> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeAcceptDelivery(src)).endCell());
        },
        parse: (src) => {
            return loadAcceptDelivery(src.loadRef().beginParse());
        }
    }
}

export type ConfirmDelivery = {
    $$type: 'ConfirmDelivery';
    orderId: bigint;
}

export function storeConfirmDelivery(src: ConfirmDelivery) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(3, 32);
        b_0.storeUint(src.orderId, 64);
    };
}

export function loadConfirmDelivery(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 3) { throw Error('Invalid prefix'); }
    const _orderId = sc_0.loadUintBig(64);
    return { $$type: 'ConfirmDelivery' as const, orderId: _orderId };
}

export function loadTupleConfirmDelivery(source: TupleReader) {
    const _orderId = source.readBigNumber();
    return { $$type: 'ConfirmDelivery' as const, orderId: _orderId };
}

export function loadGetterTupleConfirmDelivery(source: TupleReader) {
    const _orderId = source.readBigNumber();
    return { $$type: 'ConfirmDelivery' as const, orderId: _orderId };
}

export function storeTupleConfirmDelivery(source: ConfirmDelivery) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.orderId);
    return builder.build();
}

export function dictValueParserConfirmDelivery(): DictionaryValue<ConfirmDelivery> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeConfirmDelivery(src)).endCell());
        },
        parse: (src) => {
            return loadConfirmDelivery(src.loadRef().beginParse());
        }
    }
}

export type OrderData = {
    $$type: 'OrderData';
    buyer: Address;
    merchant: Address;
    courier: Address | null;
    referrer: Address | null;
    deliveryFee: bigint;
    protocolFee: bigint;
    foodAmount: bigint;
    status: bigint;
}

export function storeOrderData(src: OrderData) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.buyer);
        b_0.storeAddress(src.merchant);
        b_0.storeAddress(src.courier);
        const b_1 = new Builder();
        b_1.storeAddress(src.referrer);
        b_1.storeCoins(src.deliveryFee);
        b_1.storeCoins(src.protocolFee);
        b_1.storeCoins(src.foodAmount);
        b_1.storeUint(src.status, 8);
        b_0.storeRef(b_1.endCell());
    };
}

export function loadOrderData(slice: Slice) {
    const sc_0 = slice;
    const _buyer = sc_0.loadAddress();
    const _merchant = sc_0.loadAddress();
    const _courier = sc_0.loadMaybeAddress();
    const sc_1 = sc_0.loadRef().beginParse();
    const _referrer = sc_1.loadMaybeAddress();
    const _deliveryFee = sc_1.loadCoins();
    const _protocolFee = sc_1.loadCoins();
    const _foodAmount = sc_1.loadCoins();
    const _status = sc_1.loadUintBig(8);
    return { $$type: 'OrderData' as const, buyer: _buyer, merchant: _merchant, courier: _courier, referrer: _referrer, deliveryFee: _deliveryFee, protocolFee: _protocolFee, foodAmount: _foodAmount, status: _status };
}

export function loadTupleOrderData(source: TupleReader) {
    const _buyer = source.readAddress();
    const _merchant = source.readAddress();
    const _courier = source.readAddressOpt();
    const _referrer = source.readAddressOpt();
    const _deliveryFee = source.readBigNumber();
    const _protocolFee = source.readBigNumber();
    const _foodAmount = source.readBigNumber();
    const _status = source.readBigNumber();
    return { $$type: 'OrderData' as const, buyer: _buyer, merchant: _merchant, courier: _courier, referrer: _referrer, deliveryFee: _deliveryFee, protocolFee: _protocolFee, foodAmount: _foodAmount, status: _status };
}

export function loadGetterTupleOrderData(source: TupleReader) {
    const _buyer = source.readAddress();
    const _merchant = source.readAddress();
    const _courier = source.readAddressOpt();
    const _referrer = source.readAddressOpt();
    const _deliveryFee = source.readBigNumber();
    const _protocolFee = source.readBigNumber();
    const _foodAmount = source.readBigNumber();
    const _status = source.readBigNumber();
    return { $$type: 'OrderData' as const, buyer: _buyer, merchant: _merchant, courier: _courier, referrer: _referrer, deliveryFee: _deliveryFee, protocolFee: _protocolFee, foodAmount: _foodAmount, status: _status };
}

export function storeTupleOrderData(source: OrderData) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.buyer);
    builder.writeAddress(source.merchant);
    builder.writeAddress(source.courier);
    builder.writeAddress(source.referrer);
    builder.writeNumber(source.deliveryFee);
    builder.writeNumber(source.protocolFee);
    builder.writeNumber(source.foodAmount);
    builder.writeNumber(source.status);
    return builder.build();
}

export function dictValueParserOrderData(): DictionaryValue<OrderData> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeOrderData(src)).endCell());
        },
        parse: (src) => {
            return loadOrderData(src.loadRef().beginParse());
        }
    }
}

export type TONEatsEscrow$Data = {
    $$type: 'TONEatsEscrow$Data';
    treasury: Address;
    deliveryFee: bigint;
    protocolFee: bigint;
    orders: Dictionary<bigint, OrderData>;
    lockedFunds: bigint;
}

export function storeTONEatsEscrow$Data(src: TONEatsEscrow$Data) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.treasury);
        b_0.storeCoins(src.deliveryFee);
        b_0.storeCoins(src.protocolFee);
        b_0.storeDict(src.orders, Dictionary.Keys.BigInt(257), dictValueParserOrderData());
        b_0.storeCoins(src.lockedFunds);
    };
}

export function loadTONEatsEscrow$Data(slice: Slice) {
    const sc_0 = slice;
    const _treasury = sc_0.loadAddress();
    const _deliveryFee = sc_0.loadCoins();
    const _protocolFee = sc_0.loadCoins();
    const _orders = Dictionary.load(Dictionary.Keys.BigInt(257), dictValueParserOrderData(), sc_0);
    const _lockedFunds = sc_0.loadCoins();
    return { $$type: 'TONEatsEscrow$Data' as const, treasury: _treasury, deliveryFee: _deliveryFee, protocolFee: _protocolFee, orders: _orders, lockedFunds: _lockedFunds };
}

export function loadTupleTONEatsEscrow$Data(source: TupleReader) {
    const _treasury = source.readAddress();
    const _deliveryFee = source.readBigNumber();
    const _protocolFee = source.readBigNumber();
    const _orders = Dictionary.loadDirect(Dictionary.Keys.BigInt(257), dictValueParserOrderData(), source.readCellOpt());
    const _lockedFunds = source.readBigNumber();
    return { $$type: 'TONEatsEscrow$Data' as const, treasury: _treasury, deliveryFee: _deliveryFee, protocolFee: _protocolFee, orders: _orders, lockedFunds: _lockedFunds };
}

export function loadGetterTupleTONEatsEscrow$Data(source: TupleReader) {
    const _treasury = source.readAddress();
    const _deliveryFee = source.readBigNumber();
    const _protocolFee = source.readBigNumber();
    const _orders = Dictionary.loadDirect(Dictionary.Keys.BigInt(257), dictValueParserOrderData(), source.readCellOpt());
    const _lockedFunds = source.readBigNumber();
    return { $$type: 'TONEatsEscrow$Data' as const, treasury: _treasury, deliveryFee: _deliveryFee, protocolFee: _protocolFee, orders: _orders, lockedFunds: _lockedFunds };
}

export function storeTupleTONEatsEscrow$Data(source: TONEatsEscrow$Data) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.treasury);
    builder.writeNumber(source.deliveryFee);
    builder.writeNumber(source.protocolFee);
    builder.writeCell(source.orders.size > 0 ? beginCell().storeDictDirect(source.orders, Dictionary.Keys.BigInt(257), dictValueParserOrderData()).endCell() : null);
    builder.writeNumber(source.lockedFunds);
    return builder.build();
}

export function dictValueParserTONEatsEscrow$Data(): DictionaryValue<TONEatsEscrow$Data> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeTONEatsEscrow$Data(src)).endCell());
        },
        parse: (src) => {
            return loadTONEatsEscrow$Data(src.loadRef().beginParse());
        }
    }
}

 type TONEatsEscrow_init_args = {
    $$type: 'TONEatsEscrow_init_args';
    treasury: Address;
}

function initTONEatsEscrow_init_args(src: TONEatsEscrow_init_args) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.treasury);
    };
}

async function TONEatsEscrow_init(treasury: Address) {
    const __code = Cell.fromHex('b5ee9c7241022e01000994000228ff008e88f4a413f4bcf2c80bed5320e303ed43d90112020271020a020120030802012004060163b4aabda89a1a400033df481f401f401e809f400aa80d82b1c27f4800203a3042017d7840104200bebc200dae1c5b678d8a30050008f8276f100167b41a7da89a1a400033df481f401f401e809f400aa80d82b1c27f4800203a3042017d7840104200bebc200dae1c4aa09b678d8a300700ac810101230259f40d6fa192306ddf206e92306d8e31d0fa40fa40d72c01916d93fa4001e201d401d0d72c01916d93fa4001e201fa00fa00fa00d307301058105710566c186f08e2206e92307fe0206ef2d0806f286c710193b8221ed44d0d200019efa40fa00fa00f404fa0055406c158e13fa400101d182100bebc200821005f5e1006d70e25504db3c6c51206e92306d99206ef2d0806f286f08e2206e92306dde809008e810101230259f40d6fa192306ddf206e92306d8e31d0fa40fa40d72c01916d93fa4001e201d401d0d72c01916d93fa4001e201fa00fa00fa00d307301058105710566c186f08e20201200b0d0163bae7fed44d0d200019efa40fa00fa00f404fa0055406c158e13fa400101d182100bebc200821005f5e1006d70e2db3c6c5180c0002230202740e100162aa2bed44d0d200019efa40fa00fa00f404fa0055406c158e13fa400101d182100bebc200821005f5e1006d70e2db3c6c510f0002220162ab12ed44d0d200019efa40fa00fa00f404fa0055406c158e13fa400101d182100bebc200821005f5e1006d70e2db3c6c511100022003f630eda2edfb01d072d721d200d200fa4021103450666f04f86102f862ed44d0d200019efa40fa00fa00f404fa0055406c158e13fa400101d182100bebc200821005f5e1006d70e206925f06e024d749c21fe30004f90182f090218655da49a654f5fba12f38d8bef301940dd023d9c38042e840ccd723d640bae302132b2d049c04d31f21c001e30221c0048e2e6c31fa00fa0030820089caf84224c705f2f44034c87f01ca0055405045ce58fa0201fa02f40001fa02c9ed54db31e021c002e30221c003e302018210946a98b6ba141a202a01fe31d33ffa40fa00d200fa4030f8416f2430325348a028a08200da8121820afaf080a014be13f2f48168922b8101012959f40d6fa192306ddf206e92306d8e31d0fa40fa40d72c01916d93fa4001e201d401d0d72c01916d93fa4001e201fa00fa00fa00d307301058105710566c186f08e26ef2f46d049233129132e28101011504fe6d70534a105910341037544b3901c855705078ce15ce5003206e9430cf84809201cee2c858206e9430cf84809201cee258fa0258fa0258fa0212cb07cdc910384140206e953059f45a30944133f415e25065a088c88258c000000000000000000000000101cb67ccc970fb007080428810385a6d6d40037fc8cf8580ca0089161718190022000000006f726465725f637265617465640030000000004f72646572204372656174656420526566756e64000110008acf16ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb004034c87f01ca0055405045ce58fa0201fa02f40001fa02c9ed54db3101f231d33f30f8416f2410235f03258101012359f40d6fa192306ddf206e92306d8e31d0fa40fa40d72c01916d93fa4001e201d401d0d72c01916d93fa4001e201fa00fa00fa00d307301058105710566c186f08e2814856216eb3f2f4206ef2d0806f2881209936c00015f2f426105610465520718101015088c81b04fc55705078ce15ce5003206e9430cf84809201cee2c858206e9430cf84809201cee258fa0258fa0258fa0212cb07cdc910374170206e953059f45a30944133f415e288c88258c000000000000000000000000101cb67ccc970fb007080428810375a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb08a1c1d1e1f002a0000000064656c69766572795f616363657074656400220000000041636365707420526566756e6400065bcf8101488ae2f400c901fb004034c87f01ca0055405045ce58fa0201fa02f40001fa02c9ed54db312302fe31d33f30f8416f2410235f03258101012359f40d6fa192306ddf206e92306d8e31d0fa40fa40d72c01916d93fa4001e201d401d0d72c01916d93fa4001e201fa00fa00fa00d307301058105710566c186f08e2814856216eb3f2f4206ef2d0806f28820082e001c001f2f482009d4425206ef2d0805290c705917fe30ef2f4212200085387c70502fe7207810101c82854483028544830285448301f55705078ce15ce5003206e9430cf84809201cee2c858206e9430cf84809201cee258fa0258fa0258fa0212cb07cdc9103d4790206e953059f45a30944133f415e2735434746d5a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf818ae2f400c92324001a58cf8680cf8480f400f400cf8104d401fb0002206ef2d08053a36d5a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb00206eb3e30f5077a058a016a188c88258c000000000000000000000000101cb67ccc970fb007080422526272800fe23ab0001206ef2d08053136d5a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb005230a15448136d5a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb000076305467336d5a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb00002c0000000064656c69766572795f636f6e6669726d656401aa8810385a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb004034c87f01ca0055405045ce58fa0201fa02f40001fa02c9ed54db3129002400000000436f6e6669726d20526566756e6400ac8e52d33f30c8018210aff90f5758cb1fcb3fc910354430f84270705003804201503304c8cf8580ca00cf8440ce01fa02806acf40f400c901fb00c87f01ca0055405045ce58fa0201fa02f40001fa02c9ed54db31e00401ea8200810bf84224c705f2f4f8276f1025a1820afaf080a18200f4ae21c200f2f472882555205a6d6d40037fc8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb004034c87f01ca0055405045ce58fa0201fa02f40001fa02c9ed542c001e000000007361666520726573637565000a5f05f2c08225e5fa92');
    const builder = beginCell();
    builder.storeUint(0, 1);
    initTONEatsEscrow_init_args({ $$type: 'TONEatsEscrow_init_args', treasury })(builder);
    const __data = builder.endCell();
    return { code: __code, data: __data };
}

export const TONEatsEscrow_errors = {
    2: { message: "Stack underflow" },
    3: { message: "Stack overflow" },
    4: { message: "Integer overflow" },
    5: { message: "Integer out of expected range" },
    6: { message: "Invalid opcode" },
    7: { message: "Type check error" },
    8: { message: "Cell overflow" },
    9: { message: "Cell underflow" },
    10: { message: "Dictionary error" },
    11: { message: "'Unknown' error" },
    12: { message: "Fatal error" },
    13: { message: "Out of gas error" },
    14: { message: "Virtualization error" },
    32: { message: "Action list is invalid" },
    33: { message: "Action list is too long" },
    34: { message: "Action is invalid or not supported" },
    35: { message: "Invalid source address in outbound message" },
    36: { message: "Invalid destination address in outbound message" },
    37: { message: "Not enough Toncoin" },
    38: { message: "Not enough extra currencies" },
    39: { message: "Outbound message does not fit into a cell after rewriting" },
    40: { message: "Cannot process a message" },
    41: { message: "Library reference is null" },
    42: { message: "Library change action error" },
    43: { message: "Exceeded maximum number of cells in the library or the maximum depth of the Merkle tree" },
    50: { message: "Account state size exceeded limits" },
    128: { message: "Null reference exception" },
    129: { message: "Invalid serialization prefix" },
    130: { message: "Invalid incoming message" },
    131: { message: "Constraints error" },
    132: { message: "Access denied" },
    133: { message: "Contract stopped" },
    134: { message: "Invalid argument" },
    135: { message: "Code of a contract was not found" },
    136: { message: "Invalid standard address" },
    138: { message: "Not a basechain address" },
    8345: { message: "Order not open" },
    18518: { message: "Order not found" },
    26770: { message: "Order ID already exists" },
    33035: { message: "Only treasury can withdraw" },
    33504: { message: "Delivery not accepted yet" },
    35274: { message: "Only treasury can update fees" },
    40260: { message: "Only courier or buyer can confirm" },
    55937: { message: "Insufficient TON for order and gas" },
    62638: { message: "No safe funds to withdraw" },
} as const

export const TONEatsEscrow_errors_backward = {
    "Stack underflow": 2,
    "Stack overflow": 3,
    "Integer overflow": 4,
    "Integer out of expected range": 5,
    "Invalid opcode": 6,
    "Type check error": 7,
    "Cell overflow": 8,
    "Cell underflow": 9,
    "Dictionary error": 10,
    "'Unknown' error": 11,
    "Fatal error": 12,
    "Out of gas error": 13,
    "Virtualization error": 14,
    "Action list is invalid": 32,
    "Action list is too long": 33,
    "Action is invalid or not supported": 34,
    "Invalid source address in outbound message": 35,
    "Invalid destination address in outbound message": 36,
    "Not enough Toncoin": 37,
    "Not enough extra currencies": 38,
    "Outbound message does not fit into a cell after rewriting": 39,
    "Cannot process a message": 40,
    "Library reference is null": 41,
    "Library change action error": 42,
    "Exceeded maximum number of cells in the library or the maximum depth of the Merkle tree": 43,
    "Account state size exceeded limits": 50,
    "Null reference exception": 128,
    "Invalid serialization prefix": 129,
    "Invalid incoming message": 130,
    "Constraints error": 131,
    "Access denied": 132,
    "Contract stopped": 133,
    "Invalid argument": 134,
    "Code of a contract was not found": 135,
    "Invalid standard address": 136,
    "Not a basechain address": 138,
    "Order not open": 8345,
    "Order not found": 18518,
    "Order ID already exists": 26770,
    "Only treasury can withdraw": 33035,
    "Delivery not accepted yet": 33504,
    "Only treasury can update fees": 35274,
    "Only courier or buyer can confirm": 40260,
    "Insufficient TON for order and gas": 55937,
    "No safe funds to withdraw": 62638,
} as const

const TONEatsEscrow_types: ABIType[] = [
    {"name":"DataSize","header":null,"fields":[{"name":"cells","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"bits","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"refs","type":{"kind":"simple","type":"int","optional":false,"format":257}}]},
    {"name":"SignedBundle","header":null,"fields":[{"name":"signature","type":{"kind":"simple","type":"fixed-bytes","optional":false,"format":64}},{"name":"signedData","type":{"kind":"simple","type":"slice","optional":false,"format":"remainder"}}]},
    {"name":"StateInit","header":null,"fields":[{"name":"code","type":{"kind":"simple","type":"cell","optional":false}},{"name":"data","type":{"kind":"simple","type":"cell","optional":false}}]},
    {"name":"Context","header":null,"fields":[{"name":"bounceable","type":{"kind":"simple","type":"bool","optional":false}},{"name":"sender","type":{"kind":"simple","type":"address","optional":false}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"raw","type":{"kind":"simple","type":"slice","optional":false}}]},
    {"name":"SendParameters","header":null,"fields":[{"name":"mode","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"body","type":{"kind":"simple","type":"cell","optional":true}},{"name":"code","type":{"kind":"simple","type":"cell","optional":true}},{"name":"data","type":{"kind":"simple","type":"cell","optional":true}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"to","type":{"kind":"simple","type":"address","optional":false}},{"name":"bounce","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"MessageParameters","header":null,"fields":[{"name":"mode","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"body","type":{"kind":"simple","type":"cell","optional":true}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"to","type":{"kind":"simple","type":"address","optional":false}},{"name":"bounce","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"DeployParameters","header":null,"fields":[{"name":"mode","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"body","type":{"kind":"simple","type":"cell","optional":true}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"bounce","type":{"kind":"simple","type":"bool","optional":false}},{"name":"init","type":{"kind":"simple","type":"StateInit","optional":false}}]},
    {"name":"StdAddress","header":null,"fields":[{"name":"workchain","type":{"kind":"simple","type":"int","optional":false,"format":8}},{"name":"address","type":{"kind":"simple","type":"uint","optional":false,"format":256}}]},
    {"name":"VarAddress","header":null,"fields":[{"name":"workchain","type":{"kind":"simple","type":"int","optional":false,"format":32}},{"name":"address","type":{"kind":"simple","type":"slice","optional":false}}]},
    {"name":"BasechainAddress","header":null,"fields":[{"name":"hash","type":{"kind":"simple","type":"int","optional":true,"format":257}}]},
    {"name":"Deploy","header":2490013878,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}}]},
    {"name":"DeployOk","header":2952335191,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}}]},
    {"name":"FactoryDeploy","header":1829761339,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"cashback","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"CreateOrder","header":1,"fields":[{"name":"orderId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"merchant","type":{"kind":"simple","type":"address","optional":false}},{"name":"foodAmount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"hasReferrer","type":{"kind":"simple","type":"bool","optional":false}},{"name":"referrer","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"UpdateFees","header":4,"fields":[{"name":"deliveryFee","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"protocolFee","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}}]},
    {"name":"AcceptDelivery","header":2,"fields":[{"name":"orderId","type":{"kind":"simple","type":"uint","optional":false,"format":64}}]},
    {"name":"ConfirmDelivery","header":3,"fields":[{"name":"orderId","type":{"kind":"simple","type":"uint","optional":false,"format":64}}]},
    {"name":"OrderData","header":null,"fields":[{"name":"buyer","type":{"kind":"simple","type":"address","optional":false}},{"name":"merchant","type":{"kind":"simple","type":"address","optional":false}},{"name":"courier","type":{"kind":"simple","type":"address","optional":true}},{"name":"referrer","type":{"kind":"simple","type":"address","optional":true}},{"name":"deliveryFee","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"protocolFee","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"foodAmount","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"status","type":{"kind":"simple","type":"uint","optional":false,"format":8}}]},
    {"name":"TONEatsEscrow$Data","header":null,"fields":[{"name":"treasury","type":{"kind":"simple","type":"address","optional":false}},{"name":"deliveryFee","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"protocolFee","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"orders","type":{"kind":"dict","key":"int","value":"OrderData","valueFormat":"ref"}},{"name":"lockedFunds","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}}]},
]

const TONEatsEscrow_opcodes = {
    "Deploy": 2490013878,
    "DeployOk": 2952335191,
    "FactoryDeploy": 1829761339,
    "CreateOrder": 1,
    "UpdateFees": 4,
    "AcceptDelivery": 2,
    "ConfirmDelivery": 3,
}

const TONEatsEscrow_getters: ABIGetter[] = [
    {"name":"get_order_status","methodId":73939,"arguments":[{"name":"orderId","type":{"kind":"simple","type":"int","optional":false,"format":257}}],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"get_order","methodId":82465,"arguments":[{"name":"orderId","type":{"kind":"simple","type":"int","optional":false,"format":257}}],"returnType":{"kind":"simple","type":"OrderData","optional":true}},
    {"name":"get_delivery_fee","methodId":110207,"arguments":[],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"get_protocol_fee","methodId":123435,"arguments":[],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"contract_balance","methodId":66901,"arguments":[],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
    {"name":"locked_funds","methodId":124690,"arguments":[],"returnType":{"kind":"simple","type":"int","optional":false,"format":257}},
]

export const TONEatsEscrow_getterMapping: { [key: string]: string } = {
    'get_order_status': 'getGetOrderStatus',
    'get_order': 'getGetOrder',
    'get_delivery_fee': 'getGetDeliveryFee',
    'get_protocol_fee': 'getGetProtocolFee',
    'contract_balance': 'getContractBalance',
    'locked_funds': 'getLockedFunds',
}

const TONEatsEscrow_receivers: ABIReceiver[] = [
    {"receiver":"internal","message":{"kind":"typed","type":"CreateOrder"}},
    {"receiver":"internal","message":{"kind":"typed","type":"UpdateFees"}},
    {"receiver":"internal","message":{"kind":"typed","type":"AcceptDelivery"}},
    {"receiver":"internal","message":{"kind":"typed","type":"ConfirmDelivery"}},
    {"receiver":"internal","message":{"kind":"text","text":"withdraw_all"}},
    {"receiver":"internal","message":{"kind":"typed","type":"Deploy"}},
]


export class TONEatsEscrow implements Contract {
    
    public static readonly storageReserve = 0n;
    public static readonly errors = TONEatsEscrow_errors_backward;
    public static readonly opcodes = TONEatsEscrow_opcodes;
    
    static async init(treasury: Address) {
        return await TONEatsEscrow_init(treasury);
    }
    
    static async fromInit(treasury: Address) {
        const __gen_init = await TONEatsEscrow_init(treasury);
        const address = contractAddress(0, __gen_init);
        return new TONEatsEscrow(address, __gen_init);
    }
    
    static fromAddress(address: Address) {
        return new TONEatsEscrow(address);
    }
    
    readonly address: Address; 
    readonly init?: { code: Cell, data: Cell };
    readonly abi: ContractABI = {
        types:  TONEatsEscrow_types,
        getters: TONEatsEscrow_getters,
        receivers: TONEatsEscrow_receivers,
        errors: TONEatsEscrow_errors,
    };
    
    constructor(address: Address, init?: { code: Cell, data: Cell }) {
        this.address = address;
        this.init = init;
    }
    
    async send(provider: ContractProvider, via: Sender, args: { value: bigint, bounce?: boolean| null | undefined }, message: CreateOrder | UpdateFees | AcceptDelivery | ConfirmDelivery | "withdraw_all" | Deploy) {
        
        let body: Cell | null = null;
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'CreateOrder') {
            body = beginCell().store(storeCreateOrder(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'UpdateFees') {
            body = beginCell().store(storeUpdateFees(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'AcceptDelivery') {
            body = beginCell().store(storeAcceptDelivery(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'ConfirmDelivery') {
            body = beginCell().store(storeConfirmDelivery(message)).endCell();
        }
        if (message === "withdraw_all") {
            body = beginCell().storeUint(0, 32).storeStringTail(message).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'Deploy') {
            body = beginCell().store(storeDeploy(message)).endCell();
        }
        if (body === null) { throw new Error('Invalid message type'); }
        
        await provider.internal(via, { ...args, body: body });
        
    }
    
    async getGetOrderStatus(provider: ContractProvider, orderId: bigint) {
        const builder = new TupleBuilder();
        builder.writeNumber(orderId);
        const source = (await provider.get('get_order_status', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getGetOrder(provider: ContractProvider, orderId: bigint) {
        const builder = new TupleBuilder();
        builder.writeNumber(orderId);
        const source = (await provider.get('get_order', builder.build())).stack;
        const result_p = source.readTupleOpt();
        const result = result_p ? loadTupleOrderData(result_p) : null;
        return result;
    }
    
    async getGetDeliveryFee(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('get_delivery_fee', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getGetProtocolFee(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('get_protocol_fee', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getContractBalance(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('contract_balance', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
    async getLockedFunds(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('locked_funds', builder.build())).stack;
        const result = source.readBigNumber();
        return result;
    }
    
}