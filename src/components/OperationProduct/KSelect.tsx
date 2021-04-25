import React from "react";

export default class KSelect extends React.Component<any, any> {

  constructor(props: any) {
    super(props);

    this.state = {
      counter: 10
    }

    this.showComponent = this.showComponent.bind(this);
  }

  componentDidUpdate() {
    console.log("wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww");
    //this.forceUpdate();
  }
  showComponent() {
    this.setState({counter: 1000}, () => {
      console.log(this.state.counter);
      //this.forceUpdate();
    });
  }

  render() {
    return <div>{this.state.counter}</div>
  }
}
