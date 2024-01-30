# 7단계: 함수 컴포넌트

```jsx
/** @jsx Didact.createElement */
function App(props) {
  return <h1>Hi {props.name}</h1>;
}
const element = <App name="foo" />;
const container = document.getElementById('root');
Didact.render(element, container);
```

```js
function App(props) {
  return Didact.createElement('h1', null, 'Hi ', props.name);
}
const element = Didact.createElement(App, {
  name: 'foo',
});
```

함수 컴포넌트의 다른 점

- 함수 컴포넌트의 파이버는 DOM 요소가 없다.
- 자식 요소가 `props`에서 바로 나오지 않고 함수를 실행한 결과로 나온다.

파이버의 타입이 함수인지 확인해서 업데이트를 다른 방식으로 가져가야 한다.

- 기존: `updateHostComponent`
- 함수 컴포넌트: `updateFunctionComponent`

```js
function updateHostComponent(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  reconcileChildren(fiber, fiber.props.children);
}

function updateFunctionComponent(fiber) {
  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
}

function performUnitOfWork(fiber) {
  const isFunctionComponent = fiber.type instanceof Function;
  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
}
```

`commitWork` 함수에서 DOM이 없는 파이버에 대응하기 위해 두 가지를 변경해야 한다.

- DOM이 있는 파이버가 나올 때까지 파이버 트리에서 부모를 타고 올라간다.
- DOM을 제거할 때에도 DOM이 있을 때까지 자식을 타고 내려간다.

```js
function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child, domParent);
  }
}

function commitWork(fiber) {
  if (!fiber) {
    return;
  }

  let domParentFiber = fiber.parent;
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }
  const domParent = domParentFiber.dom;

  if (fiber.effectTag === 'PLACEMENT' && fiber.dom !== null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === 'DELETION') {
    commitDeletion(fiber, domParent);
  } else if (fiber.effectTag === 'UPDATE' && fiber.dom !== null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  }
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}
```
