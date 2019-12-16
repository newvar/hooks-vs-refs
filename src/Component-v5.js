import * as React from "react"
import { useEffect, useState, useRef, useCallback } from 'react'

/*
версия 5
- решение проблемы отображения итогового зума из инстанса либы с помощью useState
- может показаться, что в данном частном случае мы можем совершить архитектурное допущение и выводить то же самое значение зума, которое мы передаем в инстанс либы. но на самом деле это грубая ошибка переноса ответственности, так как подопытный компонент ничего не знает о внутренней логике ExternalOOPAPI и о том, как изменится значние зума внутри инстанса. как пример - могут быть ограничения на максимальный и минимальный зум.
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

/* добавляем вызов updateResultZoom для обновления итогового зума в стейте после применения его к инстансу либы */
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

const Component = ({
  zoom,
  increaseZoomHandler,
  ratio,
  increaseRatioHandler,
  unrelatedProp,
  increaseUnrelatedPropHandler,
}) => {
  const api = useCreateAPIEffect()

  /* 
  добавляем стейт, в который сложим итоговый зум. это вызовет перерендер и мы сможем отобразить актуальное значение

  setResultZoom мы вызываем сразу после применения зума в эффекте useApplyZoomEffect через метод updateResultZoom
  */
  const [resultZoom, setResultZoom] = useState()
  
  const propsRef = useLiveRef({
    zoom,
    ratio,
  })

  /* 
  создаем метод обновления итогового зума, который мы будем вызывать в эффекте useApplyZoomEffect. 

  этот метод нужен нам, так как мы добавляем в него доплогику, в данном случае это гард на api 

  но при этом мы не хотим перевызова useApplyZoomEffect из-за изменения unrelatedProp
  
  да и в целом этот метод по своим обстоятельствам не сильно отличается от метода applyZoom, поэтому мы вынуждены применить к этому методу те же техники, какие мы применили к applyZoom - useCallback и propsRef. в данном случае метод не зависит от изменяемых переменных, так что необходимость в propsRef отпадает.
  */
  const updateResultZoom = useCallback(() => {
    setResultZoom(api ? api.getZoom() : 'no api')
  }, [api])
  
  const applyZoom = useCallback(() => {
    const { zoom, ratio } = propsRef.current
    if (api) {
      api.setZoom(zoom * ratio)
    }
  }, [api, propsRef])

  const fetchedHandler = useCallback(() => {
    console.log('API data fetched')
    applyZoom()
  }, [applyZoom])

  useFetchEffect(api, fetchedHandler)

  /* передаем updateResultZoom в эффект */
  useApplyZoomEffect(applyZoom, updateResultZoom, zoom, ratio)
  
  return (
    <>
      <div>current zoom: {zoom}</div>
      <div>current ratio: {ratio}</div>
      {/* выводим значние итогового зума, сохраненное в стейте */}
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
