# 8단계: 훅

```jsx
/** @jsx Didact.createElement */
function Counter() {
  const [state, setState] = Didact.useState(1);
  return <h1 onClick={() => setState((c) => c + 1)}>Count: {state}</h1>;
}
const element = <Counter />;
const container = document.getElementById('root');
Didact.render(element, container);
```

- `useState` 함수 안에서 사용할 전역 변수 초기화
  - `wipFiber`
- 같은 컴포넌트에서 여러 개의 `useState` 호출을 지원
  - `hooks`를 배열로 처리
  - `hookIndex`로 현재 훅 추적
- 이전 파이버에 훅이 있는지 여부로 이전 훅을 가져올지 초깃값을 적용할지 판단
  - `wipFiber.alternate.hooks[hookIndex]`
- 상태를 업데이트하는 `setState` 함수
  - `useState`에서 호출할 업데이트 액션을 큐에 쌓는다.
  - 새로운 렌더 단계를 시작하도록 설정한다.

```js
let wipFiber = null;
let hookIndex = null;

function useState(initial) {
  const oldHook = wipFiber.alternate?.hooks?.[hookIndex];
  const hook = {
    state: oldHook?.state ?? initial,
    queue: [],
  };

  const actions = oldHook?.queue ?? [];
  actions.forEach((action) => {
    hook.state = action(hook.state);
  });

  const setState = (action) => {
    hook.queue.push(action);
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot,
    };
    nextUnitOfWork = wipRoot;
    deletions = [];
  };

  wipFiber.hooks.push(hook);
  hookIndex++;
  return [hook.state, setState];
}

function updateFunctionComponent(fiber) {
  wipFiber = fiber;
  hookIndex = 0;
  wipFiber.hooks = [];
  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
}
```