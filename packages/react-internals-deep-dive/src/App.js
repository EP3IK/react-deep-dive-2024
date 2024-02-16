/* global React, ReactDOM */
/* eslint-disable react/prop-types */

function Child({ count }) {
  React.useEffect(() => {
    console.log(5);
    return () => {
      console.log(6);
    };
  }, [count]);

  return null;
}

function App() {
  const [count, setCount] = React.useState(1);
  console.log(1);
  React.useEffect(() => {
    console.log(2);
    return () => {
      console.log(3);
    };
  }, [count]);

  React.useEffect(() => {
    console.log(4);
    setCount((count) => count + 1);
  }, []);
  return <Child count={count} />;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
