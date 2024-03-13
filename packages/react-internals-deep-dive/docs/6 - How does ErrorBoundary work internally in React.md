# How does ErrorBoundary work internally in React?

## 1. ErrorBoundary is a declarative try…catch for React fiber tree

```tsx
<ErrorBoundary fallback={<p>Something went wrong</p>}>
  <Profile />
</ErrorBoundary>
```

- ErrorBoundary의 자식 컴포넌트 `Profile`이 오류를 던지면 fallback을 렌더한다.
- `static getDerivedStateFromError(error)` 메서드가 있는 클래스 컴포넌트는 ErrorBoundary가 될 수 있다.

## 2. How does ErrorBoundary work internally?

### 2.1 오류 발생~스케줄링

- `renderRootSync` 함수의 `workLoopSync()`에서 오류를 던지면 `handleError()`를 호출
- `handleError()`: 1. `throwException()`, 2. `completeUnitOfWork()`
- `throwException()`
  - 오류를 던진 fiber에 `Incomplete` flag을 표시
  - 상위(return) fiber로 올라가면서 `getDerivedStateFromError` 메서드가 있는 클래스 컴포넌트를 찾는다.
  - 가장 가까운 ErrorBoundary를 발견하면 그 fiber에 `ShouldCapture` flag을 표시
  - 에러 업데이트 객체를 만든다.
    - `createClassErrorUpdate()`에서 객체의 `payload`에 `getDerivedStateFromError()` 함수를 할당
  - 만든 에러 업데이트 객체와 함께 `enqueueCapturedUpdate()` 호출
    - `updateQueue`에 업데이트를 걸어놓는다.

### 2.2 Unwind

- Unwind
  - `throwException()`은 오류를 던진 fiber에서 벌어지고 있는 작업이다.
  - ErrorBoundary에서 작업 처리를 하기 위해서 fiber를 찾아 올라가고 fallback을 렌더하는 과정이 unwind이다.
- `completeUnitOfWork()`
  - 상위(return) fiber로 올라가면서 fiber의 `flag`에 `Incomplete`가 있으면 `unwindWork()` 호출
  - `unwindWork()`가 반환한 fiber가 있으면 해당 fiber에서 작업을 이어서 진행한다.
    - Fiber 반환 조건은 바로 `ShouldCapture` flag가 있을 때.
    - Fiber 반환 직전에 `DidCapture` flag로 바꿔놓는다.

### 2.3 작업 마무리

- `finishClassComponent()`
  - Fiber에 `DidCapture` flag가 있으면 이 ErrorBoundary 클래스 컴포넌트 인스턴스의 `render` 메서드를 실행해서 얻은 자식으로 기존 fiber를 갈아 엎는다(`forceUnmountCurrentAndReconcile`).
