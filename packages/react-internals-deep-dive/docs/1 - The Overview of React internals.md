# The Overview of React internals

## 요약

### 리액트 내부 구조 공부 방법

1.  공식 문서 - https://react.dev/, https://github.com/reactwg
2.  리액트 팀 멤버 팔로우 - https://react.dev/community/team
3.  깃헙 리포지토리 - https://github.com/facebook/react
4.  소스코드 천국, 블로그 지옥
5.  일단 중요한 것부터 찾아라.
    - 모든 걸 알아내기에 리액트 코드는 양이 너무 많다.

### 중단점으로 리액트 내부 구조 디버깅 - https://jser.dev/demos/react/overview

1.  중단점 추가
    - App 함수에서 `useState` 다음과 `useEffect` 내부에 `debugger` 추가
    - 컨테이너 DOM에 하위 트리 변경 중단점 추가
2.  첫 번째 중단: `useState` 다음
    1. `ReactDOMRoot.render`
       - 우리 프로젝트 기준 `main.tsx` 파일에서 실행하는 함수
    2. `scheduleUpdateOnFiber`
       - 어디서부터 렌더해야 하는지 알려주는 함수
       - 최초 마운트 시에는 루트에서 호출된다고 한다.
       - 업데이트되는 경우에는 모조리 바뀌는 게 아닌 이상 루트가 아닌 하위 트리에서 호출된다는 걸 의미하는 것 같다.
    3. `ensureRootIsScheduled`
       - `performConcurrentWorkOnRoot`가 스케줄링되었다는 걸 **보장**하는 함수
       - 루트에서 스케줄러에 작업 올릴 걸 다 올리고 "준비 완료"를 누르는 시점
    4. `scheduleCallback`
       - 실제 스케줄러 동작, 비동기로 진행(`postMessage`)
    5. `workLoop`
       - 스케줄러에서 할 일을 처리하는 함수
    6. `performConcurrentWorkOnRoot`
       - 스케줄링이 된 업무를 시작, 컴포넌트가 여기서 실제로 렌더
3.  두 번째 중단: DOM 변경
    1. `commitRoot`
       - 필수적인 DOM 업데이트를 일으키는 함수
    2. `commitMutationEffects`
       - `commitRoot` 내부에서 실제 DOM 업데이트를 발생시키는 함수
4.  세 번째 중단: `useEffect` 내부
    1. `flushPassiveEffects`: 이펙트를 처리하는 함
5.  다섯 번째 중단: 상태 변경 > 리렌더에서 `useState` 다음
    - `performConcurrentWorkOnRoot` 내부에서 `updateFunctionComponent`를 호출하는 분기로 간다.
    - 최초 마운트에서는 `mountIndeterminateComponent`를 호출하는 쪽으로 갔다.

### 리액트 동작 4단계

1.  트리거
    - "할 일을 만드는" 단계
    - `ensureRootIsScheduled`가 그 끝이고, 그러고나면 할 일을 스케줄러로 보낸다(`scheduleCallback`).
2.  스케줄
    - 스케줄러가 `scheduleCallback`에서 할 일을 받으면 우선순위 큐로 처리한다.
    - 스케줄러의 `workLoop`가 우선순위에 맞게 할 일을 하나씩 진행한다.
3.  렌더
    - 새로 파이버 트리를 만들어서 호스트 DOM에 업데이트가 필요한지 확인
    - `performConcurrentWorkOnRoot`가 트리거에서 만들어지고, 스케줄에서 순위를 정해서, 여기서 실행된다.
4.  커밋
    - 계산된 업데이트를 호스트 DOM에 적용해서 화면에 보여주는 단계
    - DOM 조작 + 이펙트 발생

## 회고

- 깃헙 코드스페이스의 vite dev 환경에서는 DOM 중단점이 제대로 동작하지 않아서 아쉽다. 좀더 확인이 필요하다.
- Build your own react에서 보던 이름이 나와서, 내용이 쉽지는 않지만 분명히 이해하는 데 큰 도움이 되었다.
- 퍼포먼스 탭에 대한 지식이 늘었다. 콜 스택의 위아래를 뒤집어서 펼쳐놓은 느낌?
- 콜 스택 활용 지식도 늘어서 좋았다.
