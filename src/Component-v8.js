import * as React from "react"
import { useEffect, useState, useRef } from 'react'

/*
версия 8 (final) - refmem и useLivePropsRef
- в memo слишком много логики, которая не нужна, когда функции имеют очень конкретную сигнатуру.
- кроме того, можно немного сократить код доступа к рефу, когда мы знаем его структуру. для этого мы введем useLivePropsRef
*/

/*
memo -> refmem
нам болше не нужно сравнивать все аргументы, более того, мы точно знаем, что реф всегда один и тот же, в таком случае нам вообще не нужно больше менять функцию никогда
*/
const refmem = (fn) => {
  let cache
  return (ref) => {
    if (!cache) {
      cache = fn(ref)
    }
    return cache
  }
}

/*
useLiveRef -> useLivePropsRef
мы знаем, что в current всегда будет объект с конкретной структурой, поэтому можно добиться того, чтобы не менять сам current
таким образом мы можем исключить current из цепи доступа ref.current.prop, возвращая ref.current вместо ref
*/
const useLivePropsRef = props => {
  const ref = useRef()
  if (!ref.current) {
    ref.current = {}
  }
  Object.assign(ref.current, props)
  return ref.current
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

/*
memo -> refmem
propsRef.current -> props
как и в случае с memo, деструкцию аргумента функции здесь использовать нельзя, так как полученные свойства prop застрянут внутри замыкания навеки
*/
const useUpdateResultZoomMethod = refmem((props) => () => {
  const { api, setResultZoom } = props
  setResultZoom(api ? api.getZoom() : 'no api')
})

/* аналогичные изменения */
const useApplyZoomMethod = refmem((props) => () => {
  const { api, zoom, ratio } = props
  if (api) {
    api.setZoom(zoom * ratio)
  }
})

/* аналогичные изменения */
const useFetchedHandler = refmem((props) => () => {
  const { applyZoom } = props
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
  
  const propsRef = useLivePropsRef({
    api,
    zoom,
    ratio,
    setResultZoom,
  })

  const updateResultZoom = useUpdateResultZoomMethod(propsRef)
  const applyZoom = useApplyZoomMethod(propsRef)
  const fetchedHandler = useFetchedHandler(useLivePropsRef({ applyZoom }))

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
