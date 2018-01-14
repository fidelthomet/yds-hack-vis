<template>
  <div class="page">
    <div ref="wrapper">
    <svg width="100%" height="100%">
      <g>
        <g class="tick" :transform="`translate(0 ${yScaleOffset(0)})`">
          <rect :width="width" height="1"></rect>
        </g>
        <g class="tick" v-for="tick in yTicks" :transform="`translate(0 ${yScaleOffset(tick * 1000000)})`">
          <text x="8" y="-4">{{tick}}</text>
          <rect :width="width" height="1"></rect>
        </g>
        <g class="tick" :transform="`translate(0 ${paddingTop})`">
          <text x="8" y="12">Spending in million €</text>
        </g>
      </g>
      <g class="sankey">
        <path v-for="path in paths" :d="path.path" :fill="color(path.name)"
          :fill-opacity="sector === path.name ? 0.7 : 0.2"
          @mouseover="sector = path.name" @mouseout="sector = null"></path>
      </g>
      <g>
        <g v-for="d in data" :transform="`translate(${xScale(d.year)} 0)`">
          <g v-for="s in d.sectors" :transform="`translate(0 ${yScaleOffset(s.offset)})`">
            <rect class="multi" :width="barWidth" :height="rectHeight(s.value)" :fill="color(s.name)"
              :fill-opacity="sector && sector !== s.name ? 0.4 : 1"></rect>
            <rect class="interaction" :x="-separation" :width="barWidth + separation * 2" :height="rectHeight(s.value)"
              @mouseover="sector = s.name; year = d.year" @mouseout="sector = null; year = null"></rect>
          </g>
          <text class="yearLabel" :y="height - paddingBottom + 16" :x="barWidth / 2">{{d.year}}</text>
        </g>
      </g>
      <g class="key" :transform="`translate(8 ${height - paddingBottom + 40})`">
        <g v-for="(s, i) in topSectors" :transform="keyTransform(i)">
          <circle r="5" cx="5" cy="-5" :fill="colors[i]"></circle>
          <text x="14">{{s}}</text>
        </g>
        <g :transform="keyTransform(8)">
          <circle r="5" cx="5" cy="-5" :fill="defaultColor"></circle>
          <text x="14">Other sectors</text>
        </g>
      </g>
    </svg>
  </div>
  <div class="tooltip" v-if="selected" :style="{background: color(sector), transform: tooltipTransform()}">
    <div>
      {{sector}}
    </div>
    <div>
      {{formatCurrency(selected.value)}}
    </div>
  </div>
  </div>
</template>

<script>
import * as d3 from 'd3'
import Data from 'data/data.json'

