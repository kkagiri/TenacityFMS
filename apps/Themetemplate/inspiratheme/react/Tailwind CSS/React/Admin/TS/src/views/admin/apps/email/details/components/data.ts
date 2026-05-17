export const toolbarButtonData: { title: string; icon: string }[] = [
  { title: 'Bold', icon: 'bold' },
  { title: 'Italic', icon: 'italic' },
  { title: 'Attach files', icon: 'paperclip' },
  { title: 'Insert link', icon: 'link' },
  { title: 'Insert photo', icon: 'photo-up' },
]

export type ActionType = {
  icon: string
  label: string
}

export const emailActionData: ActionType[] = [
  {
    icon: 'trash',
    label: 'Delete',
  },
  {
    icon: 'mail-opened',
    label: 'Mark as Read',
  },
  {
    icon: 'archive',
    label: 'Archive',
  },
  {
    icon: 'folder',
    label: 'Move to Folder',
  },
]
