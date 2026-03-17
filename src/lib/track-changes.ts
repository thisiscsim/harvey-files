/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Vendored + patched from track-change-extension@1.0.3
 * Original: https://github.com/chenyuncai/tiptap-track-change-extension
 * Patched for TipTap v3 compatibility:
 *   - Replaced getSelfExt() with addStorage() pattern
 *   - Fixed addCommands to not use arrow function (preserves `this`)
 *   - Fixed onTransaction to use storage instead of extension lookup
 */
import { ReplaceStep, Step } from '@tiptap/pm/transform'
import { TextSelection, Plugin, PluginKey } from '@tiptap/pm/state'
import { Slice, Fragment } from '@tiptap/pm/model'
import { Extension, Mark, getMarkRange, getMarksBetween, isMarkActive, mergeAttributes } from '@tiptap/core'
import type { CommandProps, MarkRange } from '@tiptap/core'
import type { Transaction } from '@tiptap/pm/state'

const LOG_ENABLED = false

export const MARK_DELETION = 'deletion'
export const MARK_INSERTION = 'insertion'
export const EXTENSION_NAME = 'trackchange'

export const TRACK_COMMAND_ACCEPT = 'accept'
export const TRACK_COMMAND_ACCEPT_ALL = 'accept-all'
export const TRACK_COMMAND_REJECT = 'reject'
export const TRACK_COMMAND_REJECT_ALL = 'reject-all'

export type TRACK_COMMAND_TYPE = 'accept' | 'accept-all' | 'reject' | 'reject-all'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    trackchange: {
      setTrackChangeStatus: (enabled: boolean) => ReturnType
      getTrackChangeStatus: () => ReturnType
      toggleTrackChangeStatus: () => ReturnType
      acceptChange: () => ReturnType
      acceptAllChanges: () => ReturnType
      rejectChange: () => ReturnType
      rejectAllChanges: () => ReturnType
      updateOpUserOption: (opUserId: string, opUserNickname: string) => ReturnType
    }
  }
}

