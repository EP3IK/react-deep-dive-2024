# How does `useState()` work internally in React?

## 1. 구조 파악

### 1-1. hook

```ts
{
  memoizedState: 1,
  baseState: 1,
  baseQueue: null,
  queue: {...},
  next: {...}
}
```

- mountState의 mountWorkInProgressHook에서 만들거나, updateState의 updateWorkInProgressHook에서 가져온다.
- Fiber.memoizedState에 저장된다.
- 하나의 fiber는 여러 개의 hook을 가질 수 있고 hook은 next로 체이닝된다.
  - 함수 컴포넌트 내부에 있는 useState의 개수만큼 가진다.

### 1-2. queue

```ts
{
  pending: {...},
  interleaved: null,
  lanes: 0,
  dispatch: f,
  lastRenderedReducer: f,
  lastRenderedState: 1,
}
```

- mountState에서 만든다.
- hook.queue에 저장된다.
- 하나의 hook은 하나의 queue를 가진다.

### 1-3. update

```ts
{
  action: f,
  eagerState: null,
  hasEagerState: false,
  lane: 4,
  next: {...}
}
```

- mountState의 dispatchSetState.bind() 함수에서 만든다.
  - update 객체가 만들어지는 시점은 dispatch 함수(setState)가 호출될 때이다.
- queue.pending에 저장된다.
  - 보통 enqueueConcurrentHookUpdate에서 concurrentQueues에 stash 해놓았다가 prepareFreshStack > finishQueueingConcurrentUpdates에서 꺼내서 저장한다.
- 하나의 queue는 여러 개의 update를 가질 수 있고 update는 next로 체이닝된다.
  - 렌더 단계에서 setState가 호출되는만큼 가진다.

## 2. 실행 순서

### 2.1. 최초 렌더

- 함수 컴포넌트의 useState가 호출되는 시점
- mountState
  - hook 객체를 만든다(mountWorkInProgressHook).
  - hook.memoizedState, hook.baseState에 초깃값을 할당한다.
  - queue 객체를 선언한다.
  - dispatchSetState.bind에 현재 fiber와 queue를 전달한 bound 함수를 queue.dispatch에 할당한다.
  - [hook.memoizedState, dispatch]를 반환한다.

### 2.2 setState

- 함수 컴포넌트의 setState(dispatcher)가 호출되는 시점
- dispatchSetState
  - update 객체를 만든다.
  - 렌더 단계에서 호출되었는지 확인한다.
    - 보통은 렌더 단계가 아닌 클릭했을 때(이벤트 핸들러 호출) 호출될 것이다.
    - 현재 fiber를 비교하는 방식으로 확인한다.
    - 만약 렌더 단계 호출이 맞으면 concurrentQueues에 stash하지 않고 바로 queue.pending에 update를 할당한다.
  - concurrentQueues에 update 객체를 stash하고(enqueueConcurrentHookUpdate) 이 배열에서 나중에 꺼내서 queue.pending에 저장한다.
  - Fiber에 해당 lane으로 업데이트를 스케줄링한다(scheduleUpdateOnFiber).

### 2.3 리렌더(가장 높은 우선순위)

- performSyncWorkOnRoot > renderRootSync > workLoopSync > performUnitOfWork(App fiber) > beginWork > updateFunctionComponent
- updateState > updateReducer
  - hook 객체를 가져온다(updateWorkInProgressHook).
  - queue.pending을 baseQueue에 할당하고 queue.pending은 제거한다.
  - baseQueue애 할당된 update 객체를 처음부터 순회한다.
    - 업데이트를 하지 않고 넘어갈지 확인한다.
      - isSubsetOfLanes(renderLanes, updateLane)
      - 현재 업데이트 단계에서 처리해야할 lane에 이 update 객체의 lane이 속하는지를 비교
    - Skip해야 하면,
      - newBaseQueueLast가 없으면 만들고 update 객체의 사본을 체이닝한다.
    - 업데이트를 해야 하면,
      - newBaseQueueLast가 있으면(Skip한 적이 있으면) 일단 체이닝한다.
        - 체이닝하지 않으면 다음 업데이트가 있을 때 연산이 잘못 될 수 있다.
      - EagerState 여부에 따라 값을 가져오든 연산을 하든 해서 newState에 할당한다.
    - 순회가 끝나고 업데이트된 newState가 hook.memoizedState와 같으면, bailout을 수행한다(markWorkInProgressReceivedUpdate).
    - hook.memoizedState를 업데이트하고 hook.baseQueue에 newBaseQueueLast를 할당한다.
    - [hook.memoizedState, dispatch]를 반환한다.

### 2.4 다음 우선순위 업데이트

- scheduleUpdateOnFiber로 여러 개의 lane에 대해서 업데이트가 스케줄링되어 있으면, 각 lane에 따라 순차적으로 업데이트를 수행한다.
- updateState > updateReducer
  - 처음 업데이트와 다른 점은, 이전에 쌓아놓은 baseQueue가 있어서 새로 만드는 작업을 하지 않는다는 것이다.

## 3.Bailout

### 3.1 updateState에서 bailout

- 렌더 단계에서 기존의 hook.memoizedState와 계산한 newState를 비교하여 같으면 bailout을 수행한다.
- didReceiveUpdate를 true로 만드는데 이게 어떤 영향을 미치는지는 추가 확인 필요

### 3.2 setState에서 early bailout

- Alternate fiber와 current fiber의 lane이 모두 없으면 bailout을 수행한다.
- 이전 단계에서,
  - current는 workInProgress이므로 작업 후에 lane을 날린다.
  - 값 변화가 없으면 current fiber의 lane을 날리고 이게 alternate가 된다.
- bailoutHooks가 호출되고 스케줄링이 되지 않아서 바로 넘어가는데, 정확한 과정은 추가 확인 필요
