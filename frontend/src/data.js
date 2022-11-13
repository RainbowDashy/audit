import { AssemblePool } from "./assemblePool";
import { tryRpc } from "./rpc"

class FunctionHandler {
  constructor() {
    this.fn = null;
  }
  change(f) {
    this.fn = f;
  }
  run(...args) {
    if (this.fn !== null) {
      this.fn(...args);
    }
  }
}

export class Item {
  constructor(rawData) {
    this.key = rawData.key;
    this.fullData = null;
    this.fullDataLength = null;
    this.from = null;
    this.to = null;
    this.fromPort = null;
    this.toPort = null;
    this.layer = [];
    this._protocol = null;
    this.protocol = null;
    this._rawData = rawData;

    let tmpData;
    let handler = new FunctionHandler();
    rawData.packet.split("\n").forEach(v => {
      if (/FULL PACKET DATA \((\d+) bytes\)/.test(v)) {
        let length = RegExp.$1;
        handler.run(tmpData);
        handler.change(this.handleFullPacker.bind(this, length));
        tmpData = "";
      } else if (/^--- Layer (\d+) ---$/.test(v)) {
        let layerNumer = RegExp.$1;
        handler.run(tmpData);
        handler.change(this.handleLayer.bind(this, layerNumer))
        tmpData = "";
      } else {
        tmpData += v + "\n";
      }
    });
    handler.run(tmpData);
  }
  handleFullPacker(length, data) {
    this.fullDataLength = length;
    this.fullData = data;
  }
  handleLayer(layer, data) {
    let item = {
      layerNumber: layer,
      layerName: null,
      data: null,
      options: [],
    };
    data = data.split("\n");
    let header = data.splice(0, 1)[0];
    item.data = data.join("\n");
    if (/^(\w+?)\t/.test(header)) {
      item.layerName = RegExp.$1;
      if (item.layerName === "Payload") {
        // item.layerName = "Application";
      }
      else 
        this._protocol = item.layerName;
    }
    if (/SrcMAC=([\w:]+)/.test(header)) {
      this.from = RegExp.$1;
    }
    if (/DstMAC=([\w:]+)/.test(header)) {
      this.to = RegExp.$1;
    }
    if (/SrcIP=([\d\w.:]+)/.test(header)) {
      this.from = RegExp.$1;
    }
    if (/DstIP=([\d\w.:]+)/.test(header)) {
      this.to = RegExp.$1;
    }
    if (/SrcPort=([\d]+)/.test(header)) {
      this.fromPort = RegExp.$1;
    }
    if (/DstPort=([\d]+)/.test(header)) {
      this.toPort = RegExp.$1;
    }
    if (/SrcPort=[\d]+\(([^)]+)\)/.test(header)) {
      this.protocol = RegExp.$1;
    }
    if (/DstPort=[\d]+\(([^)]+)\)/.test(header)) {
      this.protocol = RegExp.$1;
    }
    item.options = header.match(/\w+?=([^ [\]}]+|\[[^\]]*?\])/g);
    this.layer.push(item);
  }
  // return a detailed protocol
  get dProtocol() {
    if (this.protocol === null)
      return this._protocol;
    else
      return `${this._protocol} (${this.protocol})`;
  }
  // return a detailed from information
  get dFrom() {
    if (this.fromPort !== null)
      return `${this.from}:${this.fromPort}`;
    else
      return this.from;
  }
  // return a detailed to information
  get dTo() {
    if (this.toPort !== null)
      return `${this.to}:${this.toPort}`;
    else
      return this.to;
  }
  get basicInformation() {
    if (this.fromPort !== null && this.toPort !== null)
      return `From: ${this.from}
FromPort: ${this.fromPort}
To: ${this.to}
ToPort: ${this.toPort}
Protocol: ${this.dProtocol}
FullDataLength: ${this.fullDataLength} bytes`;
    else
      return `From: ${this.from}
To: ${this.to}
Protocol: ${this.dProtocol}
FullDataLength: ${this.fullDataLength} bytes`; 
  }
}

let data = [];
let assemblePool = new AssemblePool();

export function get() {
  return data;
}

export function clear() {
  data = [];
}

export async function append() {
  let newData = await tryRpc("Packets.Get", "get failed");
  if (newData !== null) {
    newData = newData.map(v => {
      v = new Item(v);
      let n = null;
      if (v._protocol === "Fragment")
        n = assemblePool.push(v);
      if (n == null)
        return v;
      else
        return [v, n];
    });
    newData = newData.flat();
    data = data.concat(newData);
    return true;
  }
  return false;
}