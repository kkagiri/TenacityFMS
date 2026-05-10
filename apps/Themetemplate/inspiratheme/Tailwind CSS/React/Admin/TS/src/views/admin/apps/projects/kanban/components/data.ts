import kanban1 from '@/assets/images/kanban/img-1.png'
import kanban2 from '@/assets/images/kanban/img-2.png'
import kanban3 from '@/assets/images/kanban/img-3.png'
import kanban4 from '@/assets/images/kanban/img-4.png'
import user1 from '@/assets/images/users/user-1.jpg'
import user2 from '@/assets/images/users/user-2.jpg'
import user3 from '@/assets/images/users/user-3.jpg'
import user4 from '@/assets/images/users/user-4.jpg'
import user5 from '@/assets/images/users/user-5.jpg'
import user6 from '@/assets/images/users/user-6.jpg'
import user7 from '@/assets/images/users/user-7.jpg'
import user8 from '@/assets/images/users/user-8.jpg'
import user9 from '@/assets/images/users/user-9.jpg'
import { ChildrenType } from '@/types/index'
import { DropResult } from '@hello-pangea/dnd'
import { BaseSyntheticEvent } from 'react'
import { Control } from 'react-hook-form'

export type KanbanProviderProps = {
  sectionsData: KanbanSectionType[]
  tasksData: KanbanTaskType[]
} & ChildrenType

export type KanbanDialogType = {
  showNewTaskModal: boolean
  showSectionModal: boolean
}

export type KanbanTaskType = {
  id: string
  sectionId: KanbanSectionType['id']
  category: {
    name: string
    progressClassName: string
    className: string
  }
  title: string
  users: string[]
  date: string
  image?: string
  status: 'todo' | 'in-progress' | 'done' | 'in-review'
  progress?: number
}

export type KanbanSectionType = {
  id: string
  title: string
}

export type FormControlSubmitType = {
  control: Control<any>
  newRecord: (values: BaseSyntheticEvent) => void
  editRecord: (values: BaseSyntheticEvent) => void
  deleteRecord: (id: string) => void
}

export type KanbanType = {
  sections: KanbanSectionType[]
  activeSectionId: KanbanSectionType['id'] | undefined
  newTaskModal: {
    open: boolean
    toggle: (sectionId?: KanbanSectionType['id'], taskId?: KanbanTaskType['id']) => void
  }
  sectionModal: {
    open: boolean
    toggle: (sectionId?: KanbanSectionType['id']) => void
  }
  taskFormData: KanbanTaskType | undefined
  sectionFormData: KanbanSectionType | undefined
  taskForm: FormControlSubmitType
  sectionForm: FormControlSubmitType
  getAllTasksPerSection: (sectionId: KanbanSectionType['id']) => KanbanTaskType[]
  onDragEnd: (result: DropResult) => void
}

export const kanbanSectionsData: KanbanSectionType[] = [
  {
    id: '501',
    title: 'To Do',
  },
  {
    id: '502',
    title: 'In Progress',
  },
  {
    id: '503',
    title: 'In Review',
  },
  {
    id: '504',
    title: 'Done',
  },
]

