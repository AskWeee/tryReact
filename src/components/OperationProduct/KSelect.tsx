import React from "react";
import {Select} from "antd";

export default class KSelect extends React.Component<any, any> {

  constructor(props: any) {
    super(props);

    this.state = {
      counter: 10
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
  }

  render() {
    return <div style={{border: "1px solid red", padding: "5px"}}>
      <Select defaultValue="0">
        <Select.Option key="1" value="0">00000</Select.Option>
      </Select>
    </div>
  }
}
