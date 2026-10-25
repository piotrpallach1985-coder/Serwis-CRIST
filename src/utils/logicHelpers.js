import { safeParseDate } from './dateHelpers';

// 1. Ujednolicenie stanow niskich i brakow (Source of Truth)
export const checkInventoryStatus = (part, totalReserved = 0) => {
  if (!part) return { isOut: false, isLow: false, isOk: true, available: 0 };
  
  const stock = Number(part.stock) || 0;
  const available = part.available !== undefined ? Number(part.available) : (stock - totalReserved);
  const minStock = Number(part.minStock) || 0;

  const isOut = available <= 0;
  const isLow = available <= minStock && !isOut;
  
  return {
    isOut,
    isLow,
    isOk: !isOut && !isLow,
    stock,
    available,
    minStock
  };
};

// 2. Ujednolicenie ostrzezen serwisowych (Source of Truth)
export const checkServiceUrgency = (service, machine, customWarningDays = 30) => {
  if (!service) return { isOverdue: false, isUpcoming: false, daysLeft: null, hoursLeft: null, message: '' };

  const now = new Date();
  let daysLeft = null;
  let hoursLeft = null;
  let isOverdue = false;
  let isUpcoming = false;
  let message = '';

  if (service.triggerType === 'calendar' || service.triggerType === 'mixed') {
    if (service.nextDate) {
      const nextDate = safeParseDate(service.nextDate);
      if (nextDate) {
        const diff = (nextDate - now) / (1000 * 60 * 60 * 24);
        daysLeft = Math.ceil(diff);
        
        if (daysLeft < 0) {
          isOverdue = true;
          message = `Przeterminowany o ${Math.abs(daysLeft)} dni`;
        } else if (daysLeft <= customWarningDays) {
          isUpcoming = true;
          message = `Zbliża się termin (zostało ${daysLeft} dni)`;
        }
      }
    }
  }

  if (!isOverdue && (service.triggerType === 'hours' || service.triggerType === 'mixed')) {
    if (service.targetWorkHours && machine?.currentWorkHours !== undefined) {
      const hLeft = service.targetWorkHours - machine.currentWorkHours;
      hoursLeft = hLeft;
      const isKmCounter = machine?.counterUnit === 'km';
      const unitLabel = isKmCounter ? 'km' : 'rbg';
      const warningThreshold = isKmCounter ? 1000 : 50;

      if (hoursLeft < 0) {
        isOverdue = true;
        message = `Przekroczono o ${Math.abs(hoursLeft)} ${unitLabel}!`;
      } else if (hoursLeft <= warningThreshold) {
        isUpcoming = true;
        message = `Zbliża się termin (zostało ${hoursLeft} ${unitLabel})`;
      }
    }
  }

  return {
    isOverdue,
    isUpcoming,
    daysLeft,
    hoursLeft,
    message
  };
};
