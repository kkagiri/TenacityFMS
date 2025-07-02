// Sample Data Service for Task Management Demo
// This service provides mock data functionality for the Task Management demo
// All operations are performed in-memory without backend API calls

class SampleDataService {
  // In-memory storage for mock tasks
  static mockTasks = [];
  static nextTaskId = 1;
  static isInitialized = false;

  // Sample users for assignment
  static sampleUsers = [
    { id: 'user1', name: 'John Smith', email: 'john.smith@example.com' },
    { id: 'user2', name: 'Sarah Johnson', email: 'sarah.johnson@example.com' },
    { id: 'user3', name: 'Mike Davis', email: 'mike.davis@example.com' },
    { id: 'technician1', name: 'Alex Wilson', email: 'alex.wilson@example.com' },
    { id: 'supervisor1', name: 'Lisa Brown', email: 'lisa.brown@example.com' }
  ];

  static sampleTaskTemplates = [
    {
      id: 1,
      title: "Tank Level Inspection - Site A",
      description: "Perform routine inspection of tank levels and identify any discrepancies. Check for leaks, gauge accuracy, and calibration status.",
      type: "Inspection",
      priority: "High",
      status: "Pending",
      assignedTo: null,
      assignedToName: null,
      createdOn: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      completedOn: null,
      completionNotes: null,
      siteId: 1,
      siteName: "Main Station",
      tankId: 1,
      tankName: "Tank A1",
      sourceType: "Manual",
      sourceId: null,
      estimatedDuration: 30
    },
    {
      id: 2,
      title: "Maintenance - Pump 3 Malfunction",
      description: "Pump 3 is showing irregular flow rates. Investigate and repair as necessary. Check electrical connections, filters, and mechanical components.",
      type: "Maintenance",
      priority: "Critical",
      status: "Pending",
      assignedTo: null,
      assignedToName: null,
      createdOn: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
      completedOn: null,
      completionNotes: null,
      siteId: 1,
      siteName: "Main Station",
      tankId: null,
      tankName: null,
      sourceType: "Issue",
      sourceId: 101,
      estimatedDuration: 120
    },
    {
      id: 3,
      title: "Investigate Tank 2 Stock Discrepancy",
      description: "Tank 2 shows a variance of -150L compared to expected levels. Investigate potential causes including meter accuracy, theft, or leakage.",
      type: "Discrepancy",
      priority: "Medium",
      status: "Pending",
      assignedTo: null,
      assignedToName: null,
      createdOn: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      completedOn: null,
      completionNotes: null,
      siteId: 2,
      siteName: "North Branch",
      tankId: 2,
      tankName: "Tank B2",
      sourceType: "Discrepancy",
      sourceId: 202,
      estimatedDuration: 90
    },
    {
      id: 4,
      title: "Monthly Stock Reconciliation",
      description: "Perform monthly stock reconciliation for all tanks. Verify physical stock against system records and document any variances.",
      type: "Stock",
      priority: "Medium",
      status: "Pending",
      assignedTo: null,
      assignedToName: null,
      createdOn: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      completedOn: null,
      completionNotes: null,
      siteId: null,
      siteName: "All Sites",
      tankId: null,
      tankName: null,
      sourceType: "Manual",
      sourceId: null,
      estimatedDuration: 180
    },
    {
      id: 5,
      title: "Calibrate Tank Gauges - Site B",
      description: "Annual calibration of tank gauges at Site B. Ensure all measurements are accurate and compliant with regulatory standards.",
      type: "Calibration",
      priority: "Low",
      status: "Pending",
      assignedTo: null,
      assignedToName: null,
      createdOn: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      completedOn: null,
      completionNotes: null,
      siteId: 2,
      siteName: "North Branch",
      tankId: null,
      tankName: null,
      sourceType: "Manual",
      sourceId: null,
      estimatedDuration: 60
    },
    {
      id: 6,
      title: "Transaction Correction - Incorrect Fuel Type",
      description: "Transaction ID 12345 recorded wrong fuel type. Correct the entry and update all related records including inventory calculations.",
      type: "TransactionCorrection",
      priority: "High",
      status: "Pending",
      assignedTo: null,
      assignedToName: null,
      createdOn: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
      completedOn: null,
      completionNotes: null,
      siteId: 1,
      siteName: "Main Station",
      tankId: 1,
      tankName: "Tank A1",
      sourceType: "Transaction",
      sourceId: 12345,
      estimatedDuration: 45
    },
    {
      id: 7,
      title: "Security System Check",
      description: "Perform weekly security system check including cameras, alarms, and access controls. Test all emergency procedures.",
      type: "Inspection",
      priority: "Medium",
      status: "Pending",
      assignedTo: null,
      assignedToName: null,
      createdOn: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      completedOn: null,
      completionNotes: null,
      siteId: 1,
      siteName: "Main Station",
      tankId: null,
      tankName: null,
      sourceType: "Manual",
      sourceId: null,
      estimatedDuration: 60
    },
    {
      id: 8,
      title: "Replace Faulty Dispensing Unit",
      description: "Dispensing unit 4 is malfunctioning and needs replacement. Order new unit and schedule installation during low-traffic hours.",
      type: "Maintenance",
      priority: "High",
      status: "Pending",
      assignedTo: null,
      assignedToName: null,
      createdOn: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
      completedOn: null,
      completionNotes: null,
      siteId: 2,
      siteName: "North Branch",
      tankId: null,
      tankName: null,
      sourceType: "Issue",
      sourceId: 102,
      estimatedDuration: 180
    },
    // Add some overdue tasks for testing
    {
      id: 9,
      title: "Overdue: Environmental Compliance Check",
      description: "Monthly environmental compliance check was missed. Urgent action required to maintain regulatory compliance.",
      type: "Inspection",
      priority: "Critical",
      status: "Overdue",
      assignedTo: null,
      assignedToName: null,
      createdOn: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago (overdue)
      completedOn: null,
      completionNotes: null,
      siteId: 1,
      siteName: "Main Station",
      tankId: null,
      tankName: null,
      sourceType: "Manual",
      sourceId: null,
      estimatedDuration: 45
    },
    {
      id: 10,
      title: "Overdue: Tank Cleaning Schedule",
      description: "Tank 3 was scheduled for cleaning last week. Reschedule and complete as soon as possible.",
      type: "Maintenance",
      priority: "High",
      status: "Overdue",
      assignedTo: null,
      assignedToName: null,
      createdOn: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago (overdue)
      completedOn: null,
      completionNotes: null,
      siteId: 2,
      siteName: "North Branch",
      tankId: 3,
      tankName: "Tank B3",
      sourceType: "Manual",
      sourceId: null,
      estimatedDuration: 240
    }
  ];

