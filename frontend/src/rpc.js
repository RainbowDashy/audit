import { message } from "antd";

let _rpcURL = "/api/log";
{
  let {protocol, hostname, port} = window.location;
  if (port === "3000") {
    _rpcURL = `${protocol}//${hostname}:6657/api/log`;
  }
}

export async function rpc(method, params) {
  let response = await Promise.race([
    fetch(_rpcURL, {
      method: "GET",
      // headers: { "Content-Type": "application/json" }
    }),
    new Promise((resolve, reject) => {
      setTimeout(() => reject(new Error("timeout")), 5000);
    })
  ]);
  let data = await response.text();
  return data;
}

export async function tryRpc(method, msg, params) {
  try {
    let data = await rpc(method, params);
    return data;
  } catch (e) {
    console.log(e);
    message.warn(msg);
  }
  return null;
}
