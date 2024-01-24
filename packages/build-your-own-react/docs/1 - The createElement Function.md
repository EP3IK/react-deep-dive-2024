# 1단계: `createElement` 함수

## AS-IS

```jsx
const element = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
);
const container = document.getElementById('root');
ReactDOM.render(element, container);
```

## TO-BE

```js
const element = React.createElement(
  'div',
  { id: 'foo' },
  React.createElement('a', null, 'bar'),
  React.createElement('b'),
);
```

## 핵심

우리가 만드는 `createElement` 함수는 JSX를 `type`, `props` 속성이 있는 객체로 바꿔주는 역할을 해야 한다.

```js
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children,
    },
  };
}
```

- 스프레드 연산자 사용
  - 여러 개의 자식을 매개변수로 받을 수 있다.
  - `children` 속성은 항상 배열이다.

```js
function createTextElement(text) {
  return {
    type: 'TEXT_ELEMENT',
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) =>
        typeof child === 'object' ? child : createTextElement(child),
      ),
    },
  };
}
```

- `TEXT_ELEMENT`
  - 자식이 객체가 아닌 원시 값일 때 사용하는 특별한 타입

```js
const Didact = { createElement };

/** @jsx Didact.createElement */
const element = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
);
```

- Babel에서 JSX를 어떻게 트랜스파일할지를 주석을 통해 결정할 수 있다.
