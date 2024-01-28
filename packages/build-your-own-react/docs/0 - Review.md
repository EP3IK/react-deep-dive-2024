# 0단계: 리뷰

## 원본

```jsx
const element = <h1 title="foo">Hello</h1>;
const container = document.getElementById('root');
ReactDOM.render(element, container);
```

## 변환

- JSX를 바닐라 자바스크립트로 변경해야 한다.
  - Babel과 같은 빌드 도구로 변환된다.
  - 태그 안의 코드를 태그 이름, 속성, 자식 요소를 매개변수로 전달해서 `createElement` 함수로 호출한 것으로 변환한다.

## 첫 번째 줄

```js
const element = React.createElement('h1', { title: 'foo' }, 'Hello');
```

- `React.createElement`는 객체를 반환한다.
  - `type`: DOM 요소 타입 문자열, `document.createElement`에 전달할 `tagName`
  - `props`: JSX 속성에서 가져온 모든 키와 값을 묶은 객체
    - `children`: 보통 배열 형태

```js
const element = {
  type: 'h1',
  props: {
    title: 'foo',
    children: 'Hello',
  },
};
```

## 세 번째 줄

- `ReactDOM.render`는 DOM을 실제로 변경한다.

```js
const node = document.createElement(element.type);
node.title = element.props.title;

const text = document.createTextNode('');
text.nodeValue = element.props.children;

node.appendChild(text);
container.appendChild(node);
```

- [Node: `nodeValue` property - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeValue)
