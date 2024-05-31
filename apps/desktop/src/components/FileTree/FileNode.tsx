import { createFile, type IFile } from '@/helper/filesys'
import { NodeRendererProps } from 'react-arborist'
import { NodeContainer } from './styles'
import { invoke } from '@tauri-apps/api/core'
import { showContextMenu } from '../UI/ContextMenu'
import { nanoid } from 'nanoid'
import { SimpleTree } from './SimpleTree'
import NewFileInput from './NewFIleInput'
import { useTranslation } from 'react-i18next'
import NiceModal from '@ebay/nice-modal-react'
import { MODAL_CONFIRM_ID } from '../Modal'
import { useEditorStore } from '@/stores'

function FileNode({
  style,
  node,
  dragHandle,
  tree,
  simpleTree,
  setFolderData,
}: NodeRendererProps<IFile> & {
  simpleTree: SimpleTree<IFile>
  setFolderData: any
}) {
  const indentSize = Number.parseFloat(`${style.paddingLeft || 0}`)
  const { t } = useTranslation()
  const { deleteNode } = useEditorStore()

  const delFileHandler = () => {
    deleteNode(node.data).then(() => {
      simpleTree.drop({ id: node.id })
      setFolderData(simpleTree.data)
    })
  }

  const isPending = node.data.kind === 'pending_new_file' || node.data.kind === 'pending_new_folder'
  const createType = node.data.kind === 'pending_new_folder' ? 'dir' : 'file'

  return (
    <NodeContainer
      style={style}
      highlight={
        !!(
          tree.dragDestinationParent?.isAncestorOf(node) &&
          tree.dragDestinationParent?.id !== tree.dragNode?.parent?.id
        )
      }
      selected={tree.selectedNodes.includes(node)}
      onContextMenu={(e) => {
        e.stopPropagation()
        e.preventDefault()
        const items = []

        if (node.parent) {
          items.push(
            {
              label: t('contextmenu.explorer.add_file'),
              value: 'new_file',
              handler: () => {
                if (node.parent) {
                  const data = { id: nanoid(), name: '', kind: 'pending_new_file' } as any
                  if (node.isInternal) {
                    node.open()
                  }
                  const parentId = node.isInternal ? node.id : node.parent.id

                  simpleTree.create({
                    parentId,
                    data
                  })
                  tree.create({
                    parentId,
                    index: 0,
                  })

                  setFolderData(simpleTree.data)
                }
              },
            },
            {
              label: t('contextmenu.explorer.add_folder'),
              value: 'new_folder',
              handler: () => {
                if (node.parent) {
                  const data = { id: nanoid(), name: '', kind: 'pending_new_folder', children: [] } as any
                  if (node.isInternal) {
                    node.open()
                  }
                  const parentId = node.isInternal ? node.id : node.parent.id

                  simpleTree.create({
                    parentId,
                    data
                  })
                  tree.create({
                    parentId,
                    index: 0,
                    type: 'internal',
                  })

                  setFolderData(simpleTree.data)
                }
              },
            },
          )
        }
        items.push({
          value: node.data.kind === 'dir' ? 'delete_folder' : 'delete_file',
          label:
            node.data.kind === 'dir'
              ? t('contextmenu.explorer.delete_folder')
              : t('contextmenu.explorer.delete_file'),
          handler: () => {
            NiceModal.show(MODAL_CONFIRM_ID, {
              title: t('confirm.delete.description', {
                name: node.data.name,
                something: node.data.kind === 'dir' ? t('common.folder') : t('common.file'),
              }),
              onConfirm: delFileHandler,
            })
          },
        })

        showContextMenu({
          x: e.clientX,
          y: e.clientY,
          items,
        })
      }}
      onClick={(e) => {
        if (e.shiftKey) {
          return
        }
        node.isInternal && node.toggle()
      }}
      ref={dragHandle}
    >
      <div style={{ display: 'flex', paddingLeft: '6px' }}>
        <div className='indentLines'>
          {new Array(indentSize / 16).fill(0).map((_, index) => {
            return <div key={index}></div>
          })}
        </div>

        {isPending ? (
          <NewFileInput
            style={{ paddingTop: 0, paddingBottom: 0 }}
            fileNode={node.data}
            createType={createType}
            parentNode={node.parent?.data}
            onCreate={async (file) => {
              if (createType === 'dir') {
                await invoke('create_folder', {
                  path: file.path,
                })
              } else {
                await invoke('write_file', {
                  filePath: file.path,
                  content: '',
                })
              }
              const targetFile = createFile({
                path: file.path,
                name: file.name,
                content: '',
                id: node.id,
                kind: file.kind,
              })

              simpleTree.update({
                id: node.id,
                changes: { ...node.data, ...targetFile },
              })
              setFolderData(simpleTree.data)
            }}
            onCancel={() => {
              simpleTree.drop({ id: node.id })
              setFolderData(simpleTree.data)
            }}
          />
        ) : (
          <>
            {node.data?.kind === 'dir' ? (
              <i className={`${node.isOpen ? 'ri-folder-5-line' : 'ri-folder-3-line'} file-icon`} />
            ) : (
              <i className={`ri-markdown-fill file-icon`} />
            )}
            {node.data.name}
          </>
        )}
      </div>
    </NodeContainer>
  )
}

export default FileNode
