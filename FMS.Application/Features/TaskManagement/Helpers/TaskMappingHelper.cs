using System;
using System.Collections.Generic;
using System.Linq;
using FMS.Application.ModelsDTOs.FMS.Task;
using FMS.Domain.Entities;

namespace FMS.Application.Features.TaskManagement.Helpers {
    public static class TaskMappingHelper {
        /// <summary>
        /// Maps a Task entity to TaskDTO
        /// </summary>
        /// <param name="task">The task entity to map</param>
        /// <returns>Mapped TaskDTO</returns>
        public static TaskDTO MapTaskToDto (TaskEntity task) {
            if (task == null) {
                throw new ArgumentNullException (nameof (task));
            }

            return new TaskDTO {
                Id = task.Id,
                    Title = task.Title,
                    Description = task.Description,
                    Type = task.Type.ToString (),
                    Priority = task.Priority.ToString (),
                    Status = task.Status.ToString (),
                    AssignedTo = task.AssignedTo,
                    AssignedBy = task.AssignedBy,
                    AssignedOn = task.AssignedOn,
                    DueDate = task.DueDate,
                    SiteId = task.SiteId,
                    TankId = task.TankId,
                    SourceType = task.SourceType,
                    SourceId = task.SourceId,
                    CompletionNotes = task.CompletionNotes,
                    CreatedBy = task.CreatedBy,
                    CreatedOn = task.CreatedOn,
                    UpdatedBy = task.UpdatedBy,
                    UpdatedOn = task.UpdatedOn,
                    CompletedOn = task.CompletedOn
            };
        }

        /// <summary>
        /// Maps a collection of Task entities to TaskDTO collection
        /// </summary>
        /// <param name="tasks">The task entities to map</param>
        /// <returns>Mapped TaskDTO collection</returns>
        public static IEnumerable<TaskDTO> MapTasksToDto (IEnumerable<TaskEntity> tasks) {
            return tasks?.Select (MapTaskToDto) ?? Enumerable.Empty<TaskDTO> ();
        }
    }
}