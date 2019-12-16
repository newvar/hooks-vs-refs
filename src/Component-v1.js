import * as React from "react"
import { useEffect, useState, useCallback } from 'react'

/*
версия 1
- исключаем перевызов применения зума, оборачивая applyZoom в useCallback (см консоль)
- экстрактим эффект зума из тела рендера
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

const Component = ({
  zoom,
  increaseZoomHandler,
  unrelatedProp,
  increaseUnrelatedPropHandler,
}) => {
  const api = useCreateAPIEffect()

  /* 
  оборачиваем метод в useCallback и явно привязываем к изменениям api и zoom
  таким образом, он теряет свою ссылку на функцию при изменении unrelatedProp

  стоит отметить, что функция все так же пересоздается на каждом рендере, но присваивается переменной applyZoom только при изменении зависимостей
  */
  const applyZoom = useCallback(() => {
    if (api) {
      api.setZoom(zoom)
    }
  }, [api, zoom])

  /* выносим эффект из тела рендера для улучшения читаемости */
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
