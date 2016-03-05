var document = require('global/document')
var domcss = require('dom-css')

var SVGNS = 'http://www.w3.org/2000/svg'
var BOOL_PROPS = {
  autofocus: 1,
  checked: 1,
  defaultchecked: 1,
  disabled: 1,
  formnovalidate: 1,
  indeterminate: 1,
  readonly: 1,
  required: 1,
  willvalidate: 1
}
var SVG_TAGS = [
  'svg',
  'altGlyph', 'altGlyphDef', 'altGlyphItem', 'animate', 'animateColor',
  'animateMotion', 'animateTransform', 'circle', 'clipPath', 'color-profile',
  'cursor', 'defs', 'desc', 'ellipse', 'feBlend', 'feColorMatrix',
  'feComponentTransfer', 'feComposite', 'feConvolveMatrix', 'feDiffuseLighting',
  'feDisplacementMap', 'feDistantLight', 'feFlood', 'feFuncA', 'feFuncB',
  'feFuncG', 'feFuncR', 'feGaussianBlur', 'feImage', 'feMerge', 'feMergeNode',
  'feMorphology', 'feOffset', 'fePointLight', 'feSpecularLighting',
  'feSpotLight', 'feTile', 'feTurbulence', 'filter', 'font', 'font-face',
  'font-face-format', 'font-face-name', 'font-face-src', 'font-face-uri',
  'foreignObject', 'glyph', 'glyphRef', 'hkern', 'image', 'line',
  'linearGradient', 'marker', 'mask', 'metadata', 'missing-glyph', 'mpath',
  'path', 'pattern', 'polygon', 'polyline', 'radialGradient', 'rect',
  'set', 'stop', 'switch', 'symbol', 'text', 'textPath', 'title', 'tref',
  'tspan', 'use', 'view', 'vkern'
]

module.exports = function belCreate (opts) {
  opts = opts || {}
  var raw = opts.raw === true

  return function belCreateElement (tag, props, children) {
    var calls = []
    var el

    // If an svg tag, it needs a namespace
    if (SVG_TAGS.indexOf(tag) !== -1) {
      props.namespace = SVGNS
    }

    // If we are using a namespace
    var ns = false
    if (props.namespace) {
      ns = props.namespace
      delete props.namespace
    }

    // Create the element
    if (ns) {
      if (raw) {
        calls.push(['createElementNS', ns, tag])
      } else {
        el = document.createElementNS(ns, tag)
      }
    } else {
      if (raw) {
        calls.push(['createElement', tag])
      } else {
        el = document.createElement(tag)
      }
    }

    // Create the properties
    for (var p in props) {
      if (props.hasOwnProperty(p)) {
        var key = p.toLowerCase()
        var val = props[p]
        // Normalize className
        if (key === 'classname') {
          key = 'class'
          p = 'class'
        }
        // If a pseudo inline style, apply the styles
        if (key === 'style' && typeof val !== 'string') {
          if (raw) {
            calls.push(['style', val])
          } else {
            domcss(el, val)
          }
          continue
        }
        // If a property is boolean, set itself to the key
        if (BOOL_PROPS[key]) {
          if (val === 'true') val = key
          else if (val === 'false') continue
        }
        // If a property prefers being set directly vs setAttribute
        if (key.slice(0, 2) === 'on') {
          if (raw) {
            calls.push(['expr', p, val])
          } else {
            el[p] = val
          }
        } else {
          if (ns) {
            if (raw) {
              calls.push(['setAttributeNS', null, p, val])
            } else {
              el.setAttributeNS(null, p, val)
            }
          } else {
            if (raw) {
              calls.push(['setAttribute', p, val])
            } else {
              el.setAttribute(p, val)
            }
          }
        }
      }
    }

    function appendChild (childs) {
      if (!Array.isArray(childs)) return
      for (var i = 0; i < childs.length; i++) {
        var node = childs[i]
        if (Array.isArray(node)) {
          appendChild(node)
          continue
        }

        if (typeof node === 'number' ||
          typeof node === 'boolean' ||
          node instanceof Date ||
          node instanceof RegExp) {
          node = node.toString()
        }

        if (typeof node === 'string') {
          if (raw) {
            calls.push(['createTextNode', node])
          } else {
            node = document.createTextNode(node)
          }
        }

        if (node && node.nodeName && node.nodeType) {
          if (raw) {
            calls.push(['appendChild', node])
          } else {
            el.appendChild(node)
          }
        }
      }
    }
    appendChild(children)

    // TODO: Validation checks
    // TODO: Check for a11y things

    return (raw) ? calls : el
  }
}
