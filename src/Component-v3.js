import * as React from "react"
import { useEffect, useState, useRef, useCallback } from 'react'

/*
версия 3
- useLiveRef как одно из решений проблемы перевызова useFetchEffect по цепочке zoom -> applyZoom -> fetchedHandler -> useFetchEffect
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

/*
applyZoom теперь не меняется при изменении zoom, так что теперь мы должны указать эту зависимость явным образом
*/
const useApplyZoomEffect = (applyZoom, zoom) => useEffect(() => {
  console.log('apply zoom effect')
  applyZoom()
}, [applyZoom, zoom])

const useFetchEffect = (api, fetchHandler) => useEffect(() => {
  if (api) {
    api.onFetched(fetchHandler)
    api && api.fetch()
  }
}, [api, fetchHandler])

/*
этот хук аналогичен useRef за одним исключением - он обновляет переданное значение на каждом рендере
таким образом, он всегда хранит актуальное значение
*/
const useLiveRef = value => {
  const ref = useRef(value)
  ref.current = value
  return ref
}

const Component = ({
  zoom,
  increaseZoomHandler,
  unrelatedProp,
  increaseUnrelatedPropHandler,
}) => {
  const propsRef = useLiveRef({
    zoom,
  })

  const api = useCreateAPIEffect()

  /*
  мы отвязываем этот метод от изменений zoom,
  при этом предоставляя актуальное значение через реф
  таким образом мы разрываем цепочку изменений, вызывающую передергивание эффекта useFetchEffect

  я не уверен в необходимости указывать реф в зависимостях, это требования линта
  */
  const applyZoom = useCallback(() => {
    const { zoom } = propsRef.current
    if (api) {
      api.setZoom(zoom)
    }
  }, [api, propsRef])

  /*
  теперь applyZoom не пересоздается при изменении zoom
  а значит и этот хендлер не меняется
  */
  const fetchedHandler = useCallback(() => {
    console.log('API data fetched')
    applyZoom()
  }, [applyZoom])

  /*
  больше не передергивается
  */
  useFetchEffect(api, fetchedHandler)

  /*
  однако, теперь мы вынуждены явно указать зависимость этого эффекта от zoom
  */
  useApplyZoomEffect(applyZoom, zoom)

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
