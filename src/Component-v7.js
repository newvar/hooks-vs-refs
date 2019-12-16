import * as React from "react"
import { useEffect, useState, useRef } from 'react'

/*
версия 7 - мемоизация функций вместо useCallback

как я говорил раньше, useCallback не является оптимизацией пересоздания функций. он является оптимизацией вызова эффектов

и это норм, с этим можно жить

однако если совсем упороться, можно решить и эту проблему с помощью агрессивного использования useLiveRef и некоторой мемоизации 

useCallback здесь больше не используется
*/

/*
для этого мы накидаем простейшую функцию для мемоизации
*/
const memo = (fn) => {
  let cache
  let prevArgs = []
  return (...args) => {
    if (
      args.length !== prevArgs.length
      || args.some((item, index) => prevArgs[index] !== item)
    ) {
      prevArgs = args
      cache = fn(...args)
    }
    return cache
  }
}

class ExternalOOPAPI  {
  zoom = 0
  setZoom(zoom) {
    this.zoom = zoom
    console.log('zoom to:', zoom)
  }
  getZoom() {
    return this.zoom
  }
  fetchedHandler = null
  fetch() {
    console.log('fetch data')
    this.fetchedHandler && this.fetchedHandler()
  }
  onFetched(handler) {
    this.fetchedHandler = handler
  } 
}

const useCreateAPIEffect = () => {
  const [state, setState] = useState(null)
  useEffect(() => {
    setState(new ExternalOOPAPI())
  }, [])
  return state
}

const useApplyZoomEffect = (applyZoom, updateResultZoom, zoom, ratio) => useEffect(() => {
  console.log('apply zoom effect')
  applyZoom()
  updateResultZoom()
}, [applyZoom, updateResultZoom, zoom, ratio])

const useFetchEffect = (api, fetchHandler) => useEffect(() => {
  if (api) {
    api.onFetched(fetchHandler)
    api && api.fetch()
  }
}, [api, fetchHandler])

const useLiveRef = value => {
  const ref = useRef(value)
  ref.current = value
  return ref
}

/*
оборачиваем функцию создания метода в memo,
таким образом метод будет пересоздан только при изменении ссылки на propsRef
*/
const useUpdateResultZoomMethod = memo((propsRef) => () => {
  /* выдергиваем пропы из propsRef */
  const { api, setResultZoom } = propsRef.current
  setResultZoom(api ? api.getZoom() : 'no api')
})

/* аналогичные изменения, api переезжает в propsRef */
const useApplyZoomMethod = memo((propsRef) => () => {
  const { api, zoom, ratio } = propsRef.current
  if (api) {
    api.setZoom(zoom * ratio)
  }
})

/* аналогичные изменения, applyZoom переезжает в propsRef */
const useFetchedHandler = memo((propsRef) => () => {
  const { applyZoom } = propsRef.current
  console.log('API data fetched')
  applyZoom()
})

const Component = ({
  zoom,
  increaseZoomHandler,
  ratio,
  increaseRatioHandler,
  unrelatedProp,
  increaseUnrelatedPropHandler,
}) => {
  const api = useCreateAPIEffect()

  const [resultZoom, setResultZoom] = useState()
  
  /*
  теперь нам необходимо сложить в реф все переменные, которые нам нужны
  в теории можно для каждой функции писать свой реф, но, во-первых, это лишние вызовы и линший код, а мы тут оптимизируем как не в себя, а во-вторых, ну лень же
  */
  const propsRef = useLiveRef({
    /* обратите внимание, мы реально складываем сюда все, что можно */
    api,
    zoom,
    ratio,
    setResultZoom,
  })

  /* заменяем все зависимости на propsRef */
  const updateResultZoom = useUpdateResultZoomMethod(propsRef)
  const applyZoom = useApplyZoomMethod(propsRef)
  /* однако конкретно вот тут вот нам проще состряпать новый реф. альтернатива - мутировать propsRef
    propsRef.current.applyZoom = applyZoom
  */
  const fetchedHandler = useFetchedHandler(useLiveRef({ applyZoom }))

  /* эффекты это не аффектит */
  useFetchEffect(api, fetchedHandler)
  useApplyZoomEffect(applyZoom, updateResultZoom, zoom, ratio)
  
  return (
    <>
      <div>current zoom: {zoom}</div>
      <div>current ratio: {ratio}</div>
      <div>result zoom (zoom * ratio): {resultZoom}</div>
      <button onClick={increaseZoomHandler}>zoom in</button>
      <button onClick={increaseRatioHandler}>increase ratio</button>
      <div>unrelated prop: {unrelatedProp}</div>
      <button onClick={increaseUnrelatedPropHandler}>increase unrelated prop</button>
    </>
  )
}

const ExternalStateWrapper = () => {
  const [zoom, setZoom] = useState(0)
  const increaseZoomHandler = () => setZoom(prevZoom => prevZoom + 1)
  
  const [ratio, setRatio] = useState(1)
  const increaseRatioHandler = () => setRatio(prevRatio => prevRatio + 1)

  const [unrelatedProp, setUnrelatedProp] = useState(1)
  const increaseUnrelatedPropHandler = () => setUnrelatedProp(prev => prev + 1)

  return (
    <Component
      zoom={zoom}
      increaseZoomHandler={increaseZoomHandler}
      ratio={ratio}
      increaseRatioHandler={increaseRatioHandler}
      unrelatedProp={unrelatedProp}
      increaseUnrelatedPropHandler={increaseUnrelatedPropHandler}
    />
  )
}

export default ExternalStateWrapper
