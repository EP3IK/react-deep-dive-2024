# How does `useEffect()` work internally in React?

## 또다시, 거꾸로

### 문제부터

```jsx
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
```

`console.log`가 찍히는 순서는 "1 5 2 4 1 6 3 5 2"이다.

첫 4개가 "1 5 2 4"인 것은 리액트 내부를 보지 않아도 알 수 있는 기본적인 내용이다.

- 그 다음에 "1"이 오는 건 `App` 함수 실행은 렌더 단계이고 훅이 호출되는 것은 렌더가 모두 끝난 다음 커밋 단계이기 때문이다.
- 다음에 cleanup "6 3"이 오고 다시 setup "5 2"가 오는데, 훅이 호출되는 것은 queue와 같은 순서로 된다는 설명이 있었다.
  - 커밋 단계에서 어떻게 cleanup 코드가 setup 코드보다 먼저 큐에 들어가게 되는 걸까?
  - 애초에 `count`가 바뀔 때 이 훅들이 어떻게 의존하는지를 알고 큐에 들어갈까?
  - 왜 Child 컴포넌트의 훅이 App 컴포넌트의 훅보다 먼저 큐에 들어갈까?

### 요약

1. `useEffect()`는 이펙트 객체를 만들어서 파이버에 저장한다.
   - 이펙트는 실행해야 하는지를 가리키는 `tag` 값이 있다.
   - 이펙트는 `useEffect()`의 첫 번째 매개변수로 전달하는 `create()` 함수가 있다.
   - 이펙트는 `create()`를 호출할 때 cleanup인 `destroy()` 함수가 있다.
2. `useEffect()`는 매번 이펙트 객체를 만들기는 하지만 의존성 배열에 변경이 있을 때 다른 `tag`를 붙인다.
3. Host DOM에 업데이트를 커밋할 때 `tag`를 기반으로 모든 이펙트를 다시 실행하는 작업이 다음 틱에 예약된다.
   - 자식 컴포넌트의 이펙트를 부모보다 먼저 실행한다.
   - Cleanup 함수를 setup 함수보다 먼저 실행한다.

## `useEffect()` in initial mount

- `mountEffect()`
  - 최초 마운트 시 `useEffect()`가 실행하는 함수
- `PassiveEffect`
  - 레이아웃 이펙트와의 차이를 내는 플래그
- `pushEffect()`
  - 이펙트 객체를 만드는 함수
  - 이펙트 객체의 next 속성은 한 컴포넌트 내부에 여러 개의 `useEffect()`가 있을 경우 그 다음 이펙트 객체를 가리키기 때문에 이펙트 객체는 연결 리스트 형태이다.
  - 컴포넌트 내 첫 번째 `useEffect()`에서는,
    - 함수 컴포넌트 파이버에 updateQueue가 없기 때문에 큐를 새로 생성한다.
    - 큐의 lastEffect에 방금 전에 만든 자기자신 이펙트 객체를 넣는다.
    - 연결 리스트에 객체가 하나뿐이라서 next에 자기자신을 연결한다.
  - 그 이후 `useEffect()`에서는,
    - 큐를 가져와서 이펙트 객체를 연결 리스트에 이어 붙인다.
    - lastEffect => 자기자신 => firstEffect

## `useEffect()` in re-render

- `updateEffect()`
  - 리렌더 시 `useEffect()`가 실행하는 함수
    > 최초 마운트인지 리렌더인지 어떻게 알고?
  - 훅을 가져와서 memoizedState에 담긴 이펙트 객체의 의존성 배열과 업데이트된 의존성 배열을 비교한다.
    > 최초 마운트 단계에서 훅을 어떻게 저장하고 리렌더 단계에서 어떻게 가져오지?
  - 그 다음에 업데이트된 의존성 배열을 가지고 이펙트 객체를 새로 만든다.
- `areHookInputsEqual()`
  ```ts
  function areHookInputsEqual(
    nextDeps: Array<mixed>,
    prevDeps: Array<mixed> | null,
  ): boolean {
    // ...생략
    for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
      if (is(nextDeps[i], prevDeps[i])) {
        continue;
      }
      return false;
    }
    return true;
  }
  ```
  - 의존성 배열을 비교하는 함수
  - `is(nextDeps[i], prevDeps[i])`
    - 배열의 각 요소를 [`Object.is()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is)로 비교한다.
- `HookHasEffect`
  - 의존성 배열이 같든 다르든 이벤트 객체는 새로 만들기는 한다.
  - 의존성 배열이 같으면 이 플래그를 적용하지 않고, 다르면 이 플래그를 적용한다.

## When and how does effects get run and cleaned up?

### flushing of passive effects are triggered in `commitRoot()`

- Host DOM에 변경사항을 반영하는 커밋 단계에서 이펙트를 실행한다.

### `flushPassiveEffects()`

- 언마운트 이펙트부터 실행하고, 그 다음에 마운트 이펙트를 실행한다.

### `commitPassiveUnmountEffects(finishedWork: Fiber)`

- `commitPassiveUnmountOnFiber(finishedWork: Fiber)`
  - 실제로 파이버를 순회하면서 이펙트를 실행하는 함수
  - `recursivelyTraversePassiveUnmountEffects(finishedWork: Fiber)`로 먼저 자식의 이펙트를 실행한다.
  - 자식의 이펙트를 모두 실행한 다음 자기자신의 이펙트를 실행한다.
- `recursivelyTraversePassiveUnmountEffects(finishedWork: Fiber)`
  - 자식 파이버를 가져와서 모든 sibling에 대해서 `commitPassiveUnmountOnFiber(child)`를 호출하는 함수
- `commitHookEffectListUnmount(flags, finishedWork, nearestMountedAncestor)`
  - 파이버의 `updateQueue`에서 `firstEffect`를 꺼내서 `tag`를 보고 변경이 있는지(`HookHasEffect`) 판단한다.
  - 변경이 있으면 cleanup 함수(`effect.inst.destroy`)를 호출한다.
    > inst가 무슨 뜻이지?
  - 연결 리스트를 따라 이펙트 객체를 순회한다.

### `commitPassiveMountEffects()`

- `commitPassiveMountOnFiber(finishedRoot, finishedWork, committedLanes, committedTransitions)`
- `recursivelyTraversePassiveMountEffects(root, parentFiber, committedLanes, committedTransitions)`
  > 2번째 매개변수 말고 나머지는 왜 있는 거지?
- `commitHookEffectListMount(flags, finishedWork)`
  - 변경이 있으면 setup 함수(`effect.create`)를 호출한다.
  - 이때 반환하는 cleanup 함수를 `effect.inst`에 보관한다.

## 궁금한 점 정리

### 최초 마운트인지 리렌더인지 어떻게 알고?

- `useEffect` 함수를 `dispatcher`에서 꺼내오는데, 최초 마운트(mount)이냐 리렌더(update)이냐에 따라서 `dispatcher`가 다른 객체를 가리키는 것으로 보인다.

### 최초 마운트 단계에서 훅을 어떻게 저장하고 리렌더 단계에서 어떻게 가져오지?

- 렌더 단계의 현재 컴포넌트 함수 실행 중 `useEffect()`의 `pushEffect()`에서 현재 파이버의 `updateQueue` 속성에 큐를 저장한다.
- 리렌더할 때에는 파이버의 접근 중이니 `updateQueue`를 들여다보면 이펙트 객체가 다 있다.

### inst가 무슨 뜻이지?

- 인스턴스(instance)를 의미하는 듯하다.
