/* global React, ReactDOM */
/* eslint-disable react/prop-types */

// function Child({ count }) {
//   console.log(7);
//   React.useEffect(() => {
//     console.log(5);
//     return () => {
//       console.log(6);
//     };
//   }, [count]);

//   return null;
// }

// function App() {
//   const [count, setCount] = React.useState(1);
//   console.log(1);
//   debugger;
//   React.useEffect(() => {
//     console.log(2);
//     return () => {
//       console.log(3);
//     };
//   }, [count]);

//   React.useEffect(() => {
//     console.log(4);
//     setCount((count) => count + 1);
//   }, []);
//   return <Child count={count} />;
// }

const App = () => {
  const [counter, setCounter] = React.useState(0);

  React.useEffect(function firstEffectSetup() {
    console.log('first setup');
  });

  React.useEffect(
    function secondEffectFunction() {
      console.log('second setup', { counter });

      return function secondEffectCleanup() {
        console.log('second cleanup');
      };
    },
    [counter],
  );

  return (
    <button
      onClick={() => {
        setCounter(counter + 1);
      }}
    >
      {counter}
    </button>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
