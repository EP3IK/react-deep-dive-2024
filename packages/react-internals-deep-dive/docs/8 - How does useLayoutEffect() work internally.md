# How does useLayoutEffect() work internally?

## 1. how layout effects are mounted?

useEffect()와 똑같이 mountEffectImpl(), updateEffectImpl()을 쓰는데, 두 번째 인자(hookFlags)가 다르다.

### mountWorkInProgressHook()

- Hook 객체를 만들고 wip fiber의 memoizedState에 할당 또는 체이닝

### pushEffect()

- Effect 객체를 만든다.
  - 들어가는 태그: HookHasEffect | HookLayout
- 할당 또는 체이닝
  - Hook fiber의 memoizedState
  - Wip fiber의 updateQueue

## 2. how layout effects are updated?

### updateWorkInProgressHook()

- 현재의 hook을 보내고 새 hook을 반환

### pushEffect()

1. 업데이트 X
   - 이전 effect의 의존성과 업데이트하려는 의존성이 동일
   - areHookInputsEqual(nextDeps, prevDeps)
   - 매개변수 태그에 HookHasEffect 없이 호출
2. 업데이트 O
   - 의존성이 다름

## 3. when do layout effects actually get run?

### 과정: commit 단계

- commitRootImpl > commitLayoutEffects > commitLayoutMountEffects_complete > (loop)commitLayoutEffectOnFiber

### commitLayoutEffectOnFiber

- commitHookEffectListMount(HookLayout | HookHasEffect, finishedWork)를 호출

### commitHookEffectListMount

- Fiber의 updateQueue에서 effect 객체를 가져와서 create() 호출, 반환 값을 effect.destroy에 할당
- Effect 체이닝을 따라 순회

## 4. when do layout effects get cleaned up?

### 과정: 동일하게 commit 단계

- commitLayoutEffects보다 앞서서 commitMutationEffects를 호출
- commitRootImpl > commitMutationEffects > commitMutationEffectsOnFiber > recursivelyTraverseMutationEffects, commitHookEffectListUnmount

### commitHookEffectListUnmount

- commitHookEffectListMount과 동일, destroy() 호출

## 5. but how cleanups get run when component is unmounted?

### recursivelyTraverseMutationEffects

- parentFiber.deletions에 들어있는 삭제된 fiber에 대해서 (loop)commitDeletionEffects 호출
  - commitDeletionEffects > commitDeletionEffectsOnFiber
    - 삭제 fiber의 updateQueue에 있는 effect 객체를 순회하면서 destroy 호출
- 자식에 대해서 commitMutationEffectsOnFiber 호출(재귀 순회)
