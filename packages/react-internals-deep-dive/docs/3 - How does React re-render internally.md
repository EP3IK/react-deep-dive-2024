# How does React re-render internally?

## 요약부터

### 1. 초기 마운트 상태

![1](https://jser.dev/static/rerender/1.avif)

- 정말로 맨 처음의 HostRoot FiberNode는 자식이 없다.
- 초기 마운트 과정에서 새로운 HostRoot FiberNode를 만들고 그 아래에 App을 포함해서 자식 FiberNode를 만든다.
- 다 되면 커밋 과정에서 DOM을 컨테이너와 연결하고 current를 새 HostRoot와 연결한 것까지가 이미지의 상태.

### 2. lanes & childLanes

![2](https://jser.dev/static/rerender/2.avif)

- 변경이 발생하면 각 FiberNode 트리를 타고 내려오면서 FiberNode 본인이 변경점이 있는지(lane), 그리고 내 자식 FiberNode가 변경점이 있는지(childLane)를 체크하고 기록한다.
- 예시에서는 Component에서 setCount로 상태가 변경되었기 때문에, Component에 lane이 1로 처리, Component의 상위 FiberNode인 div, App, HostRoot는 childLane이 1로 처리된다.

### 3. 새 HostRoot FiberNode 생성

![3](https://jser.dev/static/rerender/3.avif)

### 4. WIP

![4](https://jser.dev/static/rerender/4.avif)

- 새 HostRoot는 앞으로 작업을 진행해야 할 workInProgress FiberNode이다.

### 5. HostRoot

![5](https://jser.dev/static/rerender/5.avif)

- Child ➡️ Sibling ➡️ Return 순으로 FiberNode 트리 순회를 시작한다.
- HostRoot는 직접 변경되지 않기 때문에 자식 App으로 간다.

### 6. App

![6](https://jser.dev/static/rerender/6.avif)

- App도 직접 변경되지 않기 때문에 자식 div로 간다.

### 7. div

![7](https://jser.dev/static/rerender/7.avif)

- div도 직접 변경되지 않기 때문에 자식 Link로 간다.

### 8. Link

![8](https://jser.dev/static/rerender/8.avif)

- Link는 lane, childLane 모두 0이다. 자식 또한 변경점이 없다는 걸 알기 때문에 child a를 건너뛰고, sibling br로 간다.

### 9. br

![9](https://jser.dev/static/rerender/9.avif)

- Link는 더이상 볼 일이 없기 때문에 완료 처리되었다.
- br 또한 lane, childLane 모두 0이므로 sibling인 Component로 간다.

### 10. Component 확인

![10](https://jser.dev/static/rerender/10.avif)

- br은 더이상 볼 일이 없기 때문에 완료 처리되었다.
- Component는 직접 변경된다.

### 11. Component

![11](https://jser.dev/static/rerender/11.avif)

- 앞선 FiberNode는 전부 변경이 없다는 이유로 이전의 것을 갖다 쓰고 건너뛰었다.
- Component는 변경이 있기 때문에 본격적으로 리렌더를 시작한다.
- 자식 FiberNode div를 만들고 div로 넘어간다.

### 12. div

![12](https://jser.dev/static/rerender/12.avif)

- workInProgress의 div는 current의 div와 같지 않다.
- props change라는 표현은 각 div가 가지는 속성 객체(props)가 다른 레퍼런스를 향하고 있어 동일하지 않다는 것을 의미하는 듯하다(새로 만들었으니까).

### 13. div의 자식 비교

![13](https://jser.dev/static/rerender/13.avif)

- div의 자식 FiberNode 배열을 만들어서 비교한다.
- count 값이 홀짝에 따라서 span 요소 또는 b 요소를 렌더하도록 코드가 작성되어 있다.
- span을 b로 바꾸어야 하기 때문에 div FiberNode에 current의 span FiberNode를 지워야 한다고 기록하고, b FiberNode에는 새로 배치해야 한다고 기록한다.
- 자식 button으로 넘어간다.

### 14. button

![14](https://jser.dev/static/rerender/14.avif)

- button도 div와 마찬가지로 새로 만들어지기 때문에 current의 button과 props가 같지 않다.

### 15. "click me - "

![15](https://jser.dev/static/rerender/15.avif)

- 이 문자열은 bail out 된다고 했는데, 단순 textNode는 문자열 비교 후 같으면 넘어갈 수 있는듯하다.

### 16. "1"

![16](https://jser.dev/static/rerender/16.avif)

- 앞선 textNode는 완료되었다.
- 이 textNode는 current에서 해당 자리에 있는 것과 문자열이 다르기 때문에 업데이트하는 것으로 기록한다.

### 17. 다시 button

![17](https://jser.dev/static/rerender/17.avif)

- Child, sibling 순회가 끝나고 return인 button으로 다시 올라왔다.
- button은 자식이 모두 처리되었기 때문에 완료되고 sibling으로 넘어간다.
- 추가로 button을 업데이트해야 하는 것으로 기록한다.

### 18. " ("

![18](https://jser.dev/static/rerender/18.avif)

- 15와 동일한 흐름으로 bail out 된다.

### 19. b

![19](https://jser.dev/static/rerender/19.avif)

- b는 배치되어야 하는 완전히 새로운 요소이다.

### 20. ")"

![20](https://jser.dev/static/rerender/20.avif)

- 그래서 b의 DOM을 새로 만들고 완료되었다.
- ")"는 15, 18과 동일한 흐름으로 bail out 된다.

### 21. 다시 div

![21](https://jser.dev/static/rerender/21.avif)

- ")"는 완료되고 return인 div로 돌아와서 div도 완료된다.

### 22. 다시 Component

![22](https://jser.dev/static/rerender/22.avif)

- Return인 Component로 돌아와서 완료된다.

### 23. 다시 div

![23](https://jser.dev/static/rerender/23.avif)

- Return인 div로 돌아와서 완료된다.

### 24. 다시 App

![24](https://jser.dev/static/rerender/24.avif)

- Return인 App으로 돌아와서 완료된다.

### 25. 다시 HostRoot

![25](https://jser.dev/static/rerender/25.avif)

- Return인 HostRoot로 돌아와서 완료된다.

### 26. 커밋 단계: span 제거

![26](https://jser.dev/static/rerender/26.avif)

- 렌더 단계가 끝나고 커밋 단계에 들어선다.
- FiberNode 트리를 돌면서 첫 번째로 만나는 변경 기록은 Component의 자식 div에 있다.
- span 요소를 제거한다.

### 27. span 제거 후

![27](https://jser.dev/static/rerender/27.avif)

- "("와 ")"가 연결된 것으로 보여주려는듯하다.

### 28. "1" 변경

![28](https://jser.dev/static/rerender/28.avif)

- "0"을 "1"로 변경한다.

### 29. button 없데이트

![29](https://jser.dev/static/rerender/29.avif)

- button은 실제로 업데이트가 일어나지 않는다.
- button에 아무것도 기록해놓지 않으면 자식으로 들어가지 않을 수 있을 것 같다.

### 30. b 배치

![30](https://jser.dev/static/rerender/30.avif)

- b 요소를 자기 위치를 찾아서 배치한다.

### 31. 마지막

![31](https://jser.dev/static/rerender/31.avif)

- 커밋 단계가 끝나고 전체 리렌더 과정이 종료된다.

## 자세히

### 2. lanes & childLanes ~ 9. br

- Component의 useEffect 훅에서 setState 함수가 호출될 때 내부적으로 dispatchSetState 호출
- dispatchSetState
  - requestUpdateLane
    - Component에 lane을 설정한다.
  - scheduleUpdateOnFiber
    - ensureRootIsScheduled 호출
    - 이후 과정에서 lane 값을 따져서 performSyncWorkOnRoot 호출
    - performSyncWorkOnRoot > renderRootSync
      - prepareFreshStack
        - createWorkInProgress(root.current, null) 호출
          - HostRoot FiberNode 새로 만듦
        - markUpdateLaneFromFiberToRoot
          - return(parent) 타고 올라가면서 childLanes 값 변경
      - workLoopSync > performUnitOfWork {loop}
        - beginWork
          - 리렌더가 불필요하다고 판단하면 attemptEarlyBailoutIfNoScheduledUpdate 호출
          - attemptEarlyBailoutIfNoScheduledUpdate > bailoutOnAlreadyFinishedWork
            - childLanes를 보고 작업할 게 없으면 null 반환 (bail out)
            - 작업할 게 있으면 cloneChildFibers 호출 후 child 반환
              - 이전 자식 Fiber를 활용해서 복제
            - cloneChildFibers > createWorkInProgress
              - alternate(이전에 만든 FiberNode)가 있으면 이걸 가져다 쓴다.
        - beginWork 이후: unitOfWork.memoizedProps = unitOfWork.pendingProps;
          - 해당 FiberNode에서 작업이 끝났기 때문에 memoizedProps를 업데이트

### 10. Component 확인 ~ 25. 다시 HostRoot

- performUnitOfWork {loop}
  - beginWork
    - updateFunctionComponent
      - renderWithHooks
        - nextChildren 객체를 반환한다(Component 작업에서 div 반환)
      - reconcileChildren(current, workInProgress, nextChildren, renderLanes) > reconcileChildFibersImpl
        - reconcileSingleElement
          - newChild(nextChildren)이 div 단일 요소이기 때문에.
          - useFiber(child, element.props)
            - current의 child FiberNode를 사용한다.
          - FiberNode의 props가 같은 레퍼런스가 아니기 때문에 이후 자식이 beginWork 작업 중 bail out 되지 않는다.
        - reconcileSingleTextNode
    - updateHostComponent
      - nextChildren은 요소 객체의 배열이다.
      - reconcileChildren
        - reconcileChildrenArray
          - current의 FiberNode 연결 리스트와 새로 만든 요소 객체 배열을 대조한다.
          - updateSlot
            - 키를 고려해서 새로운 FiberNode를 반환
          - 이전 FiberNode를 재사용할 수 없으면 해당 DOM을 제거하도록 기록: deleteChild
            - ChildDeletion 플래그를 추가
            - workInProgress FiberNode의 deletions 속성에 current 쪽 제거하기로 한 FiberNode를 배열로 저장한다.
          - 새로 만든 FiberNode는 DOM을 삽입: placeChild
            - Placement 플래그를 추가
    - updateHostText
      - 동작하는 게 없고, 업데이트 예정임을 기록하는 건 completeWork에서 한다.
  - completeWork
    - updateHostText
      - TextNode의 경우 전과 후를 비교해서 다르면 수정하도록 기록
        - markUpdate: Update 플래그를 추가

### 26. 커밋 단계: span 제거 ~ 31. 마지막

- performSyncWorkOnRoot > commitRoot
  - commitMutationEffectsOnFiber
    - recursivelyTraverseMutationEffects: 순회하면서 자식부터 처리한다.
      - 처음에 deletions가 있으면 DOM을 제거: commitDeletionEffects
    - commitReconciliationEffects: DOM 삽입
      - commitPlacement
    - 그 이후에 업데이트를 진행한다.
    - commitTextUpdate: 텍스트는 nodeValue를 교체한다.
- 작업 순서
  1. span 제거
  2. button > HostText 업데이트
  3. button 업데이트(내부적으로만 동작)
  4. b 삽입
