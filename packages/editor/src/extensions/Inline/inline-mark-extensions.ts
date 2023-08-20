import type { KeyBindingProps, MarkExtensionSpec, NodeView, NodeViewMethod } from '@remirror/core'
import { MarkExtension, keyBinding } from '@remirror/core'

import { formatHref } from './format-href'
import { toggleInlineMark } from './inline-mark-commands'
import { LineHtmlInlineExtension } from '../HtmlInline'

const commonAttrs = {
  depth: { default: 0 },
}
const endpointAttrs = {
  depth: { default: 0 },
  first: { default: false },
  last: { default: false },
}

class MetaKey extends MarkExtension {
  static disableExtraAttributes = true
  get name() {
    return 'mdMark' as const
  }
  createMarkSpec(): MarkExtensionSpec {
    return {
      inclusive: false,
      attrs: endpointAttrs,
      toDOM: () => ['span', { class: 'md-mark' }, 0],
    }
  }

  createCommands() {
    return {
      toggleInlineMark: toggleInlineMark,
    }
  }
}

class PlainText extends MarkExtension {
  static disableExtraAttributes = true
  get name() {
    return 'mdText' as const
  }
  createMarkSpec(): MarkExtensionSpec {
    return {
      attrs: endpointAttrs,
      toDOM: () => ['span', 0],
    }
  }
}

class Emphasis extends MarkExtension {
  static disableExtraAttributes = true
  get name() {
    return 'mdEm' as const
  }
  createMarkSpec(): MarkExtensionSpec {
    return {
      attrs: commonAttrs,
      toDOM: () => ['em', 0],
    }
  }

  @keyBinding({ shortcut: "mod-i", command: 'toggleEmphasis' })
  shortcut(props: KeyBindingProps): boolean {
    return toggleInlineMark(this.name)(props)
  }
}

class Strong extends MarkExtension {
  static disableExtraAttributes = true
  get name() {
    return 'mdStrong' as const
  }
  createMarkSpec(): MarkExtensionSpec {
    return {
      attrs: commonAttrs,
      toDOM: () => ['strong', 0],
    }
  }

  @keyBinding({ shortcut: "mod-b", command: 'toggleStrong' })
  shortcut(props: KeyBindingProps): boolean {
    return toggleInlineMark(this.name)(props)
  }
}

class CodeText extends MarkExtension {
  static disableExtraAttributes = true
  get name() {
    return 'mdCodeText' as const
  }
  createMarkSpec(): MarkExtensionSpec {
    return {
      attrs: commonAttrs,
      toDOM: () => ['code', 0],
    }
  }

  @keyBinding({ shortcut: "mod-e", command: 'toggleCodeText' })
  shortcut(props: KeyBindingProps): boolean {
    return toggleInlineMark(this.name)(props)
  }
}

class CodeSpace extends MarkExtension {
  static disableExtraAttributes = true
  get name() {
    return 'mdCodeSpace' as const
  }
  createMarkSpec(): MarkExtensionSpec {
    return {
      attrs: commonAttrs,
      toDOM: () => ['span', 0],
    }
  }
}

class Delete extends MarkExtension {
  static disableExtraAttributes = true
  get name() {
    return 'mdDel' as const
  }
  createMarkSpec(): MarkExtensionSpec {
    return {
      attrs: commonAttrs,
      toDOM: () => ['del', 0],
    }
  }

  @keyBinding({ shortcut: "mod-shift-s", command: 'toggleDelete' })
  shortcut(props: KeyBindingProps): boolean {
    return toggleInlineMark(this.name)(props)
  }
}

class LinkText extends MarkExtension {
  static disableExtraAttributes = true
  get name() {
    return 'mdLinkText' as const
  }
  createMarkSpec(): MarkExtensionSpec {
    return {
      attrs: {
        ...commonAttrs,
        href: {
          default: '',
        },
      },
      toDOM: (mark) => [
        'a',
        {
          href: mark.attrs.href,
        },
        0,
      ],
    }
  }
}

class LinkUri extends MarkExtension {
  static disableExtraAttributes = true
  get name() {
    return 'mdLinkUri' as const
  }
  createMarkSpec(): MarkExtensionSpec {
    return {
      spanning: false,
      attrs: commonAttrs,
      toDOM: () => ['a', { class: 'md-link' }, 0],
    }
  }
}

class ImgText extends MarkExtension {
  static disableExtraAttributes = true
  get name() {
    return 'mdImgText' as const
  }
  createMarkSpec(): MarkExtensionSpec {
    return {
      spanning: false,
      attrs: commonAttrs,
      toDOM: () => ['span', { class: 'md-img-text' }, 0],
    }
  }
}

class ImgUri extends MarkExtension {
  static disableExtraAttributes = true
  get name() {
    return 'mdImgUri' as const
  }
  createMarkSpec(): MarkExtensionSpec {
    return {
      spanning: false,
      attrs: {
        ...commonAttrs,
        href: {
          default: '',
        },
      },
    }
  }
  createNodeViews = (): NodeViewMethod => {
    return (mark): NodeView => {
      const innerContainer = document.createElement('span')

      const img = document.createElement('img')
      img.setAttribute('src', formatHref(mark.attrs.href))

      const outerContainer = document.createElement('span')
      outerContainer.appendChild(img)
      outerContainer.appendChild(innerContainer)
      outerContainer.setAttribute('class', 'md-img-uri')

      return { dom: outerContainer, contentDOM: innerContainer }
    }
  }
}

const autoHideMarks: Record<string, true> = {
  mdMark: true,
  mdLinkUri: true,
  mdImgText: true,
  mdImgUri: true,
  mdHtmlInline: true
}

export function isAutoHideMark(name: string): boolean {
  // This should be the fastest way based on my performance test.
  return autoHideMarks[name]
}

export const markExtensions = [
  new MetaKey(),
  new PlainText(),
  new Emphasis(),
  new Strong(),
  new CodeText(),
  new CodeSpace(),
  new Delete(),
  new LinkText(),
  new LinkUri(),
  new ImgText(),
  new ImgUri(),
  new LineHtmlInlineExtension()
]
export type LineMarkExtension = (typeof markExtensions)[number]
export type LineMarkName = LineMarkExtension['name']
export type LineMarkAttrs = {
  depth: number

  first?: boolean
  last?: boolean

  href?: string

  htmlText?: string
}
