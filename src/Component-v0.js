import * as React from "react"
import { useEffect, useState } from 'react'

/*
версия 0
- перевызов применения зума из-за пересоздания метода applyZoom (см консоль)
*/

/* 
предполагаем, что есть какая-то ООП-либа наподобие waveSurfer или fabric
с ней нам нужно сделать следующие вещи
- инициализировать
- получить доступ к данным
- вызывать методы

предполагаем для начала, что эта либа умеет работать с зумом и имеет сеттер и геттер для этого
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

/*
эффект для инициализации инстанса либы
вызывается только на первом рендере, предоставляет инстанс на втором - особенность useEffect

в данном частном случае здесь можно использовать и useRef, тогда api будет доступен уже на первом рендере:
  const api = useRef(null)
  if (!api.current) {
    api.current = new ExternalOOPAPI()
  }
  return api.current
*/
const useCreateAPIEffect = () => {
  const [state, setState] = useState(null)
  useEffect(() => {
    setState(new ExternalOOPAPI())
  }, [])
  return state
}

/*
наш компонент, соответственно, имеет логику, связанную с зумом и свою отдельную логику, связанную с unrelatedProp
он принимает проп zoom извне и должен выставить соответствующий зум в инстансе либы при изменении
также он имеет две конпки для изменения значений zoom и unrelatedProp
*/
const Component = ({
  zoom,
  increaseZoomHandler,
  unrelatedProp,
  increaseUnrelatedPropHandler,
}) => {
  // инстанциируем инстанс либы, получаем доступ к инстансу
  const api = useCreateAPIEffect()

  /* 
  создаем метод, оборачивающий метод либы и добавляющий необходимую логику

  оговорюсь сразу, методами я здесь буду называть функции, которые содержат кусок логики, но не являются хендлерами или эффектами, по аналогии с методами классов
  по факту, эти функции привязаны к скоупу рендера, как они были бы привязаны к this в классовой реализации

  возможно, это определение неточное или даже излишнее, но я оставлю его для консистентности перехода от классовой реализции к хуковой
  */
  const applyZoom = () => {
    if (api) {
      api.setZoom(zoom)
    }
  }

  /*
  применяем изменившийся зум с помощью эффекта
  здесь стоит обратить внимание на зависимость от applyZoom, а не от zoom. дело в том, что applyZoom уже включает в себя зависимость от zoom и zoom не используется в скоупе эффекта явным образом. по логике формирования зависимостей эффекта, его не нужно учитывать

  однако, applyZoom пересоздается на каждом рендере. это означает, что эффект будет передергиваться при изменении unrelatedProp, а нам это не нужно
  */
  useEffect(() => {
    console.log('apply zoom effect')
    applyZoom()
  }, [applyZoom])

  return (
    <>
      <div>current zoom: {zoom}</div>
      <button onClick={increaseZoomHandler}>zoom in</button>
      <div>unrelated prop: {unrelatedProp}</div>
      <button onClick={increaseUnrelatedPropHandler}>increase unrelated prop</button>
    </>
  )
}

/* эмуляция некоего внешнего стейта типа редакса */
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
