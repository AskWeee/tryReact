import React from 'react'
import ReactDom from 'react-dom'
import './OperationProduct.scss'
import axios from "axios";
import {Button, DatePicker, Input, InputNumber, Select, Table, TimePicker} from 'antd'
import moment from 'moment';

export default class OperationProduct extends React.PureComponent<IOperationProductProps, IOperationProductState> {
  gStrServiceIp = "10.50.10.12";
  gStrSql = "";
  gDomMain: any;
  gMapAntdSelectedRowValues = new Map(); // 存储当前表格选中行的记录值
  gIntDatabaseRecordKey = 999;
  gIntReactElementKey = 0;
  gArrSelectedRowValues = new Array<any>();
  gRowSelection = {
    onChange: (selectedRowKeys: React.Key[], selectedRows: any) => {
      let arrPropertyName = Object.keys(selectedRows[0]);
      let mapValues = new Map();
      for (let item of arrPropertyName) {
        mapValues.set(item, selectedRows[0][item])
      }

      this.gArrSelectedRowValues = selectedRows;
    },
    getCheckboxProps: (record: any) => ({
      disabled: record.product_id === '1',
      name: record.product_id
    })
  };
  gMapTables = new Map();

  constructor(props: IOperationProductProps) {
    super(props);
    this.state = {
      code: -1,
      message: '',
      tableNames: ["请选择数据库表"],
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
      tableFieldsWritable: new Array<string>(),
      antdTableColumns: new Array<any>(),
      antdTableDatasource: new Array<any>(),
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
    this.onChangeTableSelected = this.onChangeTableSelected.bind(this);
    this.doGetSchema = this.doGetSchema.bind(this);
    this.onChangeQueryFieldOperatorSelected = this.onChangeQueryFieldOperatorSelected.bind(this);

    this.doGetSchema();
  }

  doGetElementKey() {
    let key = this.gIntReactElementKey++;
    return key.toString();
  }

  doGetRecordKey() {
    return this.gIntDatabaseRecordKey++;
  }

  doGetSchema() {
    axios.post(
      "http://" + this.gStrServiceIp + ":8090/rest/mysql/schema",
      {
        sql: "",
        pageRows: 0,
        pageNum: 0,
        tag: "do get schema"
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }).then((response) => {
      let data = response.data;
      let columns = new Array<any>();
      let tableInfo = {
        table_name: {columnIndex: 0},
        field_name: {columnIndex: 0},
        field_key: {columnIndex: 0},
        field_type: {columnIndex: 0},
        field_length: {columnIndex: 0},
        field_nullable: {columnIndex: 0}
      }
      for (let i = 0; i < data.table.tableFields.length; i++) {
        let fieldName = data.table.tableFields[i].fieldName;
        columns.push(fieldName);

        switch (fieldName) {
          case "table_name":
            tableInfo.table_name.columnIndex = i;
            break
          case "field_name":
            tableInfo.field_name.columnIndex = i;
            break
          case "field_key":
            tableInfo.field_key.columnIndex = i;
            break
          case "field_type":
            tableInfo.field_type.columnIndex = i;
            break
          case "field_length":
            tableInfo.field_length.columnIndex = i;
            break
          case "field_nullable":
            tableInfo.field_nullable.columnIndex = i;
            break
        }
      }

      let datasource = new Array<any>();
      for (let i = 0; i < data.records.length; i++) {
        let v = {key: i};
        let tName = data.records[i].fieldValues[tableInfo.table_name.columnIndex].toLowerCase();
        let fName = data.records[i].fieldValues[tableInfo.field_name.columnIndex].toLowerCase();
        let fKey = data.records[i].fieldValues[tableInfo.field_key.columnIndex].toLowerCase();
        let fType = data.records[i].fieldValues[tableInfo.field_type.columnIndex].toLowerCase();
        let fLength = data.records[i].fieldValues[tableInfo.field_length.columnIndex];
        let fNullable = data.records[i].fieldValues[tableInfo.field_nullable.columnIndex].toLowerCase();
        let fWritable = "yes";
        if (!this.gMapTables.has(tName)) {
          this.gMapTables.set(tName, new Map());
          this.gMapTables.get(tName).set(fName, {
            "isPrimaryKey": fKey === "pri",
            "type": fType,
            "length": fLength,
            "isNullable": fNullable === "yes",
            "isWritable": fWritable === "yes"
          });
        } else {
          this.gMapTables.get(tName).set(fName, {
            "isPrimaryKey": fKey === "pri",
            "type": fType,
            "length": fLength,
            "isNullable": fNullable === "yes",
            "isWritable": fWritable === "yes"
          });
        }

        if (this.gMapTables.get(tName).get(fName).isPrimaryKey) this.gMapTables.get(tName).get(fName).isWritable = false;

        for (let j = 0; j < columns.length; j++) {
          Object.defineProperty(v, columns[j],
            {value: data.records[i].fieldValues[j], enumerable: true, writable: true});
        }
        datasource.push(v);
      }

      let arrTableNames = new Array<string>();
      this.gMapTables.forEach(function (value, key) {
        arrTableNames.push(key);
      });
      this.setState({tableNames: arrTableNames})
    }).catch(function (error) {
        console.log(error);
      });
  }

  doGetFieldsWritable(tableName: string) {
    let result = new Array<string>();

    (this.gMapTables.get(tableName) as Map<any,any>).forEach(function (value, key) {
      if (value.isWritable) result.push(key);
    });

    return result;
  }

  componentDidMount() {
    this.gDomMain = ReactDom.findDOMNode(this);
    // this.doRefresh()
  }

  doFilter() {

  }

  doQuery() {
    let style = {
      display: "grid",
      width: this.gDomMain.offsetWidth - 10,
      height: this.gDomMain.offsetHeight - 10,
      left: "5px",
      top: this.gDomMain.offsetTop + 5
    }

    let jsxDialog: any = [];

    for (let i = 0; i < this.state.antdTableColumns.length; i++) {
      let title = this.state.antdTableColumns[i].title;
      let comDynamic: any;
      let keyComDynamic = this.state.antdTableColumns[i].key;
      let s = keyComDynamic;
      let fieldType = this.state.antdTableColumns[i].fieldType;
      switch (fieldType) {
        case "int":
          comDynamic = <div style={{display: "grid", gridTemplateColumns: "auto 1fr", gridGap: "5px"}}>
            <Select defaultValue="greatEqual"
                    onChange={(e) => this.onChangeQueryFieldOperatorSelected(e, s, fieldType)}>
              <Select.Option value="equal">=</Select.Option>
              <Select.Option value="great">&gt;</Select.Option>
              <Select.Option value="less">&lt;</Select.Option>
              <Select.Option value="greatEqual">&gt;=</Select.Option>
              <Select.Option value="lessEqual">&lt;=</Select.Option>
              <Select.Option value="notEqual">!=</Select.Option>
            </Select>
            <InputNumber style={{width: "100%"}}
                         key={keyComDynamic}
                         onChange={(e) => this.onChangeInput(e, s, fieldType)}/>
          </div>
          break
        case "datetime":
          comDynamic = <div style={{display: "grid", gridTemplateColumns: "auto 1fr 1fr", gridGap: "5px"}}>
            <Select defaultValue="greatEqual"
                    onChange={(e) => this.onChangeQueryFieldOperatorSelected(e, s, fieldType)}>
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
                    onChange={(e) => this.onChangeQueryFieldOperatorSelected(e, s, fieldType)}>
              <Select.Option value="equal">=</Select.Option>
              <Select.Option value="like">like</Select.Option>
              <Select.Option value="notEqual">!=</Select.Option>
            </Select>
            <Input
              key={keyComDynamic}
              onChange={(e) => this.onChangeInput(e, s, fieldType)}/>
          </div>
          break
      }
      let keyBoxField = "box_" + this.state.antdTableColumns[i].key;
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

    if (this.gMapAntdSelectedRowValues.size <= 0) {
      this.setState({message: "没有做任何更改"});
      return
    }

    this.gMapAntdSelectedRowValues.forEach(function (value, key) {

      let operator = value.operator;
      console.log(value.operator);
      //todo::ooo
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
      strSql += key + operator;
      console.log(value.type);
      switch (value.type) {
        case "int":
          strSql += value.value + " and ";
          break
        case "varchar":
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

    this.gStrSql = strSql;

    // /*
    axios.post("http://" + this.gStrServiceIp + ":8090/rest/mysql/select", {
        sql: this.gStrSql,
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
            //let jsStatement = "myValues." + columns[j].key + "= data.records[i].fieldValues[j]";
            //eval(jsStatement);
            Object.defineProperty(myValues, columns[j].key,
              {value: data.records[i].fieldValues[j], enumerable: true, writable: true});

          }
          datasource.push(myValues);
        }

        this.setState({
          code: data.code,
          message: data.message,
          tableName: data.table.tableName,
          tableFields: data.table.tableFields,
          tableRecords: data.records,
          antdTableColumns: columns,
          antdTableDatasource: datasource
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
    for (let propertyName of Object.keys(this.gArrSelectedRowValues[0])) {
      if (propertyName !== 'key') {
        let fType = this.gMapTables.get(this.state.tableName).get(propertyName).type;

        if (fType === "int") {
          strWhere += propertyName + "=" + this.gArrSelectedRowValues[0][propertyName] + " and ";
        } else if (fType === "varchar") {
          strWhere += propertyName + "='" + this.gArrSelectedRowValues[0][propertyName] + "' and ";
        } else if (fType === "datetime") {
          strWhere += propertyName + "='" + this.gArrSelectedRowValues[0][propertyName] + "' and ";
        }
      }
    }
    strWhere = strWhere.substr(0, strWhere.length - 5);
    let strSql = "delete from " + tableName + strWhere;
    console.log(strSql);

    // /*
    axios.post("http://" + this.gStrServiceIp + ":8090/rest/mysql/execute", {
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
        let datasource = JSON.parse(JSON.stringify(this.state.antdTableDatasource));
        let i = 0;
        for (let record of datasource) {
          if (record.key === this.gArrSelectedRowValues[0].key) {
            datasource.splice(i, 1);
            this.setState({antdTableDatasource: datasource});
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
    let style = {
      display: "grid",
      width: this.gDomMain.offsetWidth - 10,
      height: this.gDomMain.offsetHeight - 10,
      left: "5px",
      top: this.gDomMain.offsetTop + 5
    }

    let jsxDialog: any = [];

    for (let i = 0; i < this.state.antdTableColumns.length; i++) {
      let title = this.state.antdTableColumns[i].title;
      let comDynamic: any;
      let keyComDynamic = this.state.antdTableColumns[i].key;
      let s = keyComDynamic;
      let fType = this.state.antdTableColumns[i].fieldType;
      switch (fType) {
        case "int":
          comDynamic = <InputNumber style={{width: "100%"}} key={keyComDynamic}
                                    onChange={(e) => this.onChangeInput(e, s, fType)}/>
          break
        case "datetime":
          comDynamic = <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gridGap: "5px"}}>
            <DatePicker key={keyComDynamic} onChange={(e) => this.onChangeInput(e, s, 'date')}/>
            <TimePicker onChange={(e) => this.onChangeInput(e, s, 'time')}/>
          </div>
          break
        default:
          comDynamic = <Input key={keyComDynamic} onChange={(e) => this.onChangeInput(e, s, fType)}/>
          break
      }
      let keyBoxField = "box_" + this.state.antdTableColumns[i].key;
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
    let tableName = this.state.tableName;
    let strColumns = "";
    let strValues = "";
    let objRecord = {key: (this.doGetRecordKey())};
    this.gMapAntdSelectedRowValues.forEach(function (value, key) {
      strColumns += key + ",";
      switch (value.type) {
        case "int":
          strValues += value.value + ",";
          Object.defineProperty(objRecord, key,
            {value: value.value, enumerable: true, writable: true});
          break
        case "varchar":
          strValues += "'" + value.value + "',";
          Object.defineProperty(objRecord, key,
            {value: value.value, enumerable: true, writable: true});
          break
        case "datetime":
          strValues += "'" + value.value.date + " " + value.value.time + "',";
          Object.defineProperty(objRecord, key,
            {value: (value.value.date + " " + value.value.time), enumerable: true, writable: true});
          break
      }

    });

    strColumns = strColumns.substr(0, strColumns.length - 1);
    strValues = strValues.substr(0, strValues.length - 1);

    let strSql = "insert into " + tableName + "(" + strColumns + ") values(" + strValues + ")";
    console.log(strSql);

    axios.post("http://" + this.gStrServiceIp + ":8090/rest/mysql/execute", {
        sql: strSql,
        pageRows: 0,
        pageNum: 0,
        tag: "test by K"
      },
      {
        headers: {  //头部参数
          'Content-Type': 'application/json'
        }
      }).then((response) => {
        let datasource = JSON.parse(JSON.stringify(this.state.antdTableDatasource));

        datasource.push(objRecord);

        this.setState({antdTableDatasource: datasource});
      }).catch(function (error) {
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
      width: this.gDomMain.offsetWidth - 10,
      height: this.gDomMain.offsetHeight - 10,
      left: "5px",
      top: this.gDomMain.offsetTop + 5
    }

    let jsxDialog: any = [];

    let arrFieldsWritable = this.doGetFieldsWritable(this.state.tableName);

    for (let i = 0; i < arrFieldsWritable.length; i++) {
      let title = arrFieldsWritable[i];
      let comDynamic: any;
      let keyComDynamic = this.doGetElementKey();
      let s = title;
      let fType = this.gMapTables.get(this.state.tableName).get(arrFieldsWritable[i]).type;

      switch (fType) {
        case "int":
          comDynamic = <InputNumber style={{width: "100%"}}
                                    key={keyComDynamic}
                                    onChange={(e) => this.onChangeInput(e, s, fType)}
                                    defaultValue={JSON.parse(JSON.stringify(this.gArrSelectedRowValues[0][title]))}/>
          break
        case "datetime":
          comDynamic = <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gridGap: "5px"}}>
            <DatePicker
              key={keyComDynamic}
              onChange={(e) => this.onChangeInput(e, s, 'date')}
              defaultValue={moment(JSON.parse(JSON.stringify(this.gArrSelectedRowValues[0][title])), 'yyyy-MM-DD HH:mm:ss')}/>
            <TimePicker
              onChange={(e) => this.onChangeInput(e, s, 'time')}
              defaultValue={moment(JSON.parse(JSON.stringify(this.gArrSelectedRowValues[0][title])), 'yyyy-MM-DD HH:mm:ss')}/>
          </div>
          break
        default:
          comDynamic = <Input
            key={keyComDynamic}
            onChange={(e) => this.onChangeInput(e, s, fType)}
            defaultValue={JSON.parse(JSON.stringify(this.gArrSelectedRowValues[0][title]))}/>
          break
      }
      let keyBoxField = "box_" + keyComDynamic;
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

    if (this.gMapAntdSelectedRowValues.size <= 0) {
      this.setState({message: "没有做任何更改"});
      return
    }

    let s = this.gArrSelectedRowValues[0];
    this.gMapAntdSelectedRowValues.forEach(function (value, key) {
      strSql += key + "=";
      switch (value.type) {
        case "int":
          strSql += value.value + ",";
          break
        case "varchar":
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
    for (let propertyName of Object.keys(this.gArrSelectedRowValues[0])) {
      if (propertyName !== 'key') {
        //let strType = "string";
        // for (let item of this.state.antdTableColumns) {
        //   if (item.title === propertyName) {
        //     if (item.fieldType === "int") {
        //       strType = "number";
        //     } else if (item.fieldType === "varchar") {
        //       strType = "string";
        //     } else if (item.fieldType === "datetime") {
        //       strType = "datetime";
        //     }
        //     break
        //   }
        // }
        let strType = this.gMapTables.get(this.state.tableName).get(propertyName).type;
        if (strType === "int") {
          let oTemp = " = ";
          let vTemp = this.gArrSelectedRowValues[0][propertyName];
          if (vTemp === "") { oTemp = " is "; vTemp = "null" };
          strWhere += propertyName + oTemp + vTemp + " and ";
        } else if (strType === "varchar") {
          strWhere += propertyName + "='" + this.gArrSelectedRowValues[0][propertyName] + "' and ";
        } else if (strType === "datetime") {
          strWhere += propertyName + "='" + this.gArrSelectedRowValues[0][propertyName] + "' and ";
        }
      }
    }

    strWhere = strWhere.substr(0, strWhere.length - 5);
    strSql = strSql.substr(0, strSql.length - 1) + strWhere;
    strSql = "update " + tableName + " set " + strSql;
    console.log(strSql);

    axios.post("http://" + this.gStrServiceIp + ":8090/rest/mysql/execute", {
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
        let datasource = JSON.parse(JSON.stringify(this.state.antdTableDatasource));
        for (let record of datasource) {
          if (record.key === this.gArrSelectedRowValues[0].key) {
            this.gMapAntdSelectedRowValues.forEach(function (value, key) {
              if (value.type === "datetime") {
                record[key] = value.value.date + " " + value.value.time;
              } else {
                record[key] = value.value;
              }
            })
            this.setState({antdTableDatasource: datasource});
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
    axios.post("http://" + this.gStrServiceIp + ":8090/rest/mysql/select", {
        sql: this.gStrSql,
        pageRows: 0,
        pageNum: 0,
        tag: "test by K"
      },
      {
        headers: {  //头部参数
          'Content-Type': 'application/json'
        }
      }).then((response) => {
        let data = response.data;

        let columns = new Array<any>();
        for (let i = 0; i < data.table.tableFields.length; i++) {
          columns.push({
            title: data.table.tableFields[i].fieldName.toLowerCase(),
            dataIndex: data.table.tableFields[i].fieldName.toLowerCase(),
            key: data.table.tableFields[i].fieldName.toLowerCase(),
            fieldType: data.table.tableFields[i].fieldType.toLowerCase(),
            render: (text: any) => <span style={{color: "blue"}}>{text}</span>
          });
        }

        let datasource = new Array<any>();
        for (let i = 0; i < data.records.length; i++) {
          let myValues = {key: i};
          for (let j = 0; j < columns.length; j++) {
            Object.defineProperty(myValues, columns[j].key,
              {value: data.records[i].fieldValues[j], enumerable: true, writable: true});
          }
          datasource.push(myValues);
        }

        this.setState({
          code: data.code,
          message: data.message,
          tableName: data.table.tableName,
          tableFields: data.table.tableFields,
          tableRecords: data.records,
          antdTableColumns: columns,
          antdTableDatasource: datasource
        });
      }).catch(function (error) {
        console.log(error);
      });
  }

  onChangeInput(e: any, sender: string, type: string) {
    switch (type) {
      case 'int':
        if (!this.gMapAntdSelectedRowValues.has(sender)) this.gMapAntdSelectedRowValues.set(sender,
          {value: 0, type: "int", operator: "="});
        this.gMapAntdSelectedRowValues.get(sender).value = e;
        break
      case 'varchar':
        if (!this.gMapAntdSelectedRowValues.has(sender)) this.gMapAntdSelectedRowValues.set(sender,
          {value: "", type: "varchar", operator: "like"});
        this.gMapAntdSelectedRowValues.get(sender).value = e.target.value;
        break
      case 'date':
        if (!this.gMapAntdSelectedRowValues.has(sender)) this.gMapAntdSelectedRowValues.set(sender,
          {value: {date: "", time: ""}, type: "datetime", operator: ">="});
        this.gMapAntdSelectedRowValues.get(sender).value.date = e.format("YYYY-MM-DD");
        break
      case 'time':
        if (!this.gMapAntdSelectedRowValues.has(sender)) this.gMapAntdSelectedRowValues.set(sender,
          {value: {date: "", time: ""}, type: "datetime", operator: ">="});
        this.gMapAntdSelectedRowValues.get(sender).value.time = e.format("HH:mm:ss");
        break
    }
  }

  onChangeSelect(e: any, sender: string, type: string) {
    switch (type) {
      case 'int':
        if (!this.gMapAntdSelectedRowValues.has(sender)) {
          this.gMapAntdSelectedRowValues.set(sender, {value: e, type: "int", operator: "greatEqual"});
        } else {
          this.gMapAntdSelectedRowValues.get(sender).value = e;
        }
        break
      case 'varchar':
        if (!this.gMapAntdSelectedRowValues.has(sender)) {
          this.gMapAntdSelectedRowValues.set(sender, {value: e, type: "varchar", operator: "like"});
        } else {
          this.gMapAntdSelectedRowValues.get(sender).value = e;
        }
        break
      case 'date':
        if (!this.gMapAntdSelectedRowValues.has(sender)) {
          this.gMapAntdSelectedRowValues.set(sender, {value: {date: moment(e, 'yyyy-MM-DD'), time: "00:00:00"}, type: "datetime", operator: "greatEqual"});
        } else {
          this.gMapAntdSelectedRowValues.get(sender).value.date = moment(e, 'yyyy-MM-DD');
        }
        break
      case 'time':
        if (!this.gMapAntdSelectedRowValues.has(sender)) {
          this.gMapAntdSelectedRowValues.set(sender, {value: {date: undefined, time: moment(e, 'HH:mm:ss')}, type: "datetime", operator: "greatEqual"});
        } else {
          this.gMapAntdSelectedRowValues.get(sender).value.time = moment(e, 'HH:mm:ss');
        }
        break
    }
  }

  onChangeTableSelected(e: any) {
    this.gStrSql = "select * from " + e;
    this.gMapAntdSelectedRowValues = new Map();
    this.setState({antdTableDatasource: [], antdTableColumns: []});
  }

  onChangeQueryFieldOperatorSelected(e: any, sender: string, type: string) {
    console.log(e, sender);
    switch (type) {
      case 'int':
        if (!this.gMapAntdSelectedRowValues.has(sender)) {
          this.gMapAntdSelectedRowValues.set(sender, {value: undefined, type: "int", operator: e});
        } else {
          this.gMapAntdSelectedRowValues.get(sender).operator = e;
        }
        break
      case 'varchar':
        if (!this.gMapAntdSelectedRowValues.has(sender)) {
          this.gMapAntdSelectedRowValues.set(sender, {value: undefined, type: "varchar", operator: e});
        } else {
          this.gMapAntdSelectedRowValues.get(sender).operator = e;
        }
        break
      case 'date':
        if (!this.gMapAntdSelectedRowValues.has(sender)) {
          this.gMapAntdSelectedRowValues.set(sender, {value: undefined, type: "datetime", operator: e});
        } else {
          this.gMapAntdSelectedRowValues.get(sender).operator.date = e;
        }
        break
      case 'time':
        if (!this.gMapAntdSelectedRowValues.has(sender)) {
          this.gMapAntdSelectedRowValues.set(sender, {value: undefined, type: "datetime", operator: e});
        } else {
          this.gMapAntdSelectedRowValues.get(sender).operator.time = e;
        }
        break
    }
  }

  render() {
    return (
      <div className="OperationProduct">
        <div className="Main">
          <div className="BoxToolbar">
            <Select defaultValue={this.state.tableNames[0]}
                    onChange={(e) => {
                      this.onChangeTableSelected(e)
                    }}>
              {this.state.tableNames.map((item, index) => {
                return <Select.Option key={index} value={item}>{item}</Select.Option>
              })}
            </Select>
            <Button onClick={this.doQuery}>查询</Button>
            <Button onClick={this.doInsert}>增加</Button>
            <Button onClick={this.doUpdate}>修改</Button>
            <Button onClick={this.doDelete}>删除</Button>
            <Button onClick={this.doRefresh}>刷新</Button>
          </div>
          <Table size="small"
                 rowSelection={{type: "radio", ...this.gRowSelection}}
                 dataSource={this.state.antdTableDatasource}
                 columns={this.state.antdTableColumns}/>
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
  tableNames: any[],
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
  antdTableDatasource: any[],
  antdTableColumns: any[],
  styleDialogDynamicInsert: any,
  styleDialogDynamicUpdate: any,
  styleDialogDynamicQuery: any,
  jsxDialogDynamic: any,
  isShownDialogDynamic: boolean,
  selectedRowKeys: any,
  tableFieldsWritable: string[]
}

interface IOperationProductSnapshot {
  // TODO
}