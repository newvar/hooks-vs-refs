import * as React from "react"
import { useEffect, useState, useRef, useCallback } from 'react'

/*
версия 6 - реорганизация кода
как и в случае с эффектами, имеет определенный смысл экстрактить из рендера хендлеры и методы. как обычно, основные поинты мотивации для декомпозиции полотна на атомы
- реюзабельность и композиция выделенного кода
- возможность независимого тестирования выделенного кода
- повышение читаемости интегрирующего кода, в данном случае рендера
- возможность быстрой декомпозиции компонента за счет легкого выноса логически связанных атомов в отдельный модуль

в свою очередь, стандартные трейдофф-поинты:
- повышается необходимость бегать по файлу в поисках реализации
- дополнительные вызовы для инициализации атомов в рендере
- дополнительная нагрузка на именование - здесь я лично использую относительно формальный подход use[FunctionName][Type], например useApplyZoomMethod и useFetchedHandler. префикс use здесь используется по той же причине, что в эффектах - из-за того, что мы используем хук useCallback.
*/

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

/* метод обновления итогового зума */
const useUpdateResultZoomMethod = (api, setResultZoom) => useCallback(() => {
  setResultZoom(api ? api.getZoom() : 'no api')
}, [api])

/* метод применения зума */
const useApplyZoomMethod = (api, propsRef) => useCallback(() => {
  const { zoom, ratio } = propsRef.current
  if (api) {
    api.setZoom(zoom * ratio)
  }
}, [api, propsRef])

/* хендлер окончания загрузки */
const useFetchedHandler = (applyZoom) => useCallback(() => {
  console.log('API data fetched')
  applyZoom()
}, [applyZoom])

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
  
  const propsRef = useLiveRef({
    zoom,
    ratio,
  })

  /* теперь в рендере не полотно кода, а конкретно именованые блоки логики */
  const updateResultZoom = useUpdateResultZoomMethod(api, setResultZoom)
  const applyZoom = useApplyZoomMethod(api, propsRef)
  const fetchedHandler = useFetchedHandler(applyZoom)

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
