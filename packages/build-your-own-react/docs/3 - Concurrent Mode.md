# 3단계: 동시 모드

## 문제

- 기존의 재귀 호출 렌더 방식
  - 요소 트리의 덩치가 커지면 메인 쓰레드를 막을 수 있다.

## 해결

- 렌더링을 작은 유닛으로 쪼갠다.
- 각 유닛이 끝날 때마다 브라우저에서 우선 할 일이 있으면 렌더링을 끊을 수 있게 한다.
- [`requestIdleCallback`](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback)
- 실제 리액트는 [scheduler 패키지](https://github.com/facebook/react/tree/master/packages/scheduler)를 쓴다.

```js
let nextUnitOfWork = null;

function performUnitOfWork(nextUnitOfWork) {
  // TODO
}

function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }
  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);
```
