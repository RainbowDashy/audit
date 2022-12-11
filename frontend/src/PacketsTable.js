import React from 'react';
import { Table, Input, Button, Space } from 'antd';
import Highlighter from 'react-highlight-words';
import { SearchOutlined } from '@ant-design/icons';

export class PacketsTable extends React.Component {
  state = {
    searchText: '',
    searchedColumn: '',
    selectedRowKeys: [],
  };

  getColumnSearchProps = dataIndex => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={node => {
            this.searchInput = node;
          }}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => this.handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => this.handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button onClick={() => this.handleReset(clearFilters)} size="small" style={{ width: 90 }}>
            Reset
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              confirm({ closeDropdown: false });
              this.setState({
                searchText: selectedKeys[0],
                searchedColumn: dataIndex,
              });
            }}
          >
            Filter
          </Button>
        </Space>
      </div>
    ),
    filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
    onFilter: (value, record) =>
      record[dataIndex]
        ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase())
        : '',
    onFilterDropdownVisibleChange: visible => {
      if (visible) {
        setTimeout(() => this.searchInput.select(), 100);
      }
    },
    render: text =>
      this.state.searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
          searchWords={[this.state.searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ''}
        />
      ) : (
        text
      ),
  });

  handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    this.setState({
      searchText: selectedKeys[0],
      searchedColumn: dataIndex,
    });
  };

  handleReset = clearFilters => {
    clearFilters();
    this.setState({ searchText: '' });
  };

  onSelectChange = (selectedRowKeys, selectedRows) => {
    this.setState({ selectedRowKeys });
    this.props.onSelectChange(selectedRows);
  };

  render() {
    const columns = [
      {
        title: "username",
        dataIndex: "username",
        key: "username",
        // width: 80,
        // defaultSortOrder: "descend",
        // sorter: (a, b) => a.key - b.key,
      },
      {
        title: "uid",
        dataIndex: "uid",
        key: "uid",
        ...this.getColumnSearchProps("uid"),
      },
      {
        title: "CommandName",
        dataIndex: "commandname",
        key: "commandname",
        ...this.getColumnSearchProps("commandname"),
      },
      {
        title: "pid",
        dataIndex: "pid",
        key: "pid",
        ...this.getColumnSearchProps("pid"),
      },
      {
        title: "logtime",
        dataIndex: "logtime",
        key: "logtime",
        ...this.getColumnSearchProps("logtime"),
      },
      {
        title: "logpath",
        dataIndex: "logpath",
        key: "logpath",
        ...this.getColumnSearchProps("logpath"),
      },
      {
        title: "syscall",
        dataIndex: "opentype",
        key: "opentype",
        ...this.getColumnSearchProps("opentype"),
      },
      {
        title: "result",
        dataIndex: "openresult",
        key: "openresult",
        ...this.getColumnSearchProps("openresult"),
      },
    ];
    const {selectedRowKeys} = this.state;
    const rowSelection = {
      selectedRowKeys,
      onChange: this.onSelectChange,
    };
    return <Table columns={columns} dataSource={this.props.dataSource}
      onRow={this.props.onRow}
      rowSelection={rowSelection}
      scroll={{ y: "calc(80vh)" }}
      pagination={{ defaultPageSize: 50 }}
      size="small"
    />;
  }
}
