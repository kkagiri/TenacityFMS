-- Cursor - Create tasks table MySQL script
CREATE TABLE `tasks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `type` tinyint(4) NOT NULL DEFAULT 0 COMMENT '0=Manual, 1=Maintenance, 2=Discrepancy, 3=Stock, 4=Inspection, 5=Calibration, 6=TransactionCorrection',
  `priority` tinyint(4) NOT NULL DEFAULT 1 COMMENT '0=Low, 1=Medium, 2=High, 3=Critical',
  `status` tinyint(4) NOT NULL DEFAULT 0 COMMENT '0=Pending, 1=InProgress, 2=Completed, 3=Cancelled, 4=Overdue, 5=NeedsApproval',
  `assigned_to` varchar(450) DEFAULT NULL,
  `assigned_by` varchar(450) DEFAULT NULL,
  `assigned_on` datetime DEFAULT NULL,
  `due_date` datetime DEFAULT NULL,
  `source_type` varchar(50) DEFAULT NULL COMMENT 'Discrepancy, Issue, Manual, TransactionCorrection',
  `source_id` int(11) DEFAULT NULL,
  `site_id` int(11) DEFAULT NULL,
  `tank_id` int(11) DEFAULT NULL,
  `completed_on` datetime DEFAULT NULL,
  `completed_by` varchar(450) DEFAULT NULL,
  `completion_notes` text DEFAULT NULL,
  `created_by` varchar(450) NOT NULL,
  `created_on` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` varchar(450) DEFAULT NULL,
  `updated_on` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_assigned_to` (`assigned_to`),
  KEY `idx_status_priority` (`status`, `priority`),
  KEY `idx_site_tank` (`site_id`, `tank_id`),
  KEY `idx_source` (`source_type`, `source_id`),
  KEY `idx_due_date` (`due_date`),
  KEY `idx_created_on` (`created_on`),
  CONSTRAINT `fk_tasks_assigned_to` FOREIGN KEY (`assigned_to`) REFERENCES `aspnetusers` (`Id`) ON DELETE SET NULL,
  CONSTRAINT `fk_tasks_assigned_by` FOREIGN KEY (`assigned_by`) REFERENCES `aspnetusers` (`Id`) ON DELETE SET NULL,
  CONSTRAINT `fk_tasks_created_by` FOREIGN KEY (`created_by`) REFERENCES `aspnetusers` (`Id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_tasks_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `aspnetusers` (`Id`) ON DELETE SET NULL,
  CONSTRAINT `fk_tasks_completed_by` FOREIGN KEY (`completed_by`) REFERENCES `aspnetusers` (`Id`) ON DELETE SET NULL,
  CONSTRAINT `fk_tasks_site` FOREIGN KEY (`site_id`) REFERENCES `sites` (`Id`) ON DELETE SET NULL,
  CONSTRAINT `fk_tasks_tank` FOREIGN KEY (`tank_id`) REFERENCES `tanks` (`Id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create indexes for performance
CREATE INDEX `idx_tasks_overdue` ON `tasks` (`due_date`, `status`) WHERE `due_date` < NOW() AND `status` NOT IN (2, 3);
CREATE INDEX `idx_tasks_active` ON `tasks` (`status`, `assigned_to`) WHERE `status` IN (0, 1, 4);
CREATE INDEX `idx_tasks_priority_status` ON `tasks` (`priority`, `status`, `created_on`);

-- Insert sample data for testing (optional)
-- INSERT INTO `tasks` (`title`, `description`, `type`, `priority`, `status`, `assigned_to`, `created_by`)
-- VALUES ('Sample Task', 'This is a sample task for testing', 0, 1, 0, 'user-id', 'admin-user-id');