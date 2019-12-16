import * as React from "react"
import { useEffect, useState, useCallback } from 'react'

/*
версия 2
- добавляется использование логики загрузки данных fetch/onFetched в External OOP API: мы хотим загружать данные единожды при маунте компонента, а когда данные загружены, мы хотим применить текущее значение зума
- проблема перевызова useFetchEffect по цепочке zoom -> applyZoom -> fetchedHandler -> useFetchEffect
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

const useApplyZoomEffect = (applyZoom) => useEffect(() => {
  console.log('apply zoom effect')
  applyZoom()
}, [applyZoom])

/* 
эффект вызова fetch
подписываем fetchedHandler на событие onFetched
*/
const useFetchEffect = (api, fetchHandler) => useEffect(() => {
  if (api) {
    api.onFetched(fetchHandler)
    api && api.fetch()
  }
}, [api, fetchHandler])

const Component = ({
  zoom,
  increaseZoomHandler,
  unrelatedProp,
  increaseUnrelatedPropHandler,
}) => {
  const api = useCreateAPIEffect()

  const applyZoom = useCallback(() => {
    if (api) {
      api.setZoom(zoom)
    }
  }, [api, zoom])

  /*
  по окончании загрузки данных мы хотим применить текущий зум
  как мы уже выяснили, чтобы избежать перевызова эффекта useFetchEffect при изменении unrelatedProp мы должны обернуть функцию в useCallback

  однако мы сталкиваемся с пересозданием fetchedHandler при изменении applyZoom, что в свою очередь происходит при изменении zoom
  */
  const fetchedHandler = useCallback(() => {
    console.log('API data fetched')
    applyZoom()
  }, [applyZoom])

  /* добавляем эффект загрузки данных */
  useFetchEffect(api, fetchedHandler)

  useApplyZoomEffect(applyZoom)

  return (
    <>
      <div>current zoom: {zoom}</div>
      <button onClick={increaseZoomHandler}>zoom in</button>
      <div>unrelated prop: {unrelatedProp}</div>
      <button onClick={increaseUnrelatedPropHandler}>increase unrelated prop</button>
    </>
  )
}

const ExternalStateWrapper = () => {
  const [zoom, setZoom] = useState(0)
  const increaseZoomHandler = () => setZoom(prevZoom => prevZoom + 1)
  
  const [unrelatedProp, setUnrelatedProp] = useState(1)
  const increaseUnrelatedPropHandler = () => setUnrelatedProp(prev => prev + 1)

  return (
    <Component
      zoom={zoom}
      increaseZoomHandler={increaseZoomHandler}
      unrelatedProp={unrelatedProp}
      increaseUnrelatedPropHandler={increaseUnrelatedPropHandler}
    />
  )
}

export default ExternalStateWrapper
