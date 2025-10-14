export function defaultTimesFor(timesPerDay: number): Date[] {
  const times: Date[] = [];
  const now = new Date();
  
  const defaultHours = [9, 13, 17]; 
  const maxTimes = Math.min(timesPerDay, 3);
  
  for (let i = 0; i < maxTimes; i++) {
    const time = new Date(now);
    time.setHours(defaultHours[i], 0, 0, 0);
    times.push(time);
  }
  
  return times;
}
