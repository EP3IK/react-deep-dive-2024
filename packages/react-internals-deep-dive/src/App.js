/* global React, ReactDOM */
/* eslint-disable react/prop-types */

const Context = React.createContext("123");
const Context2 = React.createContext("456");

function Component1() {
  return <Component2 />;
}

function Component2() {
  const value = React.useContext(Context)
  const value2 = React.useContext(Context2)

  return <div>{value} + {value2}</div>;

  // return <Context.Consumer>
  //   {(value) => value}
  // </Context.Consumer>;
}

function App() {
  const [jser, setJser] = React.useState("JSer")

  return (
    <Context2.Provider value="JSer2">
      <Context.Provider value={jser}>
        <Component1 />
      </Context.Provider>
      <button onClick={() => setJser('JSer3')}>setJser</button>
    </Context2.Provider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
