# How does `useRef()` work?

## 1. `useRef()` 사용법

1. `.current` 속성을 설정
   - 코드에서 `current` 속성을 할당하는 건 `useState()`와 같이 업데이트를 일으키지 않음.
2. DOM 요소에 `ref` 속성으로 사용

   ```tsx
   function Component() {
     const ref = useRef(null);
     return <div ref={ref} />;
   }
   ```

## 2. `useRef()` 동작

### 2.1. 초기 렌더: `mountRef()`

```tsx
function mountRef<T>(initialValue: T): {| current: T |} {
  const hook = mountWorkInProgressHook();
  const ref = { current: initialValue };
  hook.memoizedState = ref;
  return ref;
}
```

1. 새 hook 객체 생성: `mountWorkInProgressHook()`
2. `current` 속성이 있는 ref 객체 생성
3. Hook의 `memoizedState` 속성에 ref 할당

### 2.2. 리렌더: `updateRef()`

```tsx
function updateRef<T>(initialValue: T): {| current: T |} {
  const hook = updateWorkInProgressHook();
  return hook.memoizedState;
}
```

- Fiber에서 내부 커서를 가지고 hook 목록에 접근: `updateWorkInProgressHook()`
- Hook의 `memoizedState` 속성을 반환

## 3. `ref={ref}` 동작

### 3.1 DOM 요소에 ref 객체 붙이기

- Commit 단계(`commitRootImpl()`) > `commitLayoutEffectOnFiber()` > `safelyAttachRef()`

```tsx
function commitAttachRef(finishedWork: Fiber) {
  const ref = finishedWork.ref;
  if (ref !== null) {
    const instance = finishedWork.stateNode;
    let instanceToUse;
    switch (finishedWork.tag) {
      case HostComponent:
        instanceToUse = getPublicInstance(instance);
        break;
      default:
        instanceToUse = instance;
    }
    // Moved outside to ensure DCE works with this flag
    if (enableScopeAPI && finishedWork.tag === ScopeComponent) {
      instanceToUse = instance;
    }
    if (typeof ref === 'function') {
      let retVal;
      retVal = ref(instanceToUse);
    } else {
      ref.current = instanceToUse;
    }
  }
}
```

- Ref 객체를 붙이는 건 layout effect와 같은 단계에서 일어남.
- 여기서 콜백 ref를 쓰면 `useEffect()`보다 빠르게 콜백 함수를 실행: [React advanced patterns - Reusable behavior hooks through Ref](https://jser.dev/react/2022/02/18/reusable-behavior-hooks-through-ref)

> getPublicInstance 함수를 보면 그냥 instance를 반환한다. 도메인 스펙 때문에 만들어진 함수가 아닐까 추측.
> public instance는 무엇일까? internal instance가 그 반대에 있다는 걸 파악.
> 참고: https://legacy.reactjs.org/docs/implementation-notes.html

### 3.2 DOM 요소에서 ref 객체 떼내기

```tsx
function commitDetachRef(current: Fiber) {
  const currentRef = current.ref;
  if (currentRef !== null) {
    if (typeof currentRef === 'function') {
      currentRef(null);
    } else {
      currentRef.current = null;
    }
  }
}
```

- Commit 단계(`commitRootImpl()`) > `commitMutationEffectsOnFiber()` > `safelyDetachRef()`
- 붙이는 동작보다 먼저 일어남.

### 3.3. 붙일지 뗄지를 flag로 파악

```tsx
if (finishedWork.flags & Ref) {
  commitAttachRef(finishedWork);
}
if (flags & Ref) {
  const current = finishedWork.alternate;
  if (current !== null) {
    commitDetachRef(current);
  }
}
```

- 붙일 때에도 뗄 때에도 작업이 필요한지 여부를 동일한 `Ref` flag를 사용해서 파악
- `Ref` flag를 달아놓는 시점
  - `beginWork()`(`workInProgress.tag === HostComponent`(div)) > `updateHostComponent()` > `markRef()`(`reconcileChildren()` 직전)

```tsx
function markRef(current: Fiber | null, workInProgress: Fiber) {
  const ref = workInProgress.ref;
  if (
    (current === null && ref !== null) ||
    (current !== null && current.ref !== ref)
  ) {
    // Schedule a Ref effect
    workInProgress.flags |= Ref;
    if (enableSuspenseLayoutEffectSemantics) {
      workInProgress.flags |= RefStatic;
    }
  }
}
```

```tsx
function updateHostComponent(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
) {
  pushHostContext(workInProgress);
  if (current === null) {
    tryToClaimNextHydratableInstance(workInProgress);
  }
  const type = workInProgress.type;
  const nextProps = workInProgress.pendingProps;
  const prevProps = current !== null ? current.memoizedProps : null;
  let nextChildren = nextProps.children;
  const isDirectTextChild = shouldSetTextContent(type, nextProps);
  if (isDirectTextChild) {
    // We special case a direct text child of a host node. This is a common
    // case. We won't handle it as a reified child. We will instead handle
    // this in the host environment that also has access to this prop. That
    // avoids allocating another HostText fiber and traversing it.
    nextChildren = null;
  } else if (prevProps !== null && shouldSetTextContent(type, prevProps)) {
    // If we're switching from a direct text child to a normal child, or to
    // empty, we need to schedule the text content to be reset.
    workInProgress.flags |= ContentReset;
  }
  markRef(current, workInProgress);
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  return workInProgress.child;
}
```

## 4. 요약

1. 재조정(reconciliation)할 때, ref를 변경하는지 만드는지를 fiber에 flag로 표시
2. 커밋할 때, 리액트가 flag를 보고 ref를 떼거나 붙임.
3. `useRef()`는 ref 객체만 들고 있는 간단한 hook

## 5. 추가 조사

- 최신 main 브랜치에서는 `completeUnitOfWork()` 내부에 `markRef()`가 없다.
  > https://github.com/facebook/react/pull/28375
