import user1 from '@/assets/images/users/user-1.jpg'
import { yupResolver } from '@hookform/resolvers/yup'
import { createContext, startTransition, use, useCallback, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'
const KanbanContext = createContext(undefined)
export const kanbanTaskSchema = yup.object({
  title: yup.string().required('Task title is required'),
})
export const kanbanSectionSchema = yup.object({
  sectionTitle: yup.string().required('Section title is required'),
})
const useKanbanContext = () => {
  const context = use(KanbanContext)
  if (!context) {
    throw new Error('useKanbanContext can only be used within KanbanProvider')
  }
  return context
}
const KanbanProvider = ({ children, tasksData, sectionsData }) => {
  const [sections, setSections] = useState(sectionsData)
  const [tasks, setTasks] = useState(tasksData)
  const [activeSectionId, setActiveSectionId] = useState()
  const [activeTaskId, setActiveTaskId] = useState()
  const [taskFormData, setTaskFormData] = useState()
  const [sectionFormData, setSectionFormData] = useState()
  const [dialogStates, setDialogStates] = useState({
    showNewTaskModal: false,
    showSectionModal: false,
  })
  const {
    control: newTaskControl,
    handleSubmit: newTaskHandleSubmit,
    reset: newTaskReset,
  } = useForm({
    resolver: yupResolver(kanbanTaskSchema),
  })
  const {
    control: sectionControl,
    handleSubmit: sectionHandleSubmit,
    reset: sectionReset,
  } = useForm({
    resolver: yupResolver(kanbanSectionSchema),
  })
  const emptySectionForm = useCallback(() => {
    sectionReset({
      sectionTitle: '',
    })
  }, [sectionReset])
  const emptyTaskForm = useCallback(() => {
    newTaskReset({
      title: undefined,
    })
  }, [newTaskReset])
  const toggleNewTaskModal = (sectionId, taskId) => {
    if (sectionId) setActiveSectionId(sectionId)
    if (taskId) {
      const foundTask = tasks.find((task) => task.id === taskId)
      if (foundTask) {
        newTaskReset({
          title: foundTask.title,
        })
        startTransition(() => {
          setActiveTaskId(taskId)
        })
        startTransition(() => {
          setTaskFormData(foundTask)
        })
      }
    }
    if (dialogStates.showNewTaskModal) emptyTaskForm()
    startTransition(() => {
      setDialogStates({
        ...dialogStates,
        showNewTaskModal: !dialogStates.showNewTaskModal,
      })
    })
  }
  const toggleSectionModal = (sectionId) => {
    if (sectionId) {
      const foundSection = sections.find((section) => section.id === sectionId)
      if (foundSection) {
        startTransition(() => {
          setSectionFormData(foundSection)
        })
        startTransition(() => {
          setActiveSectionId(foundSection.id)
        })
        sectionReset({
          sectionTitle: foundSection.title,
        })
      }
    }
    if (dialogStates.showSectionModal) emptySectionForm()
    startTransition(() => {
      setDialogStates({
        ...dialogStates,
        showSectionModal: !dialogStates.showSectionModal,
      })
    })
  }
  const getAllTasksPerSection = useCallback(
    (id) => {
      return tasks.filter((task) => task.sectionId == id)
    },
    [tasks]
  )
  const handleNewTask = newTaskHandleSubmit((values) => {
    if (activeSectionId) {
      const newTask = {
        id: Number(tasks.slice(-1)[0]?.id ?? 0) + 1 + '',
        sectionId: activeSectionId,
        title: values.title,
        category: {
          name: 'General',
          variant: 'primary',
          className: 'bg-success/15 text-success',
        },
        users: [user1],
        date: new Date().toDateString(),
        status: activeSectionId === '501' ? 'todo' : activeSectionId === '502' ? 'in-progress' : activeSectionId === '503' ? 'in-review' : 'done',
      }
      setTasks([...tasks, newTask])
    }
    toggleNewTaskModal()
    setActiveSectionId(undefined)
    newTaskReset()
  })
  const handleEditTask = newTaskHandleSubmit((values) => {
    if (activeTaskId) {
      setTasks(
        tasks.map((task) =>
          task.id === activeTaskId
            ? {
                ...task,
                title: values.title,
              }
            : task
        )
      )
    }
    toggleNewTaskModal()
    newTaskReset()
  })
  const handleDeleteTask = (taskId) => {
    setTasks(tasks.filter((task) => task.id !== taskId))
  }
  const onDragEnd = (result) => {
    const { destination, draggableId } = result
    if (!destination) return
    const taskIndex = tasks.findIndex((task) => String(task.id) === String(draggableId))
    if (taskIndex === -1) return
    const task = tasks[taskIndex]
    let newTasks = tasks.filter((t) => String(t.id) !== String(draggableId))
    const updatedTask = {
      ...task,
      sectionId: destination.droppableId,
    }
    let destIdx = 0
    let count = 0
    for (let i = 0; i < newTasks.length; i++) {
      if (newTasks[i].sectionId === destination.droppableId) {
        if (count === destination.index) {
          destIdx = i
          break
        }
        count++
      }
      if (i === newTasks.length - 1) {
        destIdx = newTasks.length
      }
    }
    newTasks = [...newTasks.slice(0, destIdx), updatedTask, ...newTasks.slice(destIdx)]
    setTasks(newTasks)
  }
  const handleNewSection = sectionHandleSubmit((values) => {
    const section = {
      // TODO test, test when array is empty
      id: Number(sections.slice(-1)[0].id) + 1 + '',
      title: values.sectionTitle,
    }
    setSections([...sections, section])
    startTransition(() => {
      toggleSectionModal()
    })
    sectionReset()
  })
  const handleEditSection = sectionHandleSubmit((values) => {
    if (activeSectionId) {
      const newSection = {
        id: activeSectionId,
        title: values.sectionTitle,
      }
      setSections(
        sections.map((section) => {
          return section.id === activeSectionId ? newSection : section
        })
      )
    }
    startTransition(() => {
      toggleSectionModal()
    })
    sectionReset()
  })
  const handleDeleteSection = (sectionId) => {
    setSections(sections.filter((section) => section.id !== sectionId))
  }
  return (
    <KanbanContext.Provider
      value={useMemo(
        () => ({
          sections,
          activeSectionId,
          taskFormData,
          sectionFormData,
          newTaskModal: {
            open: dialogStates.showNewTaskModal,
            toggle: toggleNewTaskModal,
          },
          sectionModal: {
            open: dialogStates.showSectionModal,
            toggle: toggleSectionModal,
          },
          taskForm: {
            control: newTaskControl,
            newRecord: handleNewTask,
            editRecord: handleEditTask,
            deleteRecord: handleDeleteTask,
          },
          sectionForm: {
            control: sectionControl,
            newRecord: handleNewSection,
            editRecord: handleEditSection,
            deleteRecord: handleDeleteSection,
          },
          getAllTasksPerSection,
          onDragEnd,
        }),
        [
          sections,
          activeSectionId,
          taskFormData,
          sectionFormData,
          dialogStates,
          toggleNewTaskModal,
          toggleSectionModal,
          newTaskControl,
          handleNewTask,
          handleEditTask,
          handleDeleteTask,
          sectionControl,
          handleNewSection,
          handleEditSection,
          handleDeleteSection,
          getAllTasksPerSection,
          onDragEnd,
        ]
      )}
    >
      {children}
    </KanbanContext.Provider>
  )
}
export { KanbanProvider, useKanbanContext }
