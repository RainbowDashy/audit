import { message } from "antd";

let _rpcURL = "/rpc";
{
  let {protocol, hostname, port} = window.location;
  if (port === "3000") {
    _rpcURL = `${protocol}//${hostname}:8081/rpc`;
  }
}

export async function rpc(method, params) {
  let response = await Promise.race([
    fetch(_rpcURL, {
      method: "POST",
      body: JSON.stringify({
        method: method,
        params: [params]
      }),
      // headers: { "Content-Type": "application/json" }
    }),
    new Promise((resolve, reject) => {
      setTimeout(() => reject(new Error("timeout")), 5000);
    })
  ]);
  let data = await response.json();
  return data;
}

export async function tryRpc(method, msg, params) {
  try {
    let data = await rpc(method, params);
    if (data.error !== null) {
      throw new Error(data.error);
    }
    return data.result;
  } catch (e) {
    console.log(e);
    message.warn(msg);
  }
  return null;
}