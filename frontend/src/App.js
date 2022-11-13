import React, { useEffect, useState } from "react";
import { Layout, Input, Select, Button, message, Skeleton, Collapse } from "antd";
import { PauseCircleOutlined, PlayCircleOutlined, ClearOutlined, SaveOutlined } from "@ant-design/icons"
import { tryRpc } from "./rpc"
import { PacketsTable } from "./PacketsTable";
import * as Data from "./data"
import download from "./download"
import "./App.css";

const { Header, Footer, Content } = Layout;
const { Option } = Select;
const { Panel } = Collapse;

const App = () => {
  const defaultDevice = "None";
  const [devices, setDevices] = useState([]);
  const [device, setDevice] = useState(defaultDevice);
  const [started, setStarted] = useState(false);
  const [filter, setFilter] = useState("");
  const [data, setData] = useState([]);
  const [selectedData, setSelectedData] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);

  // findAllDevs: init at the first time
  useEffect(() => {
    (async function () {
      let data = await tryRpc("Packets.FindAllDevs", "something went wrong with finding all devices");
      if (data !== null) {
        setDevices(data);
      }
    })()
  }, []);

  // get Packet data
  useEffect(() => {
    async function run() {
      if (await Data.append()) {
        setData(Data.get());
      }
    }
    let id = -1;
    if (started) {
      run();
      id = setInterval(run, 1000);
    }
    return () => {
      if (id >= 0)
        clearInterval(id);
    }
  }, [started]);

  async function handleStarted() {
    if (device === defaultDevice) {
      message.warn("please choose a network device");
      return;
    }
    let data = null;
    if (started) {
      data = await tryRpc("Packets.Close", "close failed");
    } else {
      data = await tryRpc("Packets.Start", "start failed", device);
    }
    if (data !== null) {
      setStarted(!started);
    }
  }

  async function handleClear() {
    await tryRpc("Packets.Clear", "clear failed");
    Data.clear();
    setData([]);
    setSelectedData(null);
  }

  function handleSave() {
    if (selectedRows.length === 0) {
      message.warn("please select at least one record");
      return;
    }
    download(selectedRows, "packets");
  }

  function handleDeviceChange(value) {
    console.log(`set device to ${value}`);
    setDevice(value);
  }

  function handleFilterChange(e) {
    console.log(`set filter to ${e.target.value}`);
    setFilter(e.target.value);
  }

  async function handleFilterApply() {
    if (!started) {
      message.warn("please start first");
      return;
    }
    await tryRpc("Packets.SetFilter", "set failed", filter);
  }

  return (
    <Layout className="layout">
      <Header>
        <span className="logo">Audit</span>
        <span id="filter">
          <Input id="filter-input" placeholder="input some filter" value={filter}
            onChange={handleFilterChange}
            onPressEnter={handleFilterApply}
          />
          <Button id="filter-apply-button" type="primary" size="large"
            onClick={handleFilterApply}
          >Apply</Button>
        </span>
        <span id="network-device">
          <span className="label">choose a device</span>
          <Select className="network-device-select" defaultValue={defaultDevice} value={device} onChange={handleDeviceChange}>
            <Option value="None" key="None" disabled>None</Option>
            {
              devices.map(v => (
                <Option value={v} key={v}>{v}</Option>
              ))
            }
          </Select>
        </span>
        <Button id="started" type="primary" size="large" shape="circle"
          icon={started ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
          onClick={handleStarted}
        ></Button>
        <Button id="clear" type="primary" size="large" shape="circle"
          icon={<ClearOutlined />}
          onClick={handleClear}
        ></Button>
        <Button id="save" type="primary" size="large" shape="circle"
          icon={<SaveOutlined />}
          onClick={handleSave}
        ></Button>
      </Header>
      <Content style={{ padding: "0 50px" }}>
        <div id="packets-list">
          {
            data.length > 0 ?
              <PacketsTable className="packets-list-table" dataSource={data} 
                onRow={record => {
                  return {
                    onClick: () => {
                      setSelectedData(record);
                    }
                  }
                }}
                onSelectChange={records => {
                  setSelectedRows(records);
                }}
              /> :
              <>Log List<Skeleton /*active*/ /></>
          }
        </div>
        <div id="packets-info">
          {
            selectedData !== null ?
              <>
                <Collapse>
                  <Panel header={`Basic | Key ${selectedData.key} | ${selectedData.dFrom} -> ${selectedData.dTo}`} key="-2">
                    <pre>{selectedData.basicInformation}</pre>
                  </Panel>
                  <Panel header="Full Data" key="-1"><pre>{selectedData.fullData}</pre></Panel>
                  {
                    selectedData.layer.map((v, index) => (
                      <Panel header={`Layer ${v.layerNumber} -- ${v.layerName}`} key={index}>
                        <pre>
                          {
                            v.options !== null ?
                              `Options: ${v.options.join(" ")}\nData:\n${v.data}`:
                              `Data:\n${v.data}`
                          }
                        </pre>
                      </Panel>
                    ))
                  }
                </Collapse>
              </>:
              <>Log Info<Skeleton /*active*/ /></>
          }
        </div>
      </Content>
      <Footer style={{ textAlign: "center" }}>
        Audit ©2022 Created by Kelo
      </Footer>
    </Layout>
  );
}

export default App;