export const InsertionMark = Mark.create({
  name: MARK_INSERTION,
  addAttributes() {
    return {
      'data-op-user-id': { default: '' },
      'data-op-user-nickname': { default: '' },
      'data-op-date': { default: '' },
    }
  },
  parseHTML() {
    return [{ tag: 'insert' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['insert', mergeAttributes(HTMLAttributes), 0]
  },
})

export const DeletionMark = Mark.create({
  name: MARK_DELETION,
  addAttributes() {
    return {
      'data-op-user-id': { default: '' },
      'data-op-user-nickname': { default: '' },
      'data-op-date': { default: '' },
    }
  },
  parseHTML() {
    return [{ tag: 'delete' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['delete', mergeAttributes(HTMLAttributes), 0]
  },
})

const IME_STATUS_NORMAL = 0
const IME_STATUS_CONTINUE = 2
type IME_STATUS_TYPE = 0 | 1 | 2 | 3
let composingStatus: IME_STATUS_TYPE = 0
let isStartChineseInput = false

const getMinuteTime = () => Math.round(new Date().getTime() / 1000 / 60) * 1000 * 60

interface TrackStorage {
  enabled: boolean
  dataOpUserId: string
  dataOpUserNickname: string
  onStatusChange?: (enabled: boolean) => void
}

const getStorage = (editor: any): TrackStorage => editor.storage.trackchange

const changeTrack = (opType: TRACK_COMMAND_TYPE, param: CommandProps) => {
  const from = param.editor.state.selection.from
  const to = param.editor.state.selection.to

  let markRanges: Array<MarkRange> = []

  if ((opType === TRACK_COMMAND_ACCEPT || opType === TRACK_COMMAND_REJECT) && from === to) {
    const isInsertBeforeCursor = isMarkActive(param.editor.state, MARK_INSERTION)
    const isDeleteBeforeCursor = isMarkActive(param.editor.state, MARK_DELETION)
    let leftRange
    if (isInsertBeforeCursor) {
      leftRange = getMarkRange(param.editor.state.selection.$from, param.editor.state.doc.type.schema.marks.insertion)
    } else if (isDeleteBeforeCursor) {
      leftRange = getMarkRange(param.editor.state.selection.$from, param.editor.state.doc.type.schema.marks.deletion)
    }
    if (leftRange) {
      markRanges = getMarksBetween(leftRange.from, leftRange.to, param.editor.state.doc)
    }
  } else if (opType === TRACK_COMMAND_ACCEPT_ALL || opType === TRACK_COMMAND_REJECT_ALL) {
    markRanges = getMarksBetween(0, param.editor.state.doc.content.size, param.editor.state.doc)
    opType = opType === TRACK_COMMAND_ACCEPT_ALL ? TRACK_COMMAND_ACCEPT : TRACK_COMMAND_REJECT
  } else {
    markRanges = getMarksBetween(from, to, param.editor.state.doc)
  }

  markRanges = markRanges.filter(markRange => markRange.mark.type.name === MARK_DELETION || markRange.mark.type.name === MARK_INSERTION)
  if (!markRanges.length) return false

  const currentTr = param.tr
  let offset = 0
  const removeInsertMark = param.editor.state.doc.type.schema.marks.insertion.create()
  const removeDeleteMark = param.editor.state.doc.type.schema.marks.deletion.create()

  markRanges.forEach((markRange) => {
    const isAcceptInsert = opType === TRACK_COMMAND_ACCEPT && markRange.mark.type.name === MARK_INSERTION
    const isRejectDelete = opType === TRACK_COMMAND_REJECT && markRange.mark.type.name === MARK_DELETION
    if (isAcceptInsert || isRejectDelete) {
      currentTr.removeMark(markRange.from - offset, markRange.to - offset, removeInsertMark.type)
      currentTr.removeMark(markRange.from - offset, markRange.to - offset, removeDeleteMark.type)
    } else {
      currentTr.deleteRange(markRange.from - offset, markRange.to - offset)
      offset += (markRange.to - markRange.from)
    }
  })

  if (currentTr.steps.length) {
    currentTr.setMeta('trackManualChanged', true)
    const newState = param.editor.state.apply(currentTr)
    param.editor.view.updateState(newState)
  }
  return false
}

export const TrackChangeExtension = Extension.create<
  { enabled: boolean; onStatusChange?: (status: boolean) => void; dataOpUserId?: string; dataOpUserNickname?: string },
  TrackStorage
>({
  name: EXTENSION_NAME,

  addStorage() {
    return {
      enabled: this.options.enabled ?? false,
      dataOpUserId: this.options.dataOpUserId ?? '',
      dataOpUserNickname: this.options.dataOpUserNickname ?? '',
      onStatusChange: this.options.onStatusChange,
    }
  },

  onCreate() {
    if (this.storage.onStatusChange) {
      this.storage.onStatusChange(this.storage.enabled)
    }
  },

  addExtensions() {
    return [InsertionMark, DeletionMark]
  },

  addCommands() {
    return {
      setTrackChangeStatus: (enabled: boolean) => ({ editor }) => {
        const storage = getStorage(editor)
        storage.enabled = enabled
        if (storage.onStatusChange) {
          storage.onStatusChange(enabled)
        }
        return false
      },
      toggleTrackChangeStatus: () => ({ editor }) => {
        const storage = getStorage(editor)
        storage.enabled = !storage.enabled
        if (storage.onStatusChange) {
          storage.onStatusChange(storage.enabled)
        }
        return false
      },
      getTrackChangeStatus: () => ({ editor }) => {
        return getStorage(editor).enabled as any
      },
      acceptChange: () => (param) => {
        changeTrack('accept', param)
        return false
      },
      acceptAllChanges: () => (param) => {
        changeTrack('accept-all', param)
        return false
      },
      rejectChange: () => (param) => {
        changeTrack('reject', param)
        return false
      },
      rejectAllChanges: () => (param) => {
        changeTrack('reject-all', param)
        return false
      },
      updateOpUserOption: (opUserId: string, opUserNickname: string) => ({ editor }) => {
        const storage = getStorage(editor)
        storage.dataOpUserId = opUserId
        storage.dataOpUserNickname = opUserNickname
        return false
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('composing-check'),
        props: {
          handleDOMEvents: {
            compositionstart: () => {
              isStartChineseInput = true
            },
            compositionupdate: () => {
              composingStatus = IME_STATUS_CONTINUE
            },
          },
        },
      }),
    ]
  },

  onTransaction({ editor, transaction }: { editor: any; transaction: Transaction }) {
    const storage = getStorage(editor)

    const isChineseStart = isStartChineseInput && composingStatus === IME_STATUS_CONTINUE
    const isChineseInputting = !isStartChineseInput && composingStatus === IME_STATUS_CONTINUE
    const isNormalInput = composingStatus === IME_STATUS_NORMAL
    composingStatus = IME_STATUS_NORMAL
    isStartChineseInput = false

    if (!transaction.docChanged) return
    if (transaction.getMeta('trackManualChanged')) return
    if (transaction.getMeta('history$')) return
    const syncMeta = transaction.getMeta('y-sync$')
    if (syncMeta && syncMeta.isChangeOrigin) return
    if (!transaction.steps.length) return

    const isThisTrApplied = transaction.before !== editor.state.tr.doc
    const trackChangeEnabled = storage.enabled

    LOG_ENABLED && console.warn('Track change processing', transaction.steps.length)

    const allSteps = transaction.steps.map((step: Step) => Step.fromJSON(editor.state.doc.type.schema, step.toJSON()))
    const currentNewPos = transaction.selection.from

    let posOffset = 0
    let hasAddAndDelete = false

    allSteps.forEach((step: Step, _index: number) => {
      if (step instanceof ReplaceStep) {
        let delCount = 0
        if (step.from !== step.to) {
          const slice = transaction.docs[_index].slice(step.from, step.to)
          slice.content.forEach((node: any) => {
            const isInsertNode = node.marks.find((m: any) => m.type.name === MARK_INSERTION)
            if (!isInsertNode) {
              delCount += node.nodeSize
            }
          })
        }
        posOffset += delCount
        const newCount = step.slice ? step.slice.size : 0
        if (newCount && delCount) {
          hasAddAndDelete = true
        }
      }
    })

    if (isNormalInput) {
      if (!hasAddAndDelete) posOffset = 0
    } else if (isChineseStart) {
      if (!hasAddAndDelete) posOffset = 0
    } else if (isChineseInputting) {
      posOffset = 0
    }

    const newChangeTr = isThisTrApplied ? editor.state.tr : transaction

    let reAddOffset = 0
    allSteps.forEach((step: Step, index: number) => {
      if (step instanceof ReplaceStep) {
        const invertedStep = step.invert(transaction.docs[index])
        if (step.slice.size) {
          const insertionMark = editor.state.doc.type.schema.marks.insertion.create({
            'data-op-user-id': storage.dataOpUserId,
            'data-op-user-nickname': storage.dataOpUserNickname,
            'data-op-date': getMinuteTime(),
          })
          const deletionMark = editor.state.doc.type.schema.marks.deletion.create()
          const from = step.from + reAddOffset
          const to = step.from + reAddOffset + step.slice.size
          if (trackChangeEnabled) {
            newChangeTr.addMark(from, to, insertionMark)
          } else {
            newChangeTr.removeMark(from, to, insertionMark.type)
          }
          newChangeTr.removeMark(from, to, deletionMark.type)
        }
        if (step.from !== step.to && trackChangeEnabled) {
          const skipSteps: Array<ReplaceStep> = []

          const reAddStep = new ReplaceStep(
            invertedStep.from + reAddOffset,
            invertedStep.from + reAddOffset,
            invertedStep.slice,
            (invertedStep as any).structure,
          )

          let addedEmptyOffset = 0
          const travelContent = (content: Fragment, parentOffset: number) => {
            content.forEach((node: any, offset: number) => {
              const start = parentOffset + offset
              const end = start + node.nodeSize
              if (node.content && node.content.size) {
                travelContent(node.content, start)
              } else {
                if (node.marks.find((m: any) => m.type.name === MARK_INSERTION)) {
                  skipSteps.push(new ReplaceStep(start - addedEmptyOffset, end - addedEmptyOffset, Slice.empty))
                  addedEmptyOffset += node.nodeSize
                  reAddOffset -= node.nodeSize
                }
              }
            })
          }
          travelContent(invertedStep.slice.content, invertedStep.from)
          reAddOffset += invertedStep.slice.size

          newChangeTr.step(reAddStep)
          const { from } = reAddStep
          const to = from + reAddStep.slice.size
          newChangeTr.addMark(from, to, newChangeTr.doc.type.schema.marks.deletion.create({
            'data-op-user-id': storage.dataOpUserId,
            'data-op-user-nickname': storage.dataOpUserNickname,
            'data-op-date': getMinuteTime(),
          }))
          skipSteps.forEach((s) => {
            newChangeTr.step(s)
          })
        }
        const newState = editor.state.apply(newChangeTr)
        editor.view.updateState(newState)
      }
    })

    const finalNewPos = trackChangeEnabled ? (currentNewPos + posOffset) : currentNewPos
    if (trackChangeEnabled) {
      const trWithChange = editor.view.state.tr
      trWithChange.setSelection(TextSelection.create(editor.view.state.doc, finalNewPos))
      const newStateWithNewSelection = editor.view.state.apply(trWithChange)
      editor.view.updateState(newStateWithNewSelection)
    }
    if (isChineseStart && hasAddAndDelete && trackChangeEnabled) {
      editor.commands.deleteSelection()
      editor.commands.blur()
      setTimeout(() => {
        editor.commands.focus()
      }, 100)
    }
  },
})

export default TrackChangeExtension