export default {
  data () {
    return {
      // width: 870,
      // height: 600,
      key: null,
      colors: ['#F2B701', '#A4561C', '#F17257', '#A8115D', '#5B5BB1', '#68B7EC', '#04A7A3', '#C4E169'],
      defaultColor: '#444',
      barWidth: 16,
      separation: 1,
      xPadding: 16,
      paddingTop: 8,
      paddingBottom: 88,
      sector: null,
      yTicks: [5, 10, 15, 20, 25, 30, 35].reverse(),
      year: null
    }
  },
  created () {
    console.log(this.data)
  },
  methods: {
    color (sector) {
      const index = this.topSectors.indexOf(sector)
      if (index === -1) return this.defaultColor
      return this.colors[index]
    },
    rectHeight (value) {
      return Math.max(this.yScale(value) - this.separation, 0)
    },
    keyTransform (i) {
      const x = ((this.width - this.xPadding * 2) / 3) * (i % 3)
      const y = ((20 * Math.floor(i / 3)))

      return `translate(${x} ${y})`
    },
    tooltipTransform () {
      let x = this.xScale(this.year)
      if (this.year > 2012) {
        x -= 1
        x = `calc(${x}px - 100%)`
      } else {
        x += this.barWidth + this.separation
        x = `${x}px`
      }
      const y = this.yScaleOffset(this.selected.offset)
      return `translate(${x}, ${y}px)`
    },
    formatCurrency (value) {
      d3.formatDefaultLocale({
        'decimal': '.',
        'thousands': ',',
        'grouping': [3],
        'currency': ['', ' €'],
        'dateTime': '%a %b %e %X %Y',
        'date': '%m/%d/%Y',
        'time': '%H:%M:%S',
        'periods': ['AM', 'PM'],
        'days': ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        'shortDays': ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        'months': ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        'shortMonths': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      })

      return d3.format('$,.0f')(value)
    }
  },
  computed: {
    width () {
      return window.innerWidth
    },
    height () {
      return window.innerHeight
    },
    years () {
      return [ ...new Set(Data.map(r => r.year)) ].sort((a, b) => a - b)
    },
    sectors () {
      return [ ...new Set(Data.map(r => r.Sector)) ].sort()
    },
    data () {
      return this.years.map(year => {
        let offset = 0
        const sectors = this.sectors.map(name => {
          const data = Data.find(d => d.year === year && d.Sector === name)
          const value = data === undefined ? 0 : data.value
          return {
            name, value
          }
        }).sort((a, b) => a.value - b.value)
          .map(({name, value}, i) => {
            offset += value
            const data = {name, value, offset}
            return data
          })
        return { year, sectors, total: offset }
      })
    },
    max () {
      return Math.max(...this.data.map(d => d.total))
    },
    xScale () {
      return d3.scaleLinear()
        .domain([Math.min(...this.years), Math.max(...this.years)])
        .range([this.xPadding, this.width - this.barWidth - this.xPadding])
    },
    yScale () {
      return d3.scaleLinear()
        .domain([0, this.max])
        .range([0, this.innerHeight])
    },
    yScaleOffset () {
      return d3.scaleLinear()
        .domain([0, this.max])
        .range([this.height - this.paddingBottom, this.paddingTop])
    },
    innerHeight () {
      return this.height - this.paddingBottom - this.paddingTop
    },
    topSectors () {
      return [ ...new Set(
        this.data.map(d =>
          d.sectors.filter((s, i) => i === d.sectors.length - 1 || s.value > 10000000)
            .map(s => s.name)
        ).reduce((a, b) =>
          a.concat(b)
        )
      ) ].sort()
    },
    paths () {
      return this.data.filter((d, i) => i > 0)
        .map((d2, i) => {
          const d1 = this.data[i]

          return d1.sectors.map(s1 => {
            const s2 = d2.sectors.find(s => s.name === s1.name)
            if (this.rectHeight(s1.value) === 0 && this.rectHeight(s2.value) === 0) return null

            const x1 = this.xScale(d1.year) + this.barWidth + this.separation
            const x2 = this.xScale(d2.year) - this.separation
            const xCenter = x1 + (x2 - x1) / 2
            const y1a = this.yScaleOffset(s1.offset - s1.value) - this.separation
            const y2a = this.yScaleOffset(s2.offset - s2.value) - this.separation
            const y1b = Math.min(this.yScaleOffset(s1.offset), this.height - this.paddingBottom - 1)
            const y2b = Math.min(this.yScaleOffset(s2.offset), this.height - this.paddingBottom - 1)
            const path = `M${x1},${y1a} C${xCenter},${y1a},${xCenter},${y2a},${x2},${y2a} L${x2},${y2b} C${xCenter},${y2b},${xCenter},${y1b},${x1},${y1b}`
            return {name: s1.name, path}
          })
            .filter(p => p !== null)
        })
        .reduce((a, b) =>
          a.concat(b)
        )
    },
    selected () {
      if (this.year === null || this.sector === null) return null
      return this.data.find(d => d.year === this.year).sectors.find(s => s.name === this.sector)
    }
  }
}
</script>
<style>
@import '../styles/main';
.page {
  text-align: left;

  svg {
    position: absolute;
    text {
      font-size: 0.8rem;
      text-anchor: middle;
    }
    .sankey {
      path {
        mix-blend-mode: multiply;
      }
    }
    .interaction {
      fill: none;
      pointer-events: all;
    }
    .multi {
      mix-blend-mode: multiply;
    }

    .tick {
      text {
        text-anchor: start;
        fill: #444;
      }
      rect {
        fill: #ddd;
      }
    }
    .key {
      text {
        text-anchor: start;
      }
    }
  }
  .tooltip {
    pointer-events: none;
    font-size: 0.8rem;
    color: #fff;
    padding: 8px 16px 8px 12px;
    position: absolute;
  }
}
</style>
