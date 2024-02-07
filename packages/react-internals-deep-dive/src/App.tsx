import { useEffect, useState } from 'react';

function Link() {
  return <a href="https://jser.dev">jser.dev</a>;
}

function Button() {
  return <button>click me -</button>;
}

function Component() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setTimeout(() => {
      setCount((count) => count + 1);
    }, 2000);
  }, []);

  return (
    <div>
      <Button /> ({count % 2 === 0 ? <span>even</span> : <b>odd</b>})
    </div>
  );
}

export default function App() {
  return (
    <div>
      <Link />
      <br />
      <Component />
    </div>
  );
}
