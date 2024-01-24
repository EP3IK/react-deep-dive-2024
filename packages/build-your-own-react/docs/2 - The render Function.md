# 2단계: `render` 함수

## 구현

```js
function render(element, container) {
  const dom = // 1
    element.type === 'TEXT_ELEMENT' // 3
      ? document.createTextNode('') // 3
      : document.createElement(element.type); // 1

  const isProperty = (key) => key !== 'children'; // 4
  Object.keys(element.props) // 4
    .filter(isProperty) // 4
    .forEach((name) => (dom[name] = element.props[name])); // 4

  element.props.children.forEach((child) => render(child, dom)); // 2

  container.appendChild(dom); // 1
}
```

1. 타입에 맞게 DOM 요소를 만들고 컨테이너에 추가한다.
2. 컨테이너 추가 이전에 `render` 함수로 재귀적으로 자식을 만들어서 DOM 요소에 추가한다.
3. 요소의 타입이 `TEXT_ELEMENT`인 경우 텍스트 노드를 만들도록 별도로 처리한다.
4. DOM 요소에 속성을 할당한다.
