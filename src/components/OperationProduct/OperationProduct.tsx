/*eslint-disable no-eval */

import React from 'react'
import ReactDom from 'react-dom'
import './OperationProduct.scss'
import axios from "axios";
import {Button, DatePicker, Input, InputNumber, Select, Table, TimePicker} from 'antd'
import moment from 'moment';

export default class OperationProduct extends React.PureComponent<IOperationProductProps, IOperationProductState> {
  serviceIp = "10.50.10.6";
  strSql = "select * from tad_product_info";
  domMain: any;
  mapRecordValues = new Map();
  uniqueKey = 999;
  selectedRowValues = new Array<any>();
  rowSelection = {
    onChange: (selectedRowKeys: React.Key[], selectedRows: any) => {
      console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);

      let arrPropertyName = Object.keys(selectedRows[0]);
      let mapValues = new Map();
      for (let item of arrPropertyName) {
        mapValues.set(item, selectedRows[0][item])
      }
      console.log(mapValues);

      this.selectedRowValues = selectedRows;
    },
    getCheckboxProps: (record: any) => ({
      disabled: record.product_id === '1',
      name: record.product_id
    })
  };

  constructor(props: IOperationProductProps) {
    super(props);
    this.state = {
      code: -1,
      message: '',
      tableName: '',
      tableFields: new Array<any>(),
      tableRecords: new Array<any>(),
      tableTotalRecords: 0,
      tableTotalPages: 1,
      tableCurrentPage: 1,
      tableRowsPerPage: 20,
      tableRecordSelected: new Array<any>(),
      tableUpdateSql: '',
      tableInsertSql: '',
      tableDeleteSql: '',
      tableDatasource: new Array<any>(),
      tableColumns: new Array<any>(),
      styleDialogDynamicInsert: {display: "none"},
      styleDialogDynamicUpdate: {display: "none"},
      styleDialogDynamicQuery: {display: "none"},
      jsxDialogDynamic: new Array<any>(),
      isShownDialogDynamic: false,
      selectedRowKeys: new Array<any>()
    }

    this.doFilter = this.doFilter.bind(this);
    this.doQuery = this.doQuery.bind(this);
    this.doQueryConfirm = this.doQueryConfirm.bind(this);
    this.doQueryReset = this.doQueryReset.bind(this);
    this.doQueryClose = this.doQueryClose.bind(this);
    this.doInsert = this.doInsert.bind(this);
    this.doInsertConfirm = this.doInsertConfirm.bind(this);
    this.doInsertReset = this.doInsertReset.bind(this);
    this.doInsertClose = this.doInsertClose.bind(this);
    this.doUpdate = this.doUpdate.bind(this);
    this.doUpdateConfirm = this.doUpdateConfirm.bind(this);
    this.doUpdateReset = this.doUpdateReset.bind(this);
    this.doUpdateClose = this.doUpdateClose.bind(this);
    this.doDelete = this.doDelete.bind(this);
    this.doRefresh = this.doRefresh.bind(this);
  }

  componentDidMount() {
    this.domMain = ReactDom.findDOMNode(this);
    this.doRefresh()
  }

  doFilter() {
    console.log(this.props);
  }

  doQuery() {
    let style = {
      display: "grid",
      width: this.domMain.offsetWidth - 10,
      height: this.domMain.offsetHeight - 10,
      left: "5px",
      top: this.domMain.offsetTop + 5
    }

    let jsxDialog: any = [];

    for (let i = 0; i < this.state.tableColumns.length; i++) {
      let title = this.state.tableColumns[i].title;
      let comDynamic: any;
      let keyComDynamic = this.state.tableColumns[i].key;
      console.log(this.state.tableColumns[i].fieldType);
      let s = keyComDynamic;
      switch (this.state.tableColumns[i].fieldType) {
        case "INT":
          comDynamic = <div style={{display: "grid", gridTemplateColumns: "auto 1fr", gridGap: "5px"}}>
            <Select defaultValue="greatEqual"
                    onChange={(e) => this.onChangeSelect(e, s, "number")}>
              <Select.Option value="equal">=</Select.Option>
              <Select.Option value="great">&gt;</Select.Option>
              <Select.Option value="less">&lt;</Select.Option>
              <Select.Option value="greatEqual">&gt;=</Select.Option>
              <Select.Option value="lessEqual">&lt;=</Select.Option>
              <Select.Option value="notEqual">!=</Select.Option>
            </Select>
            <InputNumber style={{width: "100%"}}
                         key={keyComDynamic}
                         onChange={(e) => this.onChangeInput(e, s, 'number')}/>
          </div>
          break
        case "DATETIME":
          comDynamic = <div style={{display: "grid", gridTemplateColumns: "auto 1fr 1fr", gridGap: "5px"}}>
            <Select defaultValue="greatEqual"
                    onChange={(e) => this.onChangeSelect(e, s, "datetime")}>
              <Select.Option value="equal">=</Select.Option>
              <Select.Option value="great">&gt;</Select.Option>
              <Select.Option value="less">&lt;</Select.Option>
              <Select.Option value="greatEqual">&gt;=</Select.Option>
              <Select.Option value="lessEqual">&lt;=</Select.Option>
              <Select.Option value="notEqual">!=</Select.Option>
            </Select>
            <DatePicker
              key={keyComDynamic}
              onChange={(e) => this.onChangeInput(e, s, 'date')}/>
            <TimePicker
              onChange={(e) => this.onChangeInput(e, s, 'time')}/>
          </div>
          break
        default:
          comDynamic = <div style={{display: "grid", gridTemplateColumns: "auto 1fr", gridGap: "5px"}}>
            <Select defaultValue="like"
                    onChange={(e) => this.onChangeSelect(e, s, "string")}>
              <Select.Option value="equal">=</Select.Option>
              <Select.Option value="like">like</Select.Option>
              <Select.Option value="notEqual">!=</Select.Option>
            </Select>
            <Input
              key={keyComDynamic}
              onChange={(e) => this.onChangeInput(e, s, 'string')}/>
          </div>
          break
      }
      let keyBoxField = "box_" + this.state.tableColumns[i].key;
      jsxDialog.push(<div key={keyBoxField} className={"BoxField"}>
        <div className="Title">{title}</div>
        <div className="Value">{comDynamic}</div>
      </div>)
    }

    this.setState({
      styleDialogDynamicQuery: style,
      jsxDialogDynamic: jsxDialog
    });
  }

  doQueryConfirm() {
    let tableName = this.state.tableName;
    let strSql = "";

    if (this.mapRecordValues.size <= 0) {
      this.setState({message: "没有做任何更改"});
      return
    }

    this.mapRecordValues.forEach(function (value, key) {

      let operator = "=";
      switch (value.operator) {
        case "equal":
          operator = " = ";
          break
        case "noEqual":
          operator = " != ";
          break
        case "great":
          operator = " > ";
          break
        case "greatEqual":
          operator = " >= ";
          break
        case "less":
          operator = " < ";
          break
        case "lessEqual":
          operator = " <= ";
          break
        case "like":
          operator = " like ";
          break
      }
      strSql += key + operator
      switch (value.type) {
        case "number":
          strSql += value.value + " and ";
          break
        case "string":
          strSql += "'" + value.value + "' and ";
          break
        case "datetime":
          let strDate = value.value.date;
          let strTime = value.value.time;

          if (strDate !== "") {
            if (strTime === "") strTime = "00:00:00";
            strSql += strDate + " " + strTime + "' and "
          }
          break
      }

    });

    strSql = strSql.substr(0, strSql.length - 5);
    strSql = "select * from " + tableName + " where " + strSql;
    console.log(strSql);

    this.strSql = strSql;

    // /*
    axios.post("http://" + this.serviceIp + ":8090/rest/mysql/select", {
        sql: this.strSql,
        pageRows: 0,
        pageNum: 0,
        tag: "test by K"
      },
      {
        headers: {  //头部参数
          'Content-Type': 'application/json'
        }
      })
      .then((response) => {

        let data = response.data;
        console.log(data);

        let columns = new Array<any>();
        for (let i = 0; i < data.table.tableFields.length; i++) {
          columns.push({
            title: data.table.tableFields[i].fieldName,
            dataIndex: data.table.tableFields[i].fieldName,
            key: data.table.tableFields[i].fieldName,
            fieldType: data.table.tableFields[i].fieldType,
            render: (text: any) => <span style={{color: "blue"}}>{text}</span>
          });
        }

        let datasource = new Array<any>();
        for (let i = 0; i < data.records.length; i++) {
          let myValues = {key: i};
          for (let j = 0; j < columns.length; j++) {
            let jsStatement = "myValues." + columns[j].key + "= data.records[i].fieldValues[j]";
            eval(jsStatement);
          }
          datasource.push(myValues);
        }

        this.setState({
          code: data.code,
          message: data.message,
          tableName: data.table.tableName,
          tableFields: data.table.tableFields,
          tableRecords: data.records,
          tableColumns: columns,
          tableDatasource: datasource
        });
      })
      .catch(function (error) {
        console.log(error);
      });
    // */
  }

  doQueryReset() {

  }

  doQueryClose() {
    let style = {
      display: "none"
    }
    this.setState({
      styleDialogDynamicQuery: style
    });
  }

  doDelete() {
    let tableName = this.state.tableName;
    let strWhere = " where ";
    for (let propertyName of Object.keys(this.selectedRowValues[0])) {
      if (propertyName !== 'key') {
        let strType = "string";
        for (let item of this.state.tableColumns) {
          if (item.title === propertyName) {
            if (item.fieldType === "INT") {
              strType = "number";
            } else if (item.fieldType === "VARCHAR") {
              strType = "string";
            } else if (item.fieldType === "DATETIME") {
              strType = "datetime";
            }
            break
          }
        }
        if (strType === "number") {
          strWhere += propertyName + "=" + this.selectedRowValues[0][propertyName] + " and ";
        } else if (strType === "string") {
          strWhere += propertyName + "='" + this.selectedRowValues[0][propertyName] + "' and ";
        } else if (strType === "datetime") {
          strWhere += propertyName + "='" + this.selectedRowValues[0][propertyName] + "' and ";
        }
      }
    }
    strWhere = strWhere.substr(0, strWhere.length - 5);
    let strSql = "delete from " + tableName + strWhere;
    console.log(strSql);

    // /*
    axios.post("http://" + this.serviceIp + ":8090/rest/mysql/execute", {
        sql: strSql,
        pageRows: 0,
        pageNum: 0,
        tag: "test by K"
      },
      {
        headers: {  //头部参数
          'Content-Type': 'application/json'
        }
      })
      .then((response) => {
        this.setState({message: response.data.message});
        let datasource = JSON.parse(JSON.stringify(this.state.tableDatasource));
        let i = 0;
        for (let record of datasource) {
          if (record.key === this.selectedRowValues[0].key) {
            datasource.splice(i, 1);
            this.setState({tableDatasource: datasource});
            break
          }
          i++;
        }
      })
      .catch(function (error) {
        console.log(error);
      });
    // */
  }

  doInsert() {
    console.log("doInsert");

    console.log(this.domMain.offsetWidth, this.domMain.offsetHeight, this.domMain.offsetTop,
      this.domMain.offsetLeft,
      this.domMain.innerHeight);

    let style = {
      display: "grid",
      width: this.domMain.offsetWidth - 10,
      height: this.domMain.offsetHeight - 10,
      left: "5px",
      top: this.domMain.offsetTop + 5
    }

    let jsxDialog: any = [];

    for (let i = 0; i < this.state.tableColumns.length; i++) {
      let title = this.state.tableColumns[i].title;
      let comDynamic: any;
      let keyComDynamic = this.state.tableColumns[i].key;
      console.log(this.state.tableColumns[i].fieldType);
      let s = keyComDynamic;
      switch (this.state.tableColumns[i].fieldType) {
        case "INT":
          comDynamic = <InputNumber style={{width: "100%"}} key={keyComDynamic}
                                    onChange={(e) => this.onChangeInput(e, s, 'number')}/>
          break
        case "DATETIME":
          comDynamic = <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gridGap: "5px"}}>
            <DatePicker key={keyComDynamic} onChange={(e) => this.onChangeInput(e, s, 'date')}/>
            <TimePicker onChange={(e) => this.onChangeInput(e, s, 'time')}/>
          </div>
          break
        default:
          comDynamic = <Input key={keyComDynamic} onChange={(e) => this.onChangeInput(e, s, 'string')}/>
          break
      }
      let keyBoxField = "box_" + this.state.tableColumns[i].key;
      jsxDialog.push(<div key={keyBoxField} className={"BoxField"}>
        <div className="Title">{title}</div>
        <div className="Value">{comDynamic}</div>
      </div>)
    }

    this.setState({
      styleDialogDynamicInsert: style,
      jsxDialogDynamic: jsxDialog
    });
  }

  doInsertConfirm() {
    //console.log("insert into table", this.mapRecordValues);
    let tableName = this.state.tableName;
    let strColumns = "";
    let strValues = "";
    let strJs = "{key: " + (this.uniqueKey++) + ",";
    this.mapRecordValues.forEach(function (value, key) {
      //console.log(key, value);
      strColumns += key + ",";
      strJs += key + ":";
      switch (value.type) {
        case "number":
          strValues += value.value + ",";
          strJs += value.value + ",";
          break
        case "string":
          strValues += "'" + value.value + "',";
          strJs += "'" + value.value + "',";
          break
        case "datetime":
          strValues += "'" + value.value.date + " " + value.value.time + "',";
          strJs += "'" + value.value.date + " " + value.value.time + "',";
          break
      }

    });

    strColumns = strColumns.substr(0, strColumns.length - 1);
    strValues = strValues.substr(0, strValues.length - 1);
    strJs = strJs.substr(0, strJs.length - 1) + "}";

    let strSql = "insert into " + tableName + "(" + strColumns + ") values(" + strValues + ")";

    console.log(strJs);

    axios.post("http://" + this.serviceIp + ":8090/rest/mysql/execute", {
        sql: strSql,
        pageRows: 0,
        pageNum: 0,
        tag: "test by K"
      },
      {
        headers: {  //头部参数
          'Content-Type': 'application/json'
        }
      })
      .then((response) => {
        //let data = response;
        //console.log(data);
        let datasource = JSON.parse(JSON.stringify(this.state.tableDatasource));
        let value: any;
        eval("value = " + strJs);
        datasource.push(value);
        console.log(datasource);
        //todo::insert
        this.setState({tableDatasource: datasource});
      })
      .catch(function (error) {
        console.log(error);
      });

  }

  doInsertReset() {

  }

  doInsertClose() {
    let style = {
      display: "none"
    }
    this.setState({
      styleDialogDynamicInsert: style
    });
  }

  doUpdate() {
    let style = {
      display: "grid",
      width: this.domMain.offsetWidth - 10,
      height: this.domMain.offsetHeight - 10,
      left: "5px",
      top: this.domMain.offsetTop + 5
    }

    let jsxDialog: any = [];

    for (let i = 0; i < this.state.tableColumns.length; i++) {
      let title = this.state.tableColumns[i].title;
      let comDynamic: any;
      let keyComDynamic = this.state.tableColumns[i].key;
      console.log(this.state.tableColumns[i].fieldType);
      let s = keyComDynamic;
      switch (this.state.tableColumns[i].fieldType) {
        case "INT":
          comDynamic = <InputNumber style={{width: "100%"}}
                                    key={keyComDynamic}
                                    onChange={(e) => this.onChangeInput(e, s, 'number')}
                                    defaultValue={JSON.parse(JSON.stringify(this.selectedRowValues[0][title]))}/>
          break
        case "DATETIME":
          comDynamic = <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gridGap: "5px"}}>
            <DatePicker
              key={keyComDynamic}
              onChange={(e) => this.onChangeInput(e, s, 'date')}
              defaultValue={moment(JSON.parse(JSON.stringify(this.selectedRowValues[0][title])), 'yyyy-MM-DD HH:mm:ss')}/>
            <TimePicker
              onChange={(e) => this.onChangeInput(e, s, 'time')}
              defaultValue={moment(JSON.parse(JSON.stringify(this.selectedRowValues[0][title])), 'yyyy-MM-DD HH:mm:ss')}/>
          </div>
          break
        default:
          comDynamic = <Input
            key={keyComDynamic}
            onChange={(e) => this.onChangeInput(e, s, 'string')}
            defaultValue={JSON.parse(JSON.stringify(this.selectedRowValues[0][title]))}/>
          break
      }
      let keyBoxField = "box_" + this.state.tableColumns[i].key;
      jsxDialog.push(<div key={keyBoxField} className={"BoxField"}>
        <div className="Title">{title}</div>
        <div className="Value">{comDynamic}</div>
      </div>)
    }

    this.setState({
      styleDialogDynamicUpdate: style,
      jsxDialogDynamic: jsxDialog
    });
  }

  doUpdateConfirm() {
    let tableName = this.state.tableName;
    let strSql = "";

    if (this.mapRecordValues.size <= 0) {
      this.setState({message: "没有做任何更改"});
      return
    }

    let s = this.selectedRowValues[0];
    this.mapRecordValues.forEach(function (value, key) {
      strSql += key + "=";
      switch (value.type) {
        case "number":
          strSql += value.value + ",";
          break
        case "string":
          strSql += "'" + value.value + "',";
          break
        case "datetime":
          let strDate = value.value.date;
          let strTime = value.value.time;

          if (strDate === "") strDate = s[key].split(" ")[0];
          if (strTime === "") strTime = s[key].split(" ")[1];
          strSql += "'" + strDate + " " + strTime + "',";
          break
      }

    });

    let strWhere = " where ";
    for (let propertyName of Object.keys(this.selectedRowValues[0])) {
      if (propertyName !== 'key') {
        let strType = "string";
        for (let item of this.state.tableColumns) {
          if (item.title === propertyName) {
            if (item.fieldType === "INT") {
              strType = "number";
            } else if (item.fieldType === "VARCHAR") {
              strType = "string";
            } else if (item.fieldType === "DATETIME") {
              strType = "datetime";
            }
            break
          }
        }
        if (strType === "number") {
          strWhere += propertyName + "=" + this.selectedRowValues[0][propertyName] + " and ";
        } else if (strType === "string") {
          strWhere += propertyName + "='" + this.selectedRowValues[0][propertyName] + "' and ";
        } else if (strType === "datetime") {
          strWhere += propertyName + "='" + this.selectedRowValues[0][propertyName] + "' and ";
        }
      }
    }

    strWhere = strWhere.substr(0, strWhere.length - 5);
    strSql = strSql.substr(0, strSql.length - 1) + strWhere;
    strSql = "update " + tableName + " set " + strSql;
    console.log(strSql);

    axios.post("http://" + this.serviceIp + ":8090/rest/mysql/execute", {
        sql: strSql,
        pageRows: 0,
        pageNum: 0,
        tag: "test by K"
      },
      {
        headers: {  //头部参数
          'Content-Type': 'application/json'
        }
      })
      .then((response) => {
        this.setState({message: response.data.message});
        let datasource = JSON.parse(JSON.stringify(this.state.tableDatasource));
        for (let record of datasource) {
          if (record.key === this.selectedRowValues[0].key) {
            this.mapRecordValues.forEach(function (value, key) {
              console.log(key, value.value);
              if (value.type === "datetime") {
                record[key] = value.value.date + " " + value.value.time;
              } else {
                record[key] = value.value;
              }
            })
            this.setState({tableDatasource: datasource});
            break
          }
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  }

  doUpdateReset() {

  }

  doUpdateClose() {
    let style = {
      display: "none"
    }
    this.setState({
      styleDialogDynamicUpdate: style
    });
  }

  doRefresh() {
    //TODO::K::调用rest服务，获取数据
    axios.post("http://" + this.serviceIp + ":8090/rest/mysql/select", {
        sql: this.strSql,
        pageRows: 0,
        pageNum: 0,
        tag: "test by K"
      },
      {
        headers: {  //头部参数
          'Content-Type': 'application/json'
        }
      })
      .then((response) => {
        let data = response.data;

        let columns = new Array<any>();
        for (let i = 0; i < data.table.tableFields.length; i++) {
          columns.push({
            title: data.table.tableFields[i].fieldName,
            dataIndex: data.table.tableFields[i].fieldName,
            key: data.table.tableFields[i].fieldName,
            fieldType: data.table.tableFields[i].fieldType,
            render: (text: any) => <span style={{color: "blue"}}>{text}</span>
          });
        }

        let datasource = new Array<any>();
        for (let i = 0; i < data.records.length; i++) {
          let myValues = {key: i};
          for (let j = 0; j < columns.length; j++) {
            let jsStatement = "myValues." + columns[j].key + "= data.records[i].fieldValues[j]";
            eval(jsStatement);
          }
          datasource.push(myValues);
        }

        this.setState({
          code: data.code,
          message: data.message,
          tableName: data.table.tableName,
          tableFields: data.table.tableFields,
          tableRecords: data.records,
          tableColumns: columns,
          tableDatasource: datasource
        });
      })
      .catch(function (error) {
        console.log(error);
      });
  }

  onChangeInput(e: any, sender: string, type: string) {
    //console.log(e, sender);
    switch (type) {
      case 'number':
        if (!this.mapRecordValues.has(sender)) this.mapRecordValues.set(sender,
          {value: 0, type: "number", operator: "="});
        this.mapRecordValues.get(sender).value = e;
        break
      case 'string':
        if (!this.mapRecordValues.has(sender)) this.mapRecordValues.set(sender,
          {value: "", type: "string", operator: "like"});
        this.mapRecordValues.get(sender).value = e.target.value;
        break
      case 'date':
        if (!this.mapRecordValues.has(sender)) this.mapRecordValues.set(sender,
          {value: {date: "", time: ""}, type: "datetime", operator: ">="});
        this.mapRecordValues.get(sender).value.date = e.format("YYYY-MM-DD");
        break
      case 'time':
        if (!this.mapRecordValues.has(sender)) this.mapRecordValues.set(sender,
          {value: {date: "", time: ""}, type: "datetime", operator: ">="});
        this.mapRecordValues.get(sender).value.time = e.format("HH:mm:ss");
        break
    }
  }

  onChangeSelect(e: any, sender: string, type: string) {
    console.log(`selected ${e} - ${sender} - ${type}`);
    switch (type) {
      case 'number':
        if (!this.mapRecordValues.has(sender)) this.mapRecordValues.set(sender,
          {value: 0, type: "number", operator: "="});
        this.mapRecordValues.get(sender).operator = e;
        break
      case 'string':
        if (!this.mapRecordValues.has(sender)) this.mapRecordValues.set(sender,
          {value: "", type: "string", operator: "like"});
        this.mapRecordValues.get(sender).operator = e;
        break
      case 'date':
        if (!this.mapRecordValues.has(sender)) this.mapRecordValues.set(sender,
          {value: {date: "", time: ""}, type: "datetime", operator: ">="});
        this.mapRecordValues.get(sender).operator.date = e;
        break
      case 'time':
        if (!this.mapRecordValues.has(sender)) this.mapRecordValues.set(sender,
          {value: {date: "", time: ""}, type: "datetime", operator: ">="});
        this.mapRecordValues.get(sender).operator.time = e;
        break
    }
  }

  render() {
    return (
      <div className="OperationProduct">
        <div className="Main">
          <div className="BoxToolbar">
            <Select defaultValue="TAD_PRODUCT_INFO">
              <Select.Option value="TAD_PRODUCT_INFO">TAD_PRODUCT_INFO</Select.Option>
            </Select>
            <Button onClick={this.doQuery}>查询</Button>
            <Button onClick={this.doInsert}>增加</Button>
            <Button onClick={this.doUpdate}>修改</Button>
            <Button onClick={this.doDelete}>删除</Button>
            <Button onClick={this.doRefresh}>刷新</Button>
          </div>
          <Table size="small"
                 rowSelection={{type: "radio", ...this.rowSelection}}
                 dataSource={this.state.tableDatasource}
                 columns={this.state.tableColumns}/>
        </div>
        <div className="DialogDynamic"
             style={this.state.styleDialogDynamicInsert}>
          <div className="Box">
            <div className="BoxToolbar">
              <div className="BoxDialogTitle">新增记录窗口</div>
              <Button onClick={this.doInsertClose}>关闭</Button>
            </div>
            <div className="BoxFields">
              {this.state.jsxDialogDynamic}
            </div>
            <div className="BoxMessage">
              <div className="Message">提示：</div>
              <Button onClick={this.doInsertConfirm}>保存</Button>
              <Button onClick={this.doInsertReset}>重置</Button>
            </div>
          </div>
        </div>
        <div className="DialogDynamic"
             style={this.state.styleDialogDynamicUpdate}>
          <div className="Box">
            <div className="BoxToolbar">
              <div className="BoxDialogTitle">修改记录窗口</div>
              <Button onClick={this.doUpdateClose}>关闭</Button>
            </div>
            <div className="BoxFields">
              {this.state.jsxDialogDynamic}
            </div>
            <div className="BoxMessage">
              <div className="Message">提示：</div>
              <Button onClick={this.doUpdateConfirm}>保存</Button>
              <Button onClick={this.doUpdateReset}>重置</Button>
            </div>
          </div>
        </div>
        <div className="DialogDynamic"
             style={this.state.styleDialogDynamicQuery}>
          <div className="Box">
            <div className="BoxToolbar">
              <div className="BoxDialogTitle">查询记录窗口</div>
              <Button onClick={this.doQueryClose}>关闭</Button>
            </div>
            <div className="BoxFields">
              {this.state.jsxDialogDynamic}
            </div>
            <div className="BoxMessage">
              <div className="Message">提示：</div>
              <Button onClick={this.doQueryConfirm}>查询</Button>
              <Button onClick={this.doQueryReset}>重置</Button>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

interface IOperationProductProps {
  // TODO
}

interface IOperationProductState {
  code: number,
  message: string,
  tableName: string,
  tableFields: any,
  tableRecords: any,
  tableTotalRecords: number,
  tableTotalPages: number,
  tableCurrentPage: number,
  tableRowsPerPage: number,
  tableRecordSelected: any,
  tableUpdateSql: string,
  tableInsertSql: string,
  tableDeleteSql: string,
  tableDatasource: any[],
  tableColumns: any[],
  styleDialogDynamicInsert: any,
  styleDialogDynamicUpdate: any,
  styleDialogDynamicQuery: any,
  jsxDialogDynamic: any,
  isShownDialogDynamic: boolean,
  selectedRowKeys: any
}

interface IOperationProductSnapshot {
  // TODO
}