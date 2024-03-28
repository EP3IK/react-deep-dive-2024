/* global React, ReactDOM */
/* eslint-disable react/prop-types */

function useEvent(event, handler, option = {}) {
  const refPrev = React.useRef();
  const attach = React.useCallback(
    (el) => {
      el.addEventListener(event, handler, option);
      refPrev.current = el;
    },
    [event, handler, option],
  );
  const detach = React.useCallback(
    (el) => {
      refPrev.current.removeEventListener(event, handler);
      refPrev.current = null;
    },
    [event, handler],
  );
  const ref = (el) => {
    if (el === null) {
      detach();
    } else {
      attach(el);
    }
  };
  return ref;
}

function App() {
  const useMergeRefs = (...refs) => {
    return React.useCallback((el) => {
      for (const ref of refs) {
        if ('current' in ref) {
          ref.current = el;
        } else if (typeof ref === 'function') {
          ref(el);
        } else {
          throw new Error('not ref');
        }
      }
    }, refs);
  };

  const onScroll = () => {};
  const [onClick, setOnClick] = React.useState(() => function oldOnClick() {});

  const refScroll = useEvent('scroll', onScroll, { passive: true });
  const refClick = useEvent('click', onClick);

  const mergedRefs = useMergeRefs(refScroll, refClick);

  return (
    <div
      ref={mergedRefs}
      onClick={() => setOnClick(() => function newOnClick() {})}
    >
      some content
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
