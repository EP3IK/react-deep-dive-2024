# 5단계: 렌더와 커밋 단계

## 문제

- 모든 트리를 다 그리기 전에 브라우저가 이를 막고 할 일을 진행할 수 있다.
- 이때 사용자는 불완전한 UI를 보게 된다.

## 해결

- 각 파이버의 DOM 요소를 만들 때마다 `appendChild` 함수로 보여주지 않는다.
- 모든 작업이 끝났을 때 한번에 보여준다(커밋).

```js
let nextUnitOfWork = null;
let wipRoot = null;

function commitRoot() {
  commitWork(wipRoot.child);
  wipRoot = null;
}

function commitWork(fiber) {
  if (!fiber) {
    return;
  }
  const domParent = fiber.parent.dom;
  domParent.appendChild(fiber.dom);
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
  };
  nextUnitOfWork = wipRoot;
}

function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  requestIdleCallback(workLoop);
}
```
