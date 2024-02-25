# Initial Mount, how does it work?

## 요약

### 파이버 구조

- 앱 상태를 내부적으로 표현하는 형태
- 트리 구조

1. FiberRootNode
   - 파이버 계의 루트
   - `current` 속성 값이 실제 전체 파이버 트리를 가리킨다.
   - 리렌더(업데이트)가 발생하면 파이버 트리가 새로 만들어진 다음에 `current`가 새로운 HostRoot를 향하게 한다.
2. FiberNode
   1. `tag`
      - 노드의 타입
      - FunctionComponent, HostRoot, ContextConsumer, MemoComponent, SuspenseComponent 등이 여기에 해당
   2. `stateNode`
      - HostComponent는 이 속성의 값이 여기에 해당하는 DOM을 가리킨다.
   3. `child`, `sibling`, `return`
      - 이 속성으로 연결되는 관계로 트리 구조가 만들어진다.
   4. `elementType`
      - FC 또는 고유 HTML 태그
   5. `flags`
      - 커밋 단계에서 어떤 종류의 업데이트를 하는지
   6. `lanes`
      - 업데이트 대기 우선순위
   7. `memoizedState`
      - FunctionComponent는 이 속성의 값이 훅을 가리킨다.

### 최초 마운트 디버깅 - https://xgm29g.csb.app/

1. 트리거 단계
   1. `createRoot` 내부에서 `createContainer`가 FiberRootNode를 만든다.
   2. `createFiberRoot` 내부에서 `createHostRootFiber`가 HostRoot를 만들고 FiberRootNode의 current에 연결된다.
   3. `root.render()`가 HostRoot에 업데이트를 스케줄링을 걸어놓고, 자식 요소는 업데이트 payload에 저장된다.
2. 렌더 단계
   1. `performConcurrentWorkOnRoot`
      - 최초 마운트이든 리렌더이든 작업의 시작을 이 함수로부터 한다.
      - 함수 이름에는 concurrent(동시, 즉 비동기)가 있지만 특정 상황에서는 동기적으로 동작하게 되어있다.
        - BlockingLane: 우선순위(lane)가 다른 동작을 막고 제쳐두고(blocking) 해야하는.
        - 최초 마운트의 DefaultLane은 blocking lane이라서 작업이 동기적으로 진행된다.
   2. `renderRootSync`
      - `workLoopSync`를 while 루프 안에서 호출한다.
      - `workLoopSync`는 workInProgress가 존재하면 계속 `performUnitOfWork`를 호출하는 구조이다.
      - wip: 현재 시점의 파이버가 `current`라면, 업데이트를 위해서 새로 만들고 있는 파이버가 `workInProgress`이다. 즉, `current`(진)
   3. `performUnitOfWork`
      - 단일 FiberNode를 가지고 작업한다.
        - 순회 우선순위: child > sibling > return
      - 내부의 `beginWork`가 진짜 렌더 작업을 진행한다.
        - current 유무(=== !최초 마운트 여부), workInProgress 파이버의 tag 값에 따라서 분기 처리
   4. `prepareFreshStack`
      - `renderRootSync` 내부에서 `workLoopSync`를 돌기 전에 호출
      - 새로 렌더를 시작해야 할 때 기존 HostRoot를 가지고 workInProgress를 만든다.
   5. `updateHostRoot`
      - HostRoot를 가지고 `beginWork`를 진행할 때 실행
      - `processUpdateQueue`를 거치면 workInProgress에 자식 요소를 포함해서 업데이트를 하고자 하는 정보가 연결되는 것으로 보인다.
      - workInProgress는 넣을 자식은 있다고 해놨지만 아직 자식이 있지는 않은 상태?
      - `reconcileChildren`를 호출해서 자식을 붙여준다.
      - 마지막으로 자식을 반환하여 자식 파이버가 `workLoopSync`를 돌게 된다(파이버 순회).
   6. `reconcileChildren`
      - 최초 마운트 여부를 보고 `mountChildFibers`, `reconcileChildFibers` 중 하나를 호출하여 파이버의 child 속성에 붙인다.
   7. `mountChildFibers` vs `reconcileChildFibers`
      - `shouldTrackSideEffects`가 true이면 reconcile, false이면 mount. - DOM 삽입 관련 플래그 값
        = `reconcileChildFibersImpl`은 `place~` 함수와 `reconcile~` 함수 조합으로 되어있다. - `reconcile~`로 변경점을 찾고 `place~`로 DOM에 파이버가 삽입되어야 하는 것을 표시
   8. `reconcileSingleElement`
      - 최초 마운트이기 때문에 child가 있는 경우는 넘긴다.
      - 새로운 FiberNode를 만든다.
      - 커스텀 컴포넌트에서 만들면 tag는 FunctionComponent가 아닌 IndeterminateComponent이다(아직 렌더되지 않아서?).
   9. `placeSingleChild`
      - `shouldTrackSideEffects`가 true이면 자식 파이버의 flags에 PLACEMENT로 표기한다.
   10. `mountIndeterminateComponent`
       - HostRoot의 자식인 <App />이 `beginWork`를 타면, tag 조건 분기로 이 함수가 호출된다.
       - `renderWithHooks` 함수가 FC를 호출해서 자식 요소를 반환
       - 렌더가 되었기 때문에 tag를 맞게 변경한다.
   11. `updateHostComponent`
       - <App />은 <div />를 반환하기 때문에 조건 분기로 이 함수가 호출된다.
   12. `updateHostText`
   13. `completeWork`
       - Sibling이 `beginWork`에 들어가기 전에 실행된다.
       - 이때 실제 DOM이 생성된다.
       - <button />은 자식이 배열이기 때문에 `beginWork`를 태워서 HostText 분기에서 새로운 텍스트 노드를 만든다.
       - <a />는 내부 값이 단일 텍스트여서 HostComponent 분기의 `finalizeInitialChildren`에서 children 속성으로 textContent를 설정한다.
3. 커밋 단계
   - 현재 상태
     1. wip 버전의 파이버 트리 완성
     2. DOM도 생성 완료
     3. DOM 변경이 필요한 파이버에 flag가 설정되어있음
   1. `commitMutationEffects`
      - DOM 변경을 담당
   2. `commitReconciliationEffects`
      - Flag를 PLACEMENT와 비교해서 DOM 삽입을 담당
   3. `commitPlacement`

## 회고

- 내부 상태 값을 변경하는 용도로 비트 연산을 활용하고 있는 점이 눈에 들어왔다.
- <App /> 구조가 최대한 다양하게 `beginWork` 분기 처리를 할 수 있게 된 점은 좋았다.
- 딥 다이브 특성상 흐름이 짧지가 않아서, 시간을 더 들여 디버깅을 반복해서 익혀야 할 것 같다.
