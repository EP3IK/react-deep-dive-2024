# How does Context work internally in React?

## 1. `React.createContext()`

- `Provider`, `Consumer`가 있는 객체를 반환
  1. `Provider`는 `REACT_PROVIDER_TYPE`라는 특별한 타입을 들고 있다.
  2. `Consumer`는 컨텍스트 객체 그 자체.

```tsx
const context: ReactContext<T> = {
  $$typeof: REACT_CONTEXT_TYPE,
  _currentValue: "123", // const Context = React.createContext("123");
  _currentValue2: "123",
  _threadCount: 0,
  Provider: {
    $$typeof: REACT_PROVIDER_TYPE,
    _context: context,
  },
  Consumer: context,
};
```

## 2. `Provider`

- `REACT_PROVIDER_TYPE` 타입을 들고 있는 fiber는 `ContextProvider` 태그로 매핑된다.
- `Provider`가 할 일: `Consumer`가 쓸 데이터를 저장한다.
- `beginWork` > fiber의 `tag` === `ContextProvider` 확인 > `updateContextProvider`

### 2.1 `updateContextProvider` 초반부

```tsx
// function updateContextProvider
const providerType: ReactProviderType<any> = workInProgress.type; // fiber의 type에 Provider가 있다.
const context: ReactContext<any> = providerType._context; // Provider._context로 컨텍스트에 접근할 수 있다.

/**
 * <Context.Provider value="JSer">
 *   <Component1 />
 * </Context.Provider>
 */
const newProps = workInProgress.pendingProps; // { value: "JSer", children: Component1 함수 컴포넌트 fiber }
```

### 2.2 `pushProvider()`

```tsx
push(valueCursor, context._currentValue, providerFiber);
```

- `valueStack`에 값을 저장
  - ReactFiberStack.js에서 전역으로 관리하는 배열
- `valueCursor`는 포인터 같은 느낌, `useRef` 반환 값처럼 `current`에 데이터를 저장
- `push`는 `valueCursor`의 값을 `valueStack`에 밀어넣고 `context._currentValue`(`"123"`)를 커서에 저장한다.

```tsx
context._currentValue = nextValue;
```

- 그 다음에 `nextValue`(`"JSer"`)를 컨텍스트에 저장

#### `pushProvider()` 전

```tsx
context._currentValue = "123"
valueCursor.current = null
valueStack = [...]
```

#### `pushProvider()` 후

```tsx
context._currentValue = "JSer"
valueCursor.current = "123"
valueStack = [..., null]
```

> ❓ 컨텍스트에 기본값이 있는 거랑 이전 값을 들고 있는 거랑 무슨 관계?
>
> 💡 아래 `popProvider`에 해답이 있었다.

### 2.3 다시 `updateContextProvider`로 돌아와서 이어서

- 컨텍스트 값과 자식 컴포넌트가 같으면 `bailoutOnAlreadyFinishedWork`을 반환
- 그렇지 않으면 `propagateContextChange()`로 `Consumer`를 업데이트하고 자식을 렌더한다.
- 나중에 `completeWork` > fiber의 `tag` === `ContextProvider` 확인 > `popProvider`

### 2.4 `popProvider()`

- 커서에 담아둔 이전 값을 다시 컨텍스트에 담는다.
- `Provider`의 값을 다시 빼내야 하는 이유

  ```tsx
  <Provider value="123">
    <Provider value="456">...</Provider>
    <Component>
  </Provider>
  ```

  - 컨텍스트에서 값을 빼는 작업이 없으면 위 예시의 Component에서 컨텍스트의 값이 `"123"`이 아닌 `"456"`이 되는 불상사가 일어날 수 있다.

## 3. `Consumer`

```tsx
<Context.Consumer>{(value) => value}</Context.Consumer>
```

- Fiber의 `type`에서 컨텍스트를 가져온다.
- `children`이 `value`를 매개변수로 하는 함수이다.
- 컨텍스트에서 값을 가져와서 `children`을 호출하면 컨텍스트가 적용된 자식을 얻는다.

### 3.1 `prepareToReadContext()`

- 값을 가져오기 전에 준비 과정을 거친다.
- `dependencies`: 여러 컨텍스트 중 사용 중인 것

```ts
export type ContextDependency<T> = {
  context: ReactContext<T>,
  next: ContextDependency<mixed> | null,
  memoizedValue: T,
  ...
};

export type Dependencies = {
  lanes: Lanes,
  firstContext: ContextDependency<mixed> | null,
  ...
};
```

- `<Consumer />` 구조는 하나의 컴포넌트에서 하나의 컨텍스트만을 사용할 수 있다.
- 하나의 컴포넌트에서 여러 개의 컨텍스트를 사용하려면 `useContext()`를 사용하면 된다.
  - 아니나 다를까 `dependencies`의 `firstContext`는 `next`로 체이닝하는 구조이다.

> ❓ 근데 그래서 `dependencies`는 언제 `null`이 아닌 거야?
>
> 💡 아래에 나오는 `readContext()`를 호출하고나면 `null`이 아니게 된다.

> ❓ 준비 다 하고 `firstContext`는 왜 `null`로 초기화하는 거야?
>
> 💡 준비가 끝나고 다시 처음부터 `readContext()`를 호출해야 하니까.
>
> - 컨텍스트 값을 상태로 관리하고 값을 변경해서 리렌더가 발생할 때 유효하다.

- 변경이 있는 fiber에서 `lane`을 비교해서 업데이트를 걸어놓는다.

### 3.2 `readContext()`

```tsx
const contextItem = {
  context: ((context: any): ReactContext<mixed>),
  memoizedValue: value,
  next: null,
};
```

- `lastContextDependency`를 사용
  - ReactFiberNewContext.js에서 전역으로 관리하는 의존성 변수
- `lastContextDependency`가 없으면 만든 `contextItem`을 할당하고 `Consumer` fiber의 `dependencies`에 이 컨텍스트 정보를 할당한다.
- `lastContextDependency`가 있으면 `contextItem`을 `next`에 체이닝한다.

### 3.3 `useContext === readContext`

## 4, `propagateContextChange()`

- `Provider`부터 시작해서 자식을 탐색한다.
- 의존성을 돌면서 찾는 컨텍스트를 발견하면 `scheduleContextWorkOnParentPath()` 호출
  - 부모에서 맨 위까지 돌면서 childLane을 바꾸고 작업을 스케줄링한다.

## 회고

- JSer의 설명과 다르게 `Consumer`가 컨텍스트 자체가 아니라 `Provider`처럼 타입이 있고 `_context`에 컨텍스트를 담아 쓰는 경우도 있는 것 같은데(`enableRenderableContext`), 궁금하다.
- 컨텍스트 값이 바뀌어서 리렌더, `dependencies`가 초기화되는 예시도 있었으면 좋았을 것 같다.
- 문제를 풀어보니까 왜 FiberStack을 쓰는지 알 것 같다.
