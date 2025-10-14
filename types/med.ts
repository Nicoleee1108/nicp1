export interface Med {
  id: string;
  name: string;
  usage: string;
  dosagePerIntake: number;
  timesPerDay: number;
  reminders: Reminder[];
}

export interface Reminder {
  notificationId: string;
  hour: number;
  minute: number;
}