  // Initialize mock data
  static initialize() {
    if (!this.isInitialized) {
      this.mockTasks = [...this.sampleTaskTemplates];
      this.nextTaskId = Math.max(...this.mockTasks.map(t => t.id)) + 1;
      this.isInitialized = true;
      console.log('🚀 Sample Data Service initialized with mock data');
    }
  }

  // Get all tasks (mock implementation)
  static async getTasks() {
    this.initialize();
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: [...this.mockTasks],
          success: true,
          total: this.mockTasks.length
        });
      }, 100); // Simulate network delay
    });
  }

  // Create a new task (mock implementation)
  static async createTask(taskData) {
    this.initialize();
    return new Promise((resolve) => {
      setTimeout(() => {
        const newTask = {
          ...taskData,
          id: this.nextTaskId++,
          status: taskData.status || 'Pending',
          createdOn: new Date(),
          completedOn: null,
          completionNotes: null,
          assignedToName: taskData.assignedTo ? this.getUserName(taskData.assignedTo) : null
        };
        this.mockTasks.push(newTask);
        resolve(newTask);
      }, 200); // Simulate network delay
    });
  }

  // Assign a task (mock implementation)
  static async assignTask(taskId, assignmentData) {
    this.initialize();
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const task = this.mockTasks.find(t => t.id === taskId);
        if (task) {
          task.assignedTo = assignmentData.assignedTo;
          task.assignedToName = this.getUserName(assignmentData.assignedTo);
          task.dueDate = assignmentData.dueDate;
          task.status = 'Assigned';
          resolve(task);
        } else {
          reject(new Error('Task not found'));
        }
      }, 150);
    });
  }

  // Complete a task (mock implementation)
  static async completeTask(taskId, completionData) {
    this.initialize();
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const task = this.mockTasks.find(t => t.id === taskId);
        if (task) {
          task.status = 'Completed';
          task.completedOn = completionData.completedOn || new Date();
          task.completionNotes = completionData.completionNotes;
          resolve(task);
        } else {
          reject(new Error('Task not found'));
        }
      }, 150);
    });
  }

  // Delete a task (mock implementation)
  static async deleteTask(taskId) {
    this.initialize();
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = this.mockTasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
          const deletedTask = this.mockTasks.splice(index, 1)[0];
          resolve(deletedTask);
        } else {
          reject(new Error('Task not found'));
        }
      }, 100);
    });
  }

  // Helper method to get user name
  static getUserName(userId) {
    const user = this.sampleUsers.find(u => u.id === userId || u.email === userId);
    return user ? user.name : userId;
  }

  // Create sample tasks using mock data
  static async createSampleTasks() {
    this.initialize();
    console.log('🚀 Creating sample tasks for demonstration...');

    // Reset to initial state
    this.mockTasks = [...this.sampleTaskTemplates];
    this.nextTaskId = Math.max(...this.mockTasks.map(t => t.id)) + 1;

    console.log(`✅ Successfully loaded ${this.mockTasks.length} sample tasks`);

    return {
      created: this.mockTasks,
      errors: [],
      total: this.mockTasks.length
    };
  }

  static async assignRandomTasks() {
    this.initialize();
    console.log('🎯 Assigning tasks to users...');

    const assignedTasks = [];
    const errors = [];

    // Assign 60% of tasks randomly
    const tasksToAssign = this.mockTasks.slice(0, Math.floor(this.mockTasks.length * 0.6));

    for (const task of tasksToAssign) {
      if (task.assignedTo) continue; // Skip already assigned tasks

      try {
        const randomUser = this.sampleUsers[Math.floor(Math.random() * this.sampleUsers.length)];
        task.assignedTo = randomUser.email;
        task.assignedToName = randomUser.name;
        task.status = 'Assigned';
        assignedTasks.push({ taskId: task.id, assignedTo: randomUser.email });
        console.log(`✅ Assigned task "${task.title}" to ${randomUser.name}`);
      } catch (error) {
        console.error(`❌ Failed to assign task ${task.id}:`, error.message);
        errors.push({ taskId: task.id, error: error.message });
      }
    }

    console.log(`\n📊 Assignment Summary:`);
    console.log(`✅ Successfully assigned: ${assignedTasks.length} tasks`);
    console.log(`❌ Failed to assign: ${errors.length} tasks`);

    return {
      assigned: assignedTasks,
      errors: errors
    };
  }

  static async completeSampleTasks() {
    this.initialize();
    console.log('✅ Completing sample tasks...');

    const completedTasks = [];
    const errors = [];

    // Complete 30% of assigned tasks
    const assignedTasks = this.mockTasks.filter(task => task.assignedTo && task.status !== 'Completed');
    const tasksToComplete = assignedTasks.slice(0, Math.floor(assignedTasks.length * 0.3));

    for (const task of tasksToComplete) {
      try {
        const completionNotes = this.getRandomCompletionNote(task.type);
        task.status = 'Completed';
        task.completedOn = new Date();
        task.completionNotes = completionNotes;
        completedTasks.push(task.id);
        console.log(`✅ Completed task: ${task.title}`);
      } catch (error) {
        console.error(`❌ Failed to complete task ${task.id}:`, error.message);
        errors.push({ taskId: task.id, error: error.message });
      }
    }

    console.log(`\n📊 Completion Summary:`);
    console.log(`✅ Successfully completed: ${completedTasks.length} tasks`);
    console.log(`❌ Failed to complete: ${errors.length} tasks`);

    return {
      completed: completedTasks,
      errors: errors
    };
  }

  static getRandomCompletionNote(taskType) {
    const completionNotes = {
      'Inspection': [
        'Inspection completed successfully. All systems operating within normal parameters.',
        'Visual inspection passed. Minor cleaning performed. No issues detected.',
        'Comprehensive inspection completed. All safety requirements met.',
        'Routine inspection finished. Equipment functioning properly.'
      ],
      'Maintenance': [
        'Maintenance work completed. Equipment tested and operational.',
        'Repair completed successfully. System restored to full functionality.',
        'Preventive maintenance performed. All components checked and serviced.',
        'Maintenance task finished. Equipment performance improved.'
      ],
      'Discrepancy': [
        'Discrepancy investigated and resolved. Root cause identified and addressed.',
        'Issue resolved. Variance explained by measurement timing differences.',
        'Investigation completed. Corrective actions implemented.',
        'Discrepancy resolved through calibration adjustment.'
      ],
      'Stock': [
        'Stock reconciliation completed. All variances documented and explained.',
        'Inventory count finished. Records updated to reflect actual stock levels.',
        'Stock verification completed successfully.',
        'Physical count reconciled with system records.'
      ],
      'Calibration': [
        'Calibration completed successfully. All instruments within tolerance.',
        'Equipment calibrated to manufacturer specifications.',
        'Calibration procedure completed. Certificates updated.',
        'Precision instruments calibrated and certified.'
      ],
      'TransactionCorrection': [
        'Transaction corrected successfully. All related records updated.',
        'Data correction completed. System integrity maintained.',
        'Transaction adjustment made. Audit trail preserved.',
        'Correction applied. Financial reconciliation completed.'
      ]
    };

    const notes = completionNotes[taskType] || completionNotes['Inspection'];
    return notes[Math.floor(Math.random() * notes.length)];
  }

  static async generateFullSampleData() {
    console.log('🏗️ Starting full sample data generation for Task Management Demo...\n');

    try {
      // Step 1: Create sample tasks
      const createResult = await this.createSampleTasks();

      // Wait a bit to ensure tasks are created
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 2: Assign tasks to users
      const assignResult = await this.assignRandomTasks();

      // Wait a bit before completing tasks
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 3: Complete some tasks
      const completeResult = await this.completeSampleTasks();

      console.log('\n🎉 Sample data generation completed!');
      console.log(`\n📈 Final Statistics:`);
      console.log(`📝 Total tasks created: ${createResult.created.length}`);
      console.log(`👥 Tasks assigned: ${assignResult.assigned.length}`);
      console.log(`✅ Tasks completed: ${completeResult.completed.length}`);
      console.log(`\n🚀 Your Task Management demo is ready!`);

      return {
        created: createResult,
        assigned: assignResult,
        completed: completeResult
      };
    } catch (error) {
      console.error('❌ Error generating sample data:', error);
      throw error;
    }
  }

  // Utility method to clear all demo data (for resetting)
  static async clearSampleData() {
    this.initialize();
    console.log('🧹 Clearing sample data...');

    const deletedCount = this.mockTasks.length;
    this.mockTasks = [];
    this.nextTaskId = 1;

    console.log(`\n📊 Cleanup Summary:`);
    console.log(`🗑️ Successfully deleted: ${deletedCount} tasks`);

    return {
      deleted: Array.from({ length: deletedCount }, (_, i) => i + 1),
      errors: []
    };
  }

  // Additional utility methods for analytics
  static getTaskAnalytics() {
    this.initialize();
    const tasks = this.mockTasks;

    const analytics = {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'Pending').length,
      assigned: tasks.filter(t => t.status === 'Assigned').length,
      completed: tasks.filter(t => t.status === 'Completed').length,
      overdue: tasks.filter(t => t.status === 'Overdue' || (t.dueDate < new Date() && t.status !== 'Completed')).length,
      byType: {},
      byPriority: {},
      bySite: {}
    };

    // Group by type
    tasks.forEach(task => {
      analytics.byType[task.type] = (analytics.byType[task.type] || 0) + 1;
    });

    // Group by priority
    tasks.forEach(task => {
      analytics.byPriority[task.priority] = (analytics.byPriority[task.priority] || 0) + 1;
    });

    // Group by site
    tasks.forEach(task => {
      const site = task.siteName || 'Unassigned';
      analytics.bySite[site] = (analytics.bySite[site] || 0) + 1;
    });

    return analytics;
  }

  // Get tasks with pagination and filtering
  static getTasksPaginated(options = {}) {
    this.initialize();
    const { page = 1, pageSize = 10, status, type, priority, assignedTo } = options;

    let filteredTasks = [...this.mockTasks];

    // Apply filters
    if (status) {
      filteredTasks = filteredTasks.filter(t => t.status === status);
    }
    if (type) {
      filteredTasks = filteredTasks.filter(t => t.type === type);
    }
    if (priority) {
      filteredTasks = filteredTasks.filter(t => t.priority === priority);
    }
    if (assignedTo) {
      filteredTasks = filteredTasks.filter(t => t.assignedTo === assignedTo);
    }

    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedTasks = filteredTasks.slice(startIndex, endIndex);

    return {
      data: paginatedTasks,
      total: filteredTasks.length,
      page,
      pageSize,
      totalPages: Math.ceil(filteredTasks.length / pageSize)
    };
  }
}

export default SampleDataService;
