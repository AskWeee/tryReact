import React from "react";
import {Select} from "antd";

export default class KSelect extends React.Component<any, any> {

  constructor(props: any) {
    super(props);

    this.state = {
      counter: 10,
      data:["kselect-01", "kselect-02"]
    }

    this.showComponent = this.showComponent.bind(this);
  }

  componentDidUpdate() {
    console.log("componentDidUpdate");
    this.render();
  }

  showComponent() {
    console.log("showComponent");
    this.setState({counter: 1000}, () => {
      console.log(this.state.counter);
    });

    let data = ["ok-01", "ok-02"];
    this.setState({
      data: data
    })
  }

  render() {
    return <div style={{display: "inline-block"}}>
      <Select style={{width: "100%"}} defaultValue="0">
        <Select.Option value="0">请选择</Select.Option>
        {this.state.data.map((item: any) => (
          <Select.Option key={item} value={item}>{item}</Select.Option>
        ))}
      </Select>
    </div>
  }
}
