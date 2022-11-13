import { Item } from "./data";

export class AssemblePool {
  constructor() {
    this.LEN = 300;
    this.pool = new Array(this.LEN);
    this.l = 0;
    this.r = 0;
  }
  push(item) {
    // get IPv4 information
    let ipv4index = null;
    for (let i = 0; i < item.layer.length; ++i)
      if (item.layer[i].layerName === "IPv4") {
        ipv4index = i;
      }
    if (ipv4index === null) return null;

    let flag = true;
    let protocol = "TCP";

    for (let j of item.layer[ipv4index].options) {
      if (j === "Flags=MF")
        flag = false;
      if (j.startsWith("Id="))
        item._ipv4id = j;
      if (j.startsWith("Protocol=")) {
        protocol = j.substring(9);
      }
    }

    if (this.r + 1 === this.l) {
      this.r = this.l;
      this.l = (this.l + 1) % this.LEN;
    } else {
      this.r = (this.r + 1) % this.LEN;
    }
    this.pool[this.r] = item;

    if (!flag) return null;

    let ret = [];

    for (let i = (this.l + 1) % this.LEN; i !== this.r; i = (i + 1) % this.LEN) {
      if (this.pool[i]._ipv4id === item._ipv4id &&
          this.pool[i].dFrom === item.dFrom &&
          this.pool[i].dTo === item.dTo)
        ret.push(this.pool[i]);
    }
    ret.push(item);
    let n = new Item(item._rawData);
    n.key = n.key + 0.5;
    n._protocol = protocol;
    n.protocol = "Reassembled"
    return n;
  }
}