export const kanbanTaskData: KanbanTaskType[] = [
  {
    id: '1',
    sectionId: '501',
    category: {
      name: 'Design',
      progressClassName: 'bg-success',
      className: 'bg-success/15 text-success',
    },
    title: 'AI Analytics Dashboard',
    users: [user2, user3, user5, user1],
    date: '25 May, 2025',
    status: 'todo',
    progress: 65,
  },
  {
    id: '2',
    sectionId: '501',
    category: {
      name: 'Development',
      progressClassName: 'bg-warning',
      className: 'bg-warning/15 text-warning',
    },
    title: 'Marketing Landing Page Redesign',
    users: [user6, user4, user8],
    date: '10 Jun, 2025',
    image: kanban1,
    status: 'todo',
  },
  {
    id: '3',
    sectionId: '501',
    category: {
      name: 'UI/UX',
      progressClassName: 'bg-info',
      className: 'bg-info/15 text-info',
    },
    title: 'E-Commerce Website Redesign',
    users: [user4, user6, user7, user8],
    date: '28 May, 2025',
    status: 'todo',
  },
  {
    id: '4',
    sectionId: '501',
    category: {
      name: 'App Development',
      progressClassName: 'bg-warning',
      className: 'bg-warning/15 text-warning',
    },
    title: 'Mobile App Redesign',
    users: [user1, user2, user3],
    date: '30 May, 2025',
    status: 'todo',
    progress: 80,
  },
  {
    id: '5',
    sectionId: '501',
    category: {
      name: 'Marketing',
      progressClassName: 'bg-primary',
      className: 'bg-purple/15 text-purple',
    },
    title: 'CRM System Upgrade',
    users: [user4],
    date: '30 May, 2025',
    image: kanban2,
    status: 'todo',
    progress: 45,
  },

  {
    id: '6',
    sectionId: '502',
    category: {
      name: 'Testing',
      progressClassName: 'bg-info',
      className: 'bg-info/15 text-info',
    },
    title: 'E-commerce Website QA Testing',
    users: [user3, user7, user9],
    date: '18 Jun, 2025',
    status: 'in-progress',
  },
  {
    id: '7',
    sectionId: '502',
    category: {
      name: 'UI/UX',
      progressClassName: 'bg-info',
      className: 'bg-info/15 text-info',
    },
    title: 'Mobile App Redesign',
    users: [user5, user2, user3, user9],
    date: '10 Jun, 2025',
    status: 'in-progress',
  },
  {
    id: '8',
    sectionId: '502',
    category: {
      name: 'UI/UX Design',
      progressClassName: 'bg-success',
      className: 'bg-success/15 text-success',
    },
    title: 'Website User Experience Overhaul',
    users: [user4, user5, user6],
    date: '15 June, 2025',
    status: 'in-progress',
    progress: 55,
  },
  {
    id: '9',
    sectionId: '502',
    category: {
      name: 'Marketing',
      progressClassName: 'bg-danger',
      className: 'bg-danger/15 text-danger',
    },
    title: 'Customer Engagement Platform Development',
    users: [user5, user6],
    date: '10 June, 2025',
    status: 'in-progress',
  },

  {
    id: '10',
    sectionId: '503',
    category: {
      name: 'Design',
      progressClassName: 'bg-success',
      className: 'bg-success/15 text-success',
    },
    title: 'AI Analytics Dashboard',
    users: [user2, user3, user5, user1],
    date: '25 May, 2025',
    image: kanban3,
    status: 'in-review',
    progress: 65,
  },
  {
    id: '11',
    sectionId: '503',
    category: {
      name: 'Development',
      progressClassName: 'bg-warning',
      className: 'bg-warning/15 text-warning',
    },
    title: 'Marketing Landing Page Redesign',
    users: [user6, user4, user8],
    date: '10 Jun, 2025',
    status: 'in-review',
  },
  {
    id: '12',
    sectionId: '503',
    category: {
      name: 'UI/UX',
      progressClassName: 'bg-info',
      className: 'bg-info/15 text-info',
    },
    title: 'E-Commerce Website Redesign',
    users: [user4, user6, user7, user8],
    date: '28 May, 2025',
    status: 'in-review',
  },
  {
    id: '13',
    sectionId: '504',
    category: {
      name: 'Testing',
      progressClassName: 'bg-info',
      className: 'bg-info/15 text-info',
    },
    title: 'E-commerce Website QA Testing',
    users: [user3, user7, user9],
    date: '18 Jun, 2025',
    status: 'done',
  },
  {
    id: '14',
    sectionId: '504',
    category: {
      name: 'UI/UX',
      progressClassName: 'bg-info',
      className: 'bg-warning/15 text-warning',
    },
    title: 'Mobile App Redesign',
    users: [user5, user2, user3, user9],
    date: '10 Jun, 2025',
    image: kanban4,
    status: 'done',
  },
]
