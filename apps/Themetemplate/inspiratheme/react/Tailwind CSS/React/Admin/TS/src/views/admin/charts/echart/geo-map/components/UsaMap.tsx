import EChart from '@/components/wrappers/EChart'
import { getColor } from '@/utils/helpers'
import { type EChartsOption, registerMap } from 'echarts'
import { MapChart } from 'echarts/charts'
import { GeoComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useCallback, useEffect, useState } from 'react'

const UsaMap = () => {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch(import.meta.env.VITE_BASE_URL || '' + '/data/usa_geo.json')
      .then((res) => res.json())
      .then((usaGeoJson) => {
        registerMap('USA', usaGeoJson, {
          Alaska: { left: -131, top: 25, width: 15 },
          Hawaii: { left: -112, top: 25, width: 5 },
          'Puerto Rico': { left: -76, top: 26, width: 2 },
        })
        setLoaded(true)
      })
  }, [])

  const getOptions = useCallback((): EChartsOption => {
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}',
        padding: [7, 10],
        backgroundColor: getColor('card'),
        borderColor: getColor('default-300'),
        textStyle: { color: getColor('default-600') },
        borderWidth: 1,
        transitionDuration: 0,
      },
      textStyle: {
        fontFamily: getComputedStyle(document.body).fontFamily,
      },
      geo: {
        map: 'USA',
        roam: true,
        zoom: 1.2,
        center: [-98, 37],
        scaleLimit: { min: 1, max: 5 },
        itemStyle: {
          borderColor: getColor('default-300'),
          areaColor: getColor('chart-delta'),
        },
        label: { color: '#fff' },
        emphasis: {
          label: { show: true, color: '#fff' },
          itemStyle: { areaColor: getColor('chart-gamma') },
        },
      },
      series: [
        {
          name: 'USA Map',
          type: 'map',
          map: 'USA',
          geoIndex: 0,
          roam: true,
          zoom: 1.2,
          scaleLimit: { min: 1, max: 5 },
        },
      ],
    }
  }, [])

  return <>{loaded && <EChart extensions={[MapChart, GeoComponent, TooltipComponent, CanvasRenderer]} getOptions={getOptions} style={{ height: '400px' }} />}</>
}

export default UsaMap
