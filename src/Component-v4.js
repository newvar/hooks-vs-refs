import * as React from "react"
import { useEffect, useState, useRef, useCallback } from 'react'

/*
версия 4 - бизнес решает добавить логики
- мы вводим проп ratio, который влияет на применяемый зум
- также мы хотим выводить получившийся зум - но с этим проблема, см ниже и см следующий файл
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

/* указываем, что эффект должен перевызываться при изменении ratio */
const useApplyZoomEffect = (applyZoom, zoom, ratio) => useEffect(() => {
  console.log('apply zoom effect')
  applyZoom()
}, [applyZoom, zoom, ratio])

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
  /* добавляем проп ratio и хендлер для его изменения */
  ratio,
  increaseRatioHandler,
  unrelatedProp,
  increaseUnrelatedPropHandler,
}) => {
  const propsRef = useLiveRef({
    zoom,
    /* добавляем ratio в реф по тем же причинам, по которым добавили zoom ранее */
    ratio,
  })

  const api = useCreateAPIEffect()

  /* 
  - добавляем ratio в вычисление зума, который мы пробрасываем в инстанс либы
  - ожидаем ratio в propsRef аналогично zoom
  */
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
  /* пробрасываем ratio в эффект применения зума */
  useApplyZoomEffect(applyZoom, zoom, ratio)
  
  return (
    <>
      <div>current zoom: {zoom}</div>
      {/* добавляем отображение ratio в разметку */}
      <div>current ratio: {ratio}</div>
      {/*
        добавляем отображение итогового зума из инстанса либы

        сразу ставим гард на api, так как его нет на первом рендере

        но тут мы сталкиваемся другой с проблемой - отображается предыдущее значение

        это связано с тем, что эффект отрабатывает после рендера и примененное новое значение зума в либе появляется после того, как новые zoom и ratio попадут в рендер и отрисуются в этом лейауте

        при этом новое значение итогового зума существует в инстансе либы и это можно увидеть в консоли
      */}
      <div>result zoom (zoom * ratio): {api ? api.getZoom() : 'no api yet'}</div>
      <button onClick={increaseZoomHandler}>zoom in</button>
      {/* добавляем кнопку изменения ratio в разметку */}
      <button onClick={increaseRatioHandler}>increase ratio</button>
      <div>unrelated prop: {unrelatedProp}</div>
      <button onClick={increaseUnrelatedPropHandler}>increase unrelated prop</button>
    </>
  )
}

const ExternalStateWrapper = () => {
  const [zoom, setZoom] = useState(0)
  const increaseZoomHandler = () => setZoom(prevZoom => prevZoom + 1)
  
  /* мы эмулируем существование этого параметра в редаксе */
  const [ratio, setRatio] = useState(1)
  const increaseRatioHandler = () => setRatio(prevRatio => prevRatio + 1)

  const [unrelatedProp, setUnrelatedProp] = useState(1)
  const increaseUnrelatedPropHandler = () => setUnrelatedProp(prev => prev + 1)

  return (
    <Component
      zoom={zoom}
      increaseZoomHandler={increaseZoomHandler}
      /* добавляем проп ratio и хендлер для его изменения */
      ratio={ratio}
      increaseRatioHandler={increaseRatioHandler}
      unrelatedProp={unrelatedProp}
      increaseUnrelatedPropHandler={increaseUnrelatedPropHandler}
    />
  )
}

export default ExternalStateWrapper